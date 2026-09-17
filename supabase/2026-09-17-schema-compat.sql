-- Compatibility additions for installations created from swapy-persistence.sql.
-- Apply before 2026-09-security-and-integrity.sql. No rows are silently removed.
begin;
alter table public.profiles add column if not exists avatar_url text;
alter table public.products add column if not exists transmission text;
alter table public.user_reports drop constraint if exists user_reports_not_self_check;
-- Invalid legacy identifiers abort the migration instead of deleting reports.
alter table public.user_reports alter column reported_user_id type uuid using reported_user_id::uuid;
commit;
