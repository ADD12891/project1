create table if not exists public.dashboard_state (
  page_key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.dashboard_state enable row level security;

drop policy if exists "dashboard_state_public_read" on public.dashboard_state;
create policy "dashboard_state_public_read"
on public.dashboard_state
for select
to anon, authenticated
using (true);

drop policy if exists "dashboard_state_public_insert" on public.dashboard_state;
create policy "dashboard_state_public_insert"
on public.dashboard_state
for insert
to anon, authenticated
with check (true);

drop policy if exists "dashboard_state_public_update" on public.dashboard_state;
create policy "dashboard_state_public_update"
on public.dashboard_state
for update
to anon, authenticated
using (true)
with check (true);
