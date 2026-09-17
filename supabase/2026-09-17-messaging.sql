-- Repairs the real contact-seller flow. Safe to run more than once.
begin;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, buyer_id, seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(btrim(content)) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- CREATE TABLE IF NOT EXISTS does not upgrade an older existing table.
-- Add the columns used by the current inbox without touching existing rows.
alter table public.chats
  add column if not exists updated_at timestamptz not null default now();
alter table public.messages
  add column if not exists read_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.offers enable row level security;

do $policies$
declare policy_row record;
begin
  for policy_row in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('chats', 'messages', 'offers')
  loop
    execute format('drop policy %I on public.%I', policy_row.policyname, policy_row.tablename);
  end loop;
end $policies$;

create policy chats_read_participant on public.chats for select to authenticated
  using (auth.uid() in (buyer_id, seller_id));
create policy messages_read_participant on public.messages for select to authenticated
  using (exists (
    select 1 from public.chats c
    where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id)
  ));
create policy messages_create_participant on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (
    select 1 from public.chats c
    where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id)
  ));
create policy messages_mark_read_by_recipient on public.messages for update to authenticated
  using (sender_id <> auth.uid() and exists (
    select 1 from public.chats c
    where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id)
  ))
  with check (sender_id <> auth.uid() and exists (
    select 1 from public.chats c
    where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id)
  ));
create policy offers_read_participant on public.offers for select to authenticated
  using (exists (
    select 1 from public.chats c
    where c.id = chat_id and auth.uid() in (c.buyer_id, c.seller_id)
  ));
create policy offers_create_buyer on public.offers for insert to authenticated
  with check (buyer_id = auth.uid() and status = 'pending' and exists (
    select 1 from public.chats c join public.products p on p.id = c.product_id
    where c.id = chat_id and c.buyer_id = auth.uid()
      and p.status in ('available', 'reserved')
  ));
create policy offers_decide_seller on public.offers for update to authenticated
  using (status = 'pending' and exists (
    select 1 from public.chats c where c.id = chat_id and c.seller_id = auth.uid()
  ))
  with check (status in ('accepted', 'declined') and exists (
    select 1 from public.chats c where c.id = chat_id and c.seller_id = auth.uid()
  ));

revoke all on public.chats, public.messages, public.offers from public, anon, authenticated;
grant select on public.chats to authenticated;
grant select on public.messages to authenticated;
grant insert (chat_id, sender_id, content) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant select on public.offers to authenticated;
grant insert (chat_id, buyer_id, amount) on public.offers to authenticated;
grant update (status) on public.offers to authenticated;

create or replace function public.start_conversation(
  p_product_id uuid default null,
  p_seller_id uuid default null
)
returns public.chats
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller uuid := auth.uid();
  seller uuid;
  result public.chats;
begin
  if caller is null then raise exception 'Authentication required'; end if;

  if p_product_id is null then raise exception 'Listing required'; end if;
  select user_id into seller
  from public.products
  where id = p_product_id
    and status in ('available', 'reserved')
    and lat between -90 and 90
    and lng between -180 and 180;
  if seller is null then raise exception 'Listing unavailable'; end if;
  if p_seller_id is not null and p_seller_id <> seller then
    raise exception 'Seller mismatch';
  end if;

  if seller is null or seller = caller then raise exception 'Invalid recipient'; end if;

  perform pg_advisory_xact_lock(hashtextextended(
    least(caller::text, seller::text) || greatest(caller::text, seller::text)
      || coalesce(p_product_id::text, 'direct'), 0
  ));

  select * into result
  from public.chats
  where product_id is not distinct from p_product_id
    and buyer_id = caller
    and seller_id = seller
  order by created_at
  limit 1;

  if result.id is null then
    insert into public.chats(product_id, buyer_id, seller_id)
    values (p_product_id, caller, seller)
    returning * into result;
  end if;
  return result;
end
$function$;

revoke all on function public.start_conversation(uuid, uuid) from public, anon;
grant execute on function public.start_conversation(uuid, uuid) to authenticated;

create or replace function public.touch_chat_after_message()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end
$function$;
revoke all on function public.touch_chat_after_message() from public, anon, authenticated;
drop trigger if exists messages_touch_chat on public.messages;
create trigger messages_touch_chat after insert on public.messages
  for each row execute function public.touch_chat_after_message();

create index if not exists chats_buyer_idx on public.chats(buyer_id);
create index if not exists chats_seller_idx on public.chats(seller_id);
create index if not exists messages_chat_id_idx on public.messages(chat_id, created_at);
create unique index if not exists offers_one_pending on public.offers(chat_id) where status = 'pending';

notify pgrst, 'reload schema';
commit;

select routine_name
from information_schema.routines
where routine_schema = 'public' and routine_name = 'start_conversation';
