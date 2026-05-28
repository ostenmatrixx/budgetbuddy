create table if not exists public.budget_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  essentials_percent integer not null default 50,
  savings_percent integer not null default 30,
  non_essentials_percent integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_preferences_percent_range_check check (
    essentials_percent between 0 and 100
    and savings_percent between 0 and 100
    and non_essentials_percent between 0 and 100
  ),
  constraint budget_preferences_total_check check (
    essentials_percent + savings_percent + non_essentials_percent = 100
  )
);

alter table public.budget_preferences enable row level security;

grant usage on schema public to authenticated;
revoke all on public.budget_preferences from anon;
revoke all on public.budget_preferences from authenticated;
grant select, insert, update, delete on public.budget_preferences to authenticated;

drop policy if exists "Budget preferences are viewable by owner" on public.budget_preferences;
drop policy if exists "Budget preferences are insertable by owner" on public.budget_preferences;
drop policy if exists "Budget preferences are updatable by owner" on public.budget_preferences;
drop policy if exists "Budget preferences are deletable by owner" on public.budget_preferences;

create policy "Budget preferences are viewable by owner"
on public.budget_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Budget preferences are insertable by owner"
on public.budget_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Budget preferences are updatable by owner"
on public.budget_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Budget preferences are deletable by owner"
on public.budget_preferences
for delete
to authenticated
using ((select auth.uid()) = user_id);
