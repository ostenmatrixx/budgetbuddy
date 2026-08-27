alter table public.recurring_items
  drop constraint if exists recurring_items_type_check;

alter table public.recurring_items
  add constraint recurring_items_type_check
  check (type in ('income', 'bills', 'non_essentials', 'savings', 'savings_withdrawal'));

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
        when type in ('income', 'savings_withdrawal') then amount
        else -amount
      end
    ),
    0
  )
  from public.transactions
  where user_id = (select auth.uid());
$$;

create or replace function public.get_savings_balance(
  through_date date default null,
  excluded_transaction_id uuid default null
)
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    sum(
      case
        when type = 'savings' then amount
        when type = 'savings_withdrawal' then -amount
        else 0
      end
    ),
    0
  )
  from public.transactions
  where user_id = (select auth.uid())
    and (through_date is null or date <= through_date)
    and (excluded_transaction_id is null or id <> excluded_transaction_id);
$$;

revoke all on function public.get_savings_balance(date, uuid) from public;
revoke all on function public.get_savings_balance(date, uuid) from anon;
grant execute on function public.get_savings_balance(date, uuid) to authenticated;

notify pgrst, 'reload schema';
