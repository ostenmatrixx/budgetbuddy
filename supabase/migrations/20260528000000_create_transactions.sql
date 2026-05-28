create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'bills', 'non_essentials', 'savings')),
  subcategory text null,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  description text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_subcategory_check check (
    (
      type = 'bills'
      and subcategory in ('Bills', 'House', 'Lot', 'Credit Card')
    )
    or (
      type = 'savings'
      and subcategory in ('Cash Savings', 'Emergency Funds')
    )
    or (
      type in ('income', 'non_essentials')
      and subcategory is null
    )
  )
);

alter table public.transactions enable row level security;

grant usage on schema public to authenticated;
revoke all on public.transactions from anon;
revoke all on public.transactions from authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

drop policy if exists "Transactions are viewable by owner" on public.transactions;
drop policy if exists "Transactions are insertable by owner" on public.transactions;
drop policy if exists "Transactions are updatable by owner" on public.transactions;
drop policy if exists "Transactions are deletable by owner" on public.transactions;

create policy "Transactions are viewable by owner"
on public.transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Transactions are insertable by owner"
on public.transactions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Transactions are updatable by owner"
on public.transactions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Transactions are deletable by owner"
on public.transactions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists transactions_user_date_idx
on public.transactions (user_id, date desc);

create index if not exists transactions_user_type_date_idx
on public.transactions (user_id, type, date desc);
