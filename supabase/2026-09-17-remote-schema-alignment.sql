-- Aligns the real remote schema shared on 2026-09-17 with the current frontend.
-- Run after 2026-09-17-messaging.sql and 2026-09-17-chat-completion.sql.
begin;

-- Account and listing deletion semantics: preserve audit/history where useful,
-- cascade private dependent data, and never leave blocking references.
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles add constraint profiles_id_fkey foreign key(id) references auth.users(id) on delete cascade;
alter table public.products drop constraint if exists products_user_id_fkey;
alter table public.products add constraint products_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.product_images drop constraint if exists product_images_product_id_fkey;
alter table public.product_images add constraint product_images_product_id_fkey foreign key(product_id) references public.products(id) on delete cascade;
alter table public.chats drop constraint if exists chats_product_id_fkey;
alter table public.chats add constraint chats_product_id_fkey foreign key(product_id) references public.products(id) on delete set null;
alter table public.chats drop constraint if exists chats_buyer_id_fkey;
alter table public.chats add constraint chats_buyer_id_fkey foreign key(buyer_id) references auth.users(id) on delete cascade;
alter table public.chats drop constraint if exists chats_seller_id_fkey;
alter table public.chats add constraint chats_seller_id_fkey foreign key(seller_id) references auth.users(id) on delete cascade;
alter table public.messages drop constraint if exists messages_chat_id_fkey;
alter table public.messages add constraint messages_chat_id_fkey foreign key(chat_id) references public.chats(id) on delete cascade;
alter table public.messages drop constraint if exists messages_sender_id_fkey;
alter table public.messages add constraint messages_sender_id_fkey foreign key(sender_id) references auth.users(id) on delete cascade;
alter table public.offers drop constraint if exists offers_chat_id_fkey;
alter table public.offers add constraint offers_chat_id_fkey foreign key(chat_id) references public.chats(id) on delete cascade;
alter table public.offers drop constraint if exists offers_buyer_id_fkey;
alter table public.offers add constraint offers_buyer_id_fkey foreign key(buyer_id) references auth.users(id) on delete cascade;
alter table public.reviews drop constraint if exists reviews_product_id_fkey;
alter table public.reviews add constraint reviews_product_id_fkey foreign key(product_id) references public.products(id) on delete set null;
alter table public.reviews drop constraint if exists reviews_chat_id_fkey;
alter table public.reviews add constraint reviews_chat_id_fkey foreign key(chat_id) references public.chats(id) on delete cascade;
do $optional_reports$
begin
  if to_regclass('public.reports') is not null then
    alter table public.reports drop constraint if exists reports_product_id_fkey;
    alter table public.reports add constraint reports_product_id_fkey foreign key(product_id) references public.products(id) on delete set null;
  end if;
end $optional_reports$;

-- Favorites: remove unusable mock/orphan IDs before adding real referential integrity.
do $favorites_type$
declare current_type text;
begin
  select data_type into current_type from information_schema.columns
  where table_schema='public' and table_name='favorites' and column_name='product_id';
  if current_type='text' then
    delete from public.favorites where product_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
    delete from public.favorites f where not exists(select 1 from public.products p where p.id=f.product_id::uuid);
    alter table public.favorites alter column product_id type uuid using product_id::uuid;
  else
    delete from public.favorites f where not exists(select 1 from public.products p where p.id=f.product_id);
  end if;
end $favorites_type$;
alter table public.favorites drop constraint if exists favorites_product_id_fkey;
alter table public.favorites add constraint favorites_product_id_fkey foreign key(product_id) references public.products(id) on delete cascade;
alter table public.favorites drop constraint if exists favorites_user_id_fkey;
alter table public.favorites add constraint favorites_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
create unique index if not exists favorites_user_product_idx on public.favorites(user_id,product_id);

-- Supabase stores now() in UTC. Normalize timestamp columns so browsers do not
-- reinterpret the same instant differently by local timezone.
do $timestamps$
declare item record;
begin
  for item in select * from (values
    ('profiles','created_at'),('products','created_at'),('favorites','created_at'),
    ('chats','created_at'),('chats','last_message_at'),('messages','created_at'),
    ('reviews','created_at'),('reports','created_at'),('notifications','created_at')
  ) as fields(table_name,column_name)
  loop
    if exists(select 1 from information_schema.columns c where c.table_schema='public'
      and c.table_name=item.table_name and c.column_name=item.column_name and c.data_type='timestamp without time zone') then
      begin
        execute format('alter table public.%I alter column %I type timestamptz using %I at time zone ''UTC''',item.table_name,item.column_name,item.column_name);
      exception
        when feature_not_supported or dependent_objects_still_exist then
          raise notice 'Skipped %.% timestamp conversion because a view or rule depends on it',item.table_name,item.column_name;
      end;
    end if;
  end loop;
end $timestamps$;

-- Enforce integrity for new/updated rows while allowing old invalid rows to be audited.
alter table public.products drop constraint if exists products_coords_check;
alter table public.products add constraint products_coords_check check (
  (lat is null and lng is null) or
  (lat is not null and lng is not null and lat between -90 and 90 and lng between -180 and 180)
) not valid;
alter table public.products drop constraint if exists products_published_location_check;
alter table public.products add constraint products_published_location_check check (
  status in ('draft','paused') or (lat between -90 and 90 and lng between -180 and 180)
) not valid;
alter table public.chats drop constraint if exists chats_participants_required;
alter table public.chats add constraint chats_participants_required check (buyer_id is not null and seller_id is not null and buyer_id<>seller_id) not valid;
alter table public.messages drop constraint if exists messages_links_required;
alter table public.messages add constraint messages_links_required check (chat_id is not null and sender_id is not null) not valid;

-- Legacy/new review compatibility. Keep both names synchronized until the old
-- column can be removed after all clients have migrated.
alter table public.reviews add column if not exists reviewed_id uuid references auth.users(id) on delete cascade;
alter table public.reviews add column if not exists reviewed_user_id uuid references auth.users(id) on delete cascade;
update public.reviews set reviewed_user_id=reviewed_id where reviewed_user_id is null;
update public.reviews set reviewed_id=reviewed_user_id where reviewed_id is null;
create or replace function public.sync_review_recipient()
returns trigger language plpgsql set search_path='' as $function$
begin
  new.reviewed_user_id=coalesce(new.reviewed_user_id,new.reviewed_id);
  new.reviewed_id=coalesce(new.reviewed_id,new.reviewed_user_id);
  return new;
end $function$;
drop trigger if exists reviews_sync_recipient on public.reviews;
create trigger reviews_sync_recipient before insert or update of reviewed_id,reviewed_user_id on public.reviews
for each row execute function public.sync_review_recipient();

-- Keep legacy read flag and current read timestamp consistent.
alter table public.messages add column if not exists is_read boolean not null default false;
alter table public.messages add column if not exists read_at timestamptz;
create or replace function public.sync_message_read_state()
returns trigger language plpgsql set search_path='' as $function$
begin
  if new.read_at is not null then new.is_read=true;
  elsif new.is_read then new.read_at=now();
  end if;
  return new;
end $function$;
drop trigger if exists messages_sync_read_state on public.messages;
create trigger messages_sync_read_state before insert or update of read_at,is_read on public.messages
for each row execute function public.sync_message_read_state();

-- Inbox preview and ordering always follow the latest message.
alter table public.chats add column if not exists last_message text;
alter table public.chats add column if not exists last_message_at timestamptz;
create or replace function public.touch_chat_after_message()
returns trigger language plpgsql security definer set search_path='' as $function$
begin
  update public.chats set updated_at=now(),last_message=case when new.attachment_path is not null and btrim(new.content)='' then 'Attachment' else left(new.content,500) end,last_message_at=new.created_at
  where id=new.chat_id;
  return new;
end $function$;
revoke all on function public.touch_chat_after_message() from public,anon,authenticated;
drop trigger if exists messages_touch_chat on public.messages;
create trigger messages_touch_chat after insert on public.messages for each row execute function public.touch_chat_after_message();

-- Sales count is derived from sold products, never manually edited by clients.
create or replace function public.refresh_profile_sales(target_user uuid)
returns void language sql security definer set search_path='' as $function$
  update public.profiles set total_sales=(select count(*)::integer from public.products where user_id=target_user and status='sold') where id=target_user
$function$;
revoke all on function public.refresh_profile_sales(uuid) from public,anon,authenticated;
create or replace function public.refresh_profile_sales_trigger()
returns trigger language plpgsql security definer set search_path='' as $function$
begin
  if tg_op='DELETE' then
    perform public.refresh_profile_sales(old.user_id);
    return old;
  end if;
  perform public.refresh_profile_sales(new.user_id);
  if tg_op='UPDATE' and old.user_id is distinct from new.user_id then
    perform public.refresh_profile_sales(old.user_id);
  end if;
  return new;
end $function$;
drop trigger if exists products_refresh_sales on public.products;
drop trigger if exists products_refresh_sales_insert_delete on public.products;
drop trigger if exists products_refresh_sales_update on public.products;
create trigger products_refresh_sales_insert_delete after insert or delete on public.products
for each row execute function public.refresh_profile_sales_trigger();
create trigger products_refresh_sales_update after update of status,user_id on public.products
for each row execute function public.refresh_profile_sales_trigger();
update public.profiles p set total_sales=(select count(*)::integer from public.products x where x.user_id=p.id and x.status='sold');

-- Contact/support form used by How it works.
create table if not exists public.support_requests(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 120),
  email text not null check(length(btrim(email)) between 3 and 254),
  topic text not null check(length(btrim(topic)) between 1 and 60),
  message text not null check(length(btrim(message)) between 1 and 5000),
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.support_requests enable row level security;
drop policy if exists support_requests_create_own on public.support_requests;
drop policy if exists support_requests_create on public.support_requests;
create policy support_requests_create_own on public.support_requests for insert to authenticated with check (user_id=auth.uid());
revoke all on public.support_requests from public,anon,authenticated;
grant insert(user_id,name,email,topic,message) on public.support_requests to authenticated;

create index if not exists products_user_status_idx on public.products(user_id,status);
create index if not exists chats_product_idx on public.chats(product_id);
create index if not exists reviews_reviewed_user_idx on public.reviews(reviewed_user_id,created_at desc);
create index if not exists messages_chat_created_idx on public.messages(chat_id,created_at);

notify pgrst,'reload schema';
commit;

-- Rows returned here require manual cleanup before VALIDATE CONSTRAINT.
select id,'product coordinates' as issue from public.products where (lat is null)<>(lng is null) or lat not between -90 and 90 or lng not between -180 and 180
union all select id,'published without coordinates' from public.products where status not in('draft','paused') and (lat is null or lng is null)
union all select id,'chat participants' from public.chats where buyer_id is null or seller_id is null or buyer_id=seller_id
union all select id,'message links' from public.messages where chat_id is null or sender_id is null;
