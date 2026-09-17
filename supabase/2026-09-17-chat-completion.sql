-- Private attachments, verified sales and bilateral reviews. Safe to rerun.
begin;

alter table public.chats add column if not exists sold_at timestamptz;
alter table public.messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text,
  add column if not exists attachment_size integer;
alter table public.messages alter column content set default '';
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check check (
  length(btrim(content)) between 1 and 5000 or attachment_path is not null
);
alter table public.messages drop constraint if exists messages_attachment_check;
alter table public.messages add constraint messages_attachment_check check (
  attachment_path is null or (
    attachment_name is not null and attachment_type is not null
    and attachment_size between 1 and 10485760
  )
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewed_user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or length(btrim(comment)) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique(chat_id, reviewer_id),
  check (reviewer_id <> reviewed_user_id)
);

-- CREATE TABLE IF NOT EXISTS does not upgrade the legacy reviews table
-- (reviewer_id/reviewed_id/rating). Preserve those rows and add the verified
-- transaction fields as nullable; RLS requires them for every new review.
alter table public.reviews
  add column if not exists chat_id uuid references public.chats(id) on delete cascade,
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists reviewed_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists comment text,
  add column if not exists created_at timestamptz not null default now();

do $legacy_reviews$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reviews' and column_name='reviewed_id'
  ) then
    execute 'update public.reviews set reviewed_user_id=reviewed_id where reviewed_user_id is null';
  end if;
end $legacy_reviews$;

create unique index if not exists reviews_one_per_chat_reviewer
  on public.reviews(chat_id,reviewer_id) where chat_id is not null;

alter table public.reviews enable row level security;
do $review_policies$
declare policy_row record;
begin
  for policy_row in select policyname from pg_policies where schemaname='public' and tablename='reviews'
  loop execute format('drop policy %I on public.reviews',policy_row.policyname); end loop;
end $review_policies$;
create policy reviews_read_participant on public.reviews for select to authenticated using (
  exists (select 1 from public.chats c where c.id=chat_id and auth.uid() in (c.buyer_id,c.seller_id))
);
create policy reviews_create_after_sale on public.reviews for insert to authenticated with check (
  reviewer_id=auth.uid() and exists (
    select 1 from public.chats c where c.id=chat_id and c.product_id=product_id
      and c.sold_at is not null and reviewer_id in (c.buyer_id,c.seller_id)
      and reviewed_user_id=case when reviewer_id=c.buyer_id then c.seller_id else c.buyer_id end
  )
);

revoke all on public.reviews from public, anon, authenticated;
grant select on public.reviews to authenticated;
grant insert (chat_id,product_id,reviewer_id,reviewed_user_id,rating,comment) on public.reviews to authenticated;

create or replace view public.public_reviews as
select id, product_id, reviewer_id, reviewed_user_id, rating, comment, created_at from public.reviews;
revoke all on public.public_reviews from public, anon, authenticated;
grant select on public.public_reviews to anon, authenticated;

create or replace function public.mark_listing_sold(p_chat_id uuid)
returns public.chats language plpgsql security definer set search_path='' as $function$
declare result public.chats;
begin
  update public.chats c set sold_at=coalesce(c.sold_at,now()), updated_at=now()
  where c.id=p_chat_id and c.seller_id=auth.uid() and c.product_id is not null
  returning * into result;
  if result.id is null then raise exception 'Only the seller can complete this sale'; end if;
  update public.products set status='sold' where id=result.product_id and user_id=auth.uid();
  return result;
end $function$;
revoke all on function public.mark_listing_sold(uuid) from public,anon;
grant execute on function public.mark_listing_sold(uuid) to authenticated;

create or replace function public.refresh_review_rating()
returns trigger language plpgsql security definer set search_path='' as $function$
begin
  update public.profiles set rating=(select round(avg(r.rating)::numeric,2) from public.reviews r where r.reviewed_user_id=new.reviewed_user_id)
  where id=new.reviewed_user_id;
  return new;
end $function$;
revoke all on function public.refresh_review_rating() from public,anon,authenticated;
drop trigger if exists reviews_refresh_rating on public.reviews;
create trigger reviews_refresh_rating after insert on public.reviews for each row execute function public.refresh_review_rating();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('chat-attachments','chat-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "chat participants read attachments" on storage.objects;
create policy "chat participants read attachments" on storage.objects for select to authenticated using (
  bucket_id='chat-attachments' and exists (
    select 1 from public.chats c where c.id::text=(storage.foldername(name))[1] and auth.uid() in(c.buyer_id,c.seller_id)
  )
);
drop policy if exists "chat participants upload attachments" on storage.objects;
create policy "chat participants upload attachments" on storage.objects for insert to authenticated with check (
  bucket_id='chat-attachments' and (storage.foldername(name))[2]=auth.uid()::text and exists (
    select 1 from public.chats c where c.id::text=(storage.foldername(name))[1] and auth.uid() in(c.buyer_id,c.seller_id)
  )
);

revoke insert on public.messages from authenticated;
grant insert (chat_id,sender_id,content,attachment_path,attachment_name,attachment_type,attachment_size) on public.messages to authenticated;
notify pgrst,'reload schema';
commit;
