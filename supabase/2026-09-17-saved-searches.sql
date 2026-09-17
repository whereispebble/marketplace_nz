-- Creates account-scoped saved searches without exposing them to other users.
-- Safe to run more than once in the Supabase SQL Editor.
begin;

create table if not exists public.saved_searches (
  user_id uuid primary key references auth.users(id) on delete cascade,
  searches jsonb not null default '[]'::jsonb,
  constraint saved_searches_array_check check (
    jsonb_typeof(searches) = 'array'
    and jsonb_array_length(searches) <= 8
    and octet_length(searches::text) <= 65536
  )
);

alter table public.saved_searches enable row level security;

drop policy if exists saved_searches_own on public.saved_searches;
create policy saved_searches_own
  on public.saved_searches
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.saved_searches from public, anon, authenticated;
grant select, insert, update, delete on public.saved_searches to authenticated;

notify pgrst, 'reload schema';
commit;

-- Expected result: one row describing the table.
select table_schema, table_name
from information_schema.tables
where table_schema = 'public' and table_name = 'saved_searches';
