-- Reportes de usuario desde el perfil publico.
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reported_user_id text not null,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  details text,
  status text default 'open',
  created_at timestamptz default now()
);

alter table public.user_reports enable row level security;

-- Cualquiera identificado puede reportar; los reportes no se leen desde la app,
-- se revisan desde el panel de Supabase.
drop policy if exists "authenticated users can report" on public.user_reports;
create policy "authenticated users can report"
  on public.user_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create index if not exists user_reports_reported_idx on public.user_reports (reported_user_id);
