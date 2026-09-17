-- Apply AFTER all existing schema/security migrations, in staging first.
-- Entire migration is atomic. Invalid existing data must be repaired explicitly.
begin;
alter table public.products
  add column if not exists location_confirmed boolean not null default false,
  add column if not exists location_source text,
  add column if not exists location_accuracy_m numeric;
alter table public.products drop constraint if exists products_location_source_check;
alter table public.products add constraint products_location_source_check check (
  location_source is null or location_source in ('map', 'gps', 'manual')
);
alter table public.products drop constraint if exists products_gps_accuracy_check;
alter table public.products add constraint products_gps_accuracy_check check (
  location_source is distinct from 'gps' or (location_accuracy_m is not null and location_accuracy_m between 0 and 50)
);
-- Town centroids from existing rows are not silently declared exact.
do $$ declare p record; begin
  for p in select policyname, tablename from pg_policies where schemaname='public'
    and tablename in ('products', 'product_images') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;
create policy products_select_published_or_own on public.products for select using (
  auth.uid() = user_id or (status in ('available','reserved','sold') and location_confirmed)
);
create policy products_insert_own on public.products for insert to authenticated with check (user_id = auth.uid());
create policy products_update_own on public.products for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy products_delete_own on public.products for delete to authenticated using (user_id = auth.uid());
create policy product_images_select_visible on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id)
);

-- Remove every existing policy on these two sensitive tables, including legacy names.
do $$ declare p record; begin
  for p in select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('profiles', 'chats', 'favorites', 'messages', 'user_reports') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;
alter table public.profiles enable row level security;
alter table public.chats enable row level security;
create policy profiles_read_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_edit_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, location, phone, bio, avatar_url) on public.profiles to authenticated;
-- Profiles are created only by the auth trigger. Users cannot forge reputation/email.
revoke all on public.public_profiles from public, anon, authenticated;
grant select (id, username, location, bio, avatar_url, rating, total_sales, joined, created_at) on public.public_profiles to anon, authenticated;

create policy chats_read_participant on public.chats for select to authenticated
  using (auth.uid() in (buyer_id, seller_id));
-- Only start_conversation may create chats. Participants cannot be replaced.
revoke all on public.chats from public, anon, authenticated;
grant select on public.chats to authenticated;

create or replace function public.start_conversation(p_product_id uuid default null, p_seller_id uuid default null)
returns public.chats language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); seller uuid; result public.chats;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if p_product_id is not null then
    select user_id into seller from public.products where id = p_product_id and status in ('available', 'reserved') and location_confirmed;
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
revoke all on function public.start_conversation(uuid, uuid) from public, anon;
grant execute on function public.start_conversation(uuid, uuid) to authenticated;

create policy messages_select_participant on public.messages for select to authenticated using (
  exists (select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id))
);
create policy messages_insert_participant on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id))
);
create policy messages_update_recipient on public.messages for update to authenticated using (
  sender_id <> auth.uid() and exists (select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id))
) with check (sender_id <> auth.uid() and exists (select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy user_reports_insert_own on public.user_reports for insert to authenticated with check (reporter_id = auth.uid());
create policy user_reports_select_own on public.user_reports for select to authenticated using (reporter_id = auth.uid());

-- RLS limits rows; column privileges separately prevent editing content/senders.
revoke all on public.messages from public, anon, authenticated;
grant select on public.messages to authenticated;
grant insert (chat_id, sender_id, content) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check check (length(btrim(content)) between 1 and 5000);

create or replace function public.touch_chat_after_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end $$;
revoke all on function public.touch_chat_after_message() from public, anon, authenticated;
drop trigger if exists messages_touch_chat on public.messages;
create trigger messages_touch_chat after insert on public.messages for each row execute function public.touch_chat_after_message();

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);
create unique index if not exists offers_one_pending on public.offers(chat_id) where status = 'pending';
alter table public.offers enable row level security;
drop policy if exists offers_read_participant on public.offers;
create policy offers_read_participant on public.offers for select to authenticated using (
  exists (select 1 from public.chats c where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id))
);
drop policy if exists offers_create_buyer on public.offers;
create policy offers_create_buyer on public.offers for insert to authenticated with check (
  buyer_id = auth.uid() and status = 'pending' and exists (
    select 1 from public.chats c join public.products p on p.id = c.product_id
    where c.id = chat_id and c.buyer_id = auth.uid() and p.status in ('available', 'reserved')
  )
);
drop policy if exists offers_decide_seller on public.offers;
create policy offers_decide_seller on public.offers for update to authenticated
using (status = 'pending' and exists (select 1 from public.chats c where c.id = chat_id and c.seller_id = auth.uid()))
with check (status in ('accepted', 'declined') and exists (select 1 from public.chats c where c.id = chat_id and c.seller_id = auth.uid()));
revoke all on public.offers from public, anon, authenticated;
grant select on public.offers to authenticated;
grant insert (chat_id, buyer_id, amount) on public.offers to authenticated;
grant update (status) on public.offers to authenticated;

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check check (status is not null and status in ('draft', 'paused', 'available', 'reserved', 'sold'));
alter table public.products drop constraint if exists products_coords_check;
alter table public.products add constraint products_coords_check check (
  (lat is null and lng is null) or (lat is not null and lng is not null and lat between -90 and 90 and lng between -180 and 180)
);
alter table public.products drop constraint if exists products_title_check;
alter table public.products add constraint products_title_check check (length(btrim(title)) between 1 and 200);
-- New and updated records must meet these rules; audit legacy records before VALIDATE.
alter table public.products drop constraint if exists products_published_complete;
alter table public.products add constraint products_published_complete check (
  status in ('draft', 'paused') or
  (location_confirmed and location_source is not null and price is not null and price > 0 and lat is not null and lng is not null and
   coalesce(length(btrim(make)), 0) > 0 and coalesce(length(btrim(model)), 0) > 0 and
   coalesce(length(btrim(location)), 0) > 0 and images is not null and jsonb_array_length(images) between 1 and 5)
) not valid;

-- The product row and its image projection change in one transaction.
create or replace function public.sync_product_images()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.images is null or jsonb_typeof(new.images) <> 'array' then raise exception 'Invalid images'; end if;
  if jsonb_array_length(new.images) > 5 then raise exception 'Too many images'; end if;
  if exists (select 1 from jsonb_array_elements(new.images) value where jsonb_typeof(value) <> 'string' or (value #>> '{}') !~ '^https://') then
    raise exception 'Invalid image URL';
  end if;
  if new.image is distinct from (new.images ->> 0) then raise exception 'Cover must match first image'; end if;
  delete from public.product_images where product_id = new.id;
  insert into public.product_images(product_id, image_url, sort_order)
    select new.id, value, (ordinality - 1)::integer from jsonb_array_elements_text(new.images) with ordinality;
  return new;
end $$;
revoke all on function public.sync_product_images() from public, anon, authenticated;
drop trigger if exists products_sync_images on public.products;
create trigger products_sync_images after insert or update of images, image on public.products
for each row execute function public.sync_product_images();
revoke insert, update, delete on public.product_images from public, anon, authenticated;

-- Restore a real foreign key; any old mock/non-UUID ID aborts for explicit cleanup.
alter table public.favorites alter column product_id type uuid using product_id::uuid;
alter table public.favorites drop constraint if exists favorites_product_id_fkey;
alter table public.favorites add constraint favorites_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade not valid;
create policy favorites_select_own on public.favorites for select to authenticated using (user_id = auth.uid());
create policy favorites_delete_own on public.favorites for delete to authenticated using (user_id = auth.uid());
create policy favorites_insert_own on public.favorites for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.products p where p.id = product_id and p.status in ('available', 'reserved', 'sold'))
);
create policy favorites_update_own on public.favorites for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from public.products p where p.id = product_id and p.status in ('available', 'reserved', 'sold')));
revoke all on public.favorites from public, anon, authenticated;
grant select, insert, update, delete on public.favorites to authenticated;

revoke all on public.user_reports from public, anon, authenticated;
grant select on public.user_reports to authenticated;
grant insert (reported_user_id, reporter_id, reason, details) on public.user_reports to authenticated;
alter table public.user_reports drop constraint if exists user_reports_reported_user_id_fkey;
alter table public.user_reports add constraint user_reports_reported_user_id_fkey foreign key (reported_user_id) references auth.users(id) on delete cascade not valid;

-- Image uploads accept raster images only, with server-enforced size limits.
update storage.buckets set file_size_limit = 4194304, allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'avatars';
update storage.buckets set file_size_limit = 8388608, allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'product-images';

-- Never derive a public username from someone's email address.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, username)
  values (new.id, new.email, coalesce(nullif(btrim(new.raw_user_meta_data->>'username'), ''), 'user-' || new.id::text));
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create table if not exists public.saved_searches (
  user_id uuid primary key references auth.users(id) on delete cascade,
  searches jsonb not null default '[]'::jsonb check (jsonb_typeof(searches) = 'array' and jsonb_array_length(searches) <= 8 and octet_length(searches::text) <= 65536)
);
alter table public.saved_searches enable row level security;
drop policy if exists saved_searches_own on public.saved_searches;
create policy saved_searches_own on public.saved_searches for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.saved_searches from public, anon, authenticated;
grant select, insert, update, delete on public.saved_searches to authenticated;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  topic text not null check (length(topic) between 1 and 60),
  message text not null check (length(btrim(message)) between 1 and 5000),
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.support_requests enable row level security;
drop policy if exists support_requests_create_own on public.support_requests;
create policy support_requests_create_own on public.support_requests for insert to authenticated with check (user_id = auth.uid());
revoke all on public.support_requests from public, anon, authenticated;
grant insert (user_id, name, email, topic, message) on public.support_requests to authenticated;
commit;
