-- Latest location model: a selected locality and valid lat/lng; no GPS accuracy metadata.
-- Only needed remotely if the previous location migrations were applied.
begin;
alter table public.products drop constraint if exists products_gps_accuracy_check;
alter table public.products drop column if exists location_accuracy_m;
alter table public.products drop constraint if exists products_published_location_check;
alter table public.products add constraint products_published_location_check check (
  status in ('draft', 'paused') or (
    lat is not null and lng is not null and lat between -90 and 90 and lng between -180 and 180
  )
) not valid;

-- Update only policies/constraints introduced by our earlier hardening migration.
do $migration$
begin
  if exists (select 1 from pg_constraint where conrelid='public.products'::regclass and conname='products_published_complete') then
    alter table public.products drop constraint products_published_complete;
    alter table public.products add constraint products_published_complete check (
      status in ('draft','paused') or (
        price is not null and price > 0 and lat is not null and lng is not null and
        coalesce(length(btrim(make)),0)>0 and coalesce(length(btrim(model)),0)>0 and
        coalesce(length(btrim(location)),0)>0 and images is not null and jsonb_array_length(images) between 1 and 5
      )
    ) not valid;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_select_published_or_own') then
    drop policy products_select_published_or_own on public.products;
    create policy products_select_published_or_own on public.products for select using (
      auth.uid()=user_id or (status in ('available','reserved','sold') and lat between -90 and 90 and lng between -180 and 180)
    );
  end if;
  if to_regprocedure('public.start_conversation(uuid,uuid)') is not null then
    execute $definition$create or replace function public.start_conversation(p_product_id uuid default null, p_seller_id uuid default null)
returns public.chats language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); seller uuid; result public.chats;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if p_product_id is not null then
    select user_id into seller from public.products where id = p_product_id and status in ('available', 'reserved') and lat between -90 and 90 and lng between -180 and 180;
    if seller is null then raise exception 'Listing unavailable'; end if;
    if p_seller_id is not null and p_seller_id <> seller then raise exception 'Seller mismatch'; end if;
  else
    select id into seller from public.profiles where id = p_seller_id;
  end if;
  if seller is null or seller = caller then raise exception 'Invalid recipient'; end if;
  perform pg_advisory_xact_lock(hashtextextended(least(caller::text, seller::text) || greatest(caller::text, seller::text) || coalesce(p_product_id::text, 'direct'), 0));
  select * into result from public.chats where product_id is not distinct from p_product_id
    and ((buyer_id = caller and seller_id = seller)
      or (p_product_id is null and buyer_id = seller and seller_id = caller))
    order by created_at limit 1;
  if result.id is null then
    insert into public.chats (product_id, buyer_id, seller_id) values (p_product_id, caller, seller) returning * into result;
  end if;
  return result;
end $$;
$definition$;
  end if;
end $migration$;
notify pgrst, 'reload schema';
commit;
