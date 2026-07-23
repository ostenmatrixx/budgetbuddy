alter table public.transactions
  add column if not exists client_request_id uuid;

update public.transactions
set client_request_id = id
where client_request_id is null;

alter table public.transactions
  alter column client_request_id set default gen_random_uuid(),
  alter column client_request_id set not null;

create unique index if not exists transactions_user_client_request_key
  on public.transactions (user_id, client_request_id);

notify pgrst, 'reload schema';
