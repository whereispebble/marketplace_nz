-- Apply after launch-hardening. Selecting a resolved address replaces the manual pin checkbox.
-- location_confirmed records a resolved selection; it is not proof of physical presence.
alter table public.products drop constraint if exists products_location_source_check;
alter table public.products add constraint products_location_source_check check (
  location_source is null or location_source in ('map', 'gps', 'manual', 'address')
);
