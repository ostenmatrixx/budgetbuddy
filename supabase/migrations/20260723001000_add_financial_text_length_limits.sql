alter table public.transactions
  add constraint transactions_description_length_check
  check (
    char_length(description) between 1 and 200
    and btrim(description) <> ''
  ) not valid;

alter table public.transactions
  validate constraint transactions_description_length_check;

alter table public.transactions
  add constraint transactions_notes_length_check
  check (char_length(notes) <= 2000) not valid;

alter table public.transactions
  validate constraint transactions_notes_length_check;

alter table public.transactions
  add constraint transactions_subcategory_length_check
  check (
    subcategory is null
    or (
      char_length(subcategory) between 1 and 60
      and btrim(subcategory) <> ''
    )
  ) not valid;

alter table public.transactions
  validate constraint transactions_subcategory_length_check;

alter table public.transaction_subcategories
  add constraint transaction_subcategories_name_length_check
  check (
    char_length(name) between 1 and 60
    and btrim(name) <> ''
  ) not valid;

alter table public.transaction_subcategories
  validate constraint transaction_subcategories_name_length_check;

notify pgrst, 'reload schema';
