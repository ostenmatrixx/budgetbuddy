alter table public.transactions
  add column if not exists version bigint not null default 1;

alter table public.transactions
  drop constraint if exists transactions_version_positive_check;

alter table public.transactions
  add constraint transactions_version_positive_check
  check (version > 0);

create or replace function public.increment_transaction_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.increment_transaction_version() from public;

drop trigger if exists increment_transaction_version on public.transactions;
create trigger increment_transaction_version
before update on public.transactions
for each row execute function public.increment_transaction_version();

create or replace function public.get_account_balance()
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    sum(
      case
        when type = 'income' then amount
        else -amount
      end
    ),
    0
  )
  from public.transactions
  where user_id = (select auth.uid());
$$;

revoke all on function public.get_account_balance() from public;
revoke all on function public.get_account_balance() from anon;
grant execute on function public.get_account_balance() to authenticated;

notify pgrst, 'reload schema';
