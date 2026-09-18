-- Privacy-safe aggregate engagement for listing detail pages.
begin;

create table if not exists public.product_views (
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  primary key (product_id, user_id)
);

alter table public.product_views enable row level security;
revoke all on public.product_views from public, anon, authenticated;

create or replace function public.get_product_engagement(
  p_product_id uuid,
  p_record_view boolean default false
)
returns table(view_count bigint, favorite_count bigint)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  listing_owner uuid;
begin
  select p.user_id into listing_owner
  from public.products p
  where p.id = p_product_id
    and (p.user_id = auth.uid() or (p.status in ('available','reserved','sold') and p.location_confirmed));

  if listing_owner is null then return; end if;

  if p_record_view and auth.uid() is not null and auth.uid() is distinct from listing_owner then
    insert into public.product_views(product_id, user_id)
    values (p_product_id, auth.uid())
    on conflict do nothing;
  end if;

  return query select
    (select count(*) from public.product_views v where v.product_id = p_product_id),
    (select count(*) from public.favorites f where f.product_id = p_product_id);
end
$function$;

revoke all on function public.get_product_engagement(uuid, boolean) from public;
grant execute on function public.get_product_engagement(uuid, boolean) to anon, authenticated;

commit;
