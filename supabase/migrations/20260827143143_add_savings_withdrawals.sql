alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('income', 'bills', 'non_essentials', 'savings', 'savings_withdrawal'));

alter table public.transaction_subcategories
  drop constraint if exists transaction_subcategories_type_check;

alter table public.transaction_subcategories
  add constraint transaction_subcategories_type_check
  check (type in ('income', 'bills', 'non_essentials', 'savings', 'savings_withdrawal'));

notify pgrst, 'reload schema';
