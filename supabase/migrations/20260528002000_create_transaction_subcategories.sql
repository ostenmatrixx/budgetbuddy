alter table public.transactions
  drop constraint if exists transactions_subcategory_check;

create table if not exists public.transaction_subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'bills', 'non_essentials', 'savings')),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaction_subcategories_name_not_blank check (btrim(name) <> '')
);

create unique index if not exists transaction_subcategories_user_type_name_key
  on public.transaction_subcategories (
    user_id,
    type,
    lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
  );

create index if not exists transaction_subcategories_user_type_active_idx
  on public.transaction_subcategories (user_id, type, is_active, name);

alter table public.transaction_subcategories enable row level security;

revoke all on public.transaction_subcategories from anon;
revoke all on public.transaction_subcategories from authenticated;
grant select, insert, update, delete on public.transaction_subcategories to authenticated;

drop policy if exists "Users can read own transaction subcategories"
  on public.transaction_subcategories;
drop policy if exists "Users can create own transaction subcategories"
  on public.transaction_subcategories;
drop policy if exists "Users can update own transaction subcategories"
  on public.transaction_subcategories;
drop policy if exists "Users can delete own transaction subcategories"
  on public.transaction_subcategories;

create policy "Users can read own transaction subcategories"
  on public.transaction_subcategories
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own transaction subcategories"
  on public.transaction_subcategories
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own transaction subcategories"
  on public.transaction_subcategories
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own transaction subcategories"
  on public.transaction_subcategories
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
