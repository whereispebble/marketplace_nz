-- Targeted fix for missing products location columns (PGRST204 / 42703).
-- Run the complete file in the SQL Editor of the configured Supabase project.
-- Preserves existing rows and permissions. Does not replace launch-hardening.
begin;

alter table public.products
  add column if not exists location_confirmed boolean not null default false,
  add column if not exists location_source text,
  add column if not exists location_accuracy_m numeric;

alter table public.products drop constraint if exists products_location_source_check;
alter table public.products add constraint products_location_source_check check (
  location_source is null or location_source in ('map', 'gps', 'manual', 'address')
);
alter table public.products drop constraint if exists products_gps_accuracy_check;
alter table public.products add constraint products_gps_accuracy_check check (
  location_source is distinct from 'gps' or
  (location_accuracy_m is not null and location_accuracy_m between 0 and 50)
);

-- Historical rows are not marked precise automatically. New/updated published
-- rows must have a resolved point. Audit legacy rows before VALIDATE CONSTRAINT.
alter table public.products drop constraint if exists products_published_location_check;
alter table public.products add constraint products_published_location_check check (
  status in ('draft', 'paused') or (
    location_confirmed is true and location_source is not null and
    lat is not null and lng is not null and
    lat between -90 and 90 and lng between -180 and 180
  )
) not valid;

notify pgrst, 'reload schema';
commit;

-- Verification: all three fields must appear in the result.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'products'
  and column_name in ('location_confirmed', 'location_source', 'location_accuracy_m')
order by column_name;
