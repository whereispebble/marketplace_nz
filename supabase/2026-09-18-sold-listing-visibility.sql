-- Keep sold listings in public marketplace results for 24 hours.
-- Apply after the existing 2026-09-17 migrations.
begin;

alter table public.products add column if not exists sold_at timestamptz;

-- Existing sold rows use their last known update as the best available sale time.
update public.products
set sold_at = coalesce(sold_at, updated_at, created_at, now())
where status = 'sold' and sold_at is null;

create or replace function public.sync_product_sold_at()
returns trigger language plpgsql set search_path = '' as $function$
begin
  if new.status = 'sold' and (tg_op = 'INSERT' or old.status is distinct from 'sold') then
    new.sold_at = now();
  elsif new.status is distinct from 'sold' then
    new.sold_at = null;
  end if;
  return new;
end $function$;

drop trigger if exists products_sync_sold_at on public.products;
create trigger products_sync_sold_at
before insert or update of status on public.products
for each row execute function public.sync_product_sold_at();

create index if not exists products_public_status_sold_at_idx
on public.products(status, sold_at desc)
where status = 'sold';

commit;
