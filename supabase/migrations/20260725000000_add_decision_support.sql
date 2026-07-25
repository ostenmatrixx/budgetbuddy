create table if not exists public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'bills', 'non_essentials', 'savings')),
  subcategory_id uuid null references public.transaction_subcategories(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  notes text not null default '',
  frequency text not null check (
    frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')
  ),
  start_date date not null,
  occurrence_number integer not null default 0 check (occurrence_number >= 0),
  next_due_date date not null,
  end_date date null,
  is_active boolean not null default true,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_items_description_check check (
    char_length(description) between 1 and 200
    and btrim(description) <> ''
  ),
  constraint recurring_items_notes_check check (char_length(notes) <= 2000),
  constraint recurring_items_dates_check check (
    next_due_date >= start_date
    and (end_date is null or end_date >= start_date)
  )
);

create unique index if not exists recurring_items_id_user_key
  on public.recurring_items (id, user_id);

create index if not exists recurring_items_user_due_idx
  on public.recurring_items (user_id, is_active, next_due_date);

create table if not exists public.recurring_occurrence_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_item_id uuid not null,
  due_date date not null,
  action text not null check (action in ('recorded', 'skipped')),
  transaction_id uuid null references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint recurring_occurrence_action_transaction_check check (
    (action = 'recorded' and transaction_id is not null)
    or (action = 'skipped' and transaction_id is null)
  ),
  constraint recurring_occurrence_actions_owner_fk
    foreign key (recurring_item_id, user_id)
    references public.recurring_items(id, user_id)
    on delete cascade
);

create unique index if not exists recurring_occurrence_item_due_key
  on public.recurring_occurrence_actions (recurring_item_id, due_date);

create index if not exists recurring_occurrence_user_date_idx
  on public.recurring_occurrence_actions (user_id, due_date desc);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subcategory_id uuid not null references public.transaction_subcategories(id) on delete cascade,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  tracking_start_date date not null,
  target_date date null,
  is_active boolean not null default true,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_goals_name_check check (
    char_length(name) between 1 and 100
    and btrim(name) <> ''
  ),
  constraint savings_goals_dates_check check (
    target_date is null or target_date >= tracking_start_date
  )
);

create unique index if not exists savings_goals_id_user_key
  on public.savings_goals (id, user_id);

create unique index if not exists savings_goals_active_subcategory_key
  on public.savings_goals (user_id, subcategory_id)
  where is_active;

create index if not exists savings_goals_user_active_idx
  on public.savings_goals (user_id, is_active, target_date);

create or replace function public.validate_decision_support_subcategory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subcategory_type text;
  subcategory_owner uuid;
begin
  if new.subcategory_id is null then
    if tg_table_name = 'savings_goals' then
      raise exception 'A savings goal requires a savings subcategory.';
    end if;
    return new;
  end if;

  select type, user_id
    into subcategory_type, subcategory_owner
  from public.transaction_subcategories
  where id = new.subcategory_id;

  if subcategory_owner is distinct from new.user_id then
    raise exception 'The selected subcategory does not belong to this account.';
  end if;

  if tg_table_name = 'savings_goals' and subcategory_type <> 'savings' then
    raise exception 'Savings goals must use a savings subcategory.';
  end if;

  if tg_table_name = 'recurring_items' and subcategory_type <> new.type then
    raise exception 'The selected subcategory does not match the recurring item type.';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_decision_support_subcategory() from public;

drop trigger if exists validate_recurring_item_subcategory on public.recurring_items;
create trigger validate_recurring_item_subcategory
before insert or update of user_id, type, subcategory_id on public.recurring_items
for each row execute function public.validate_decision_support_subcategory();

drop trigger if exists validate_savings_goal_subcategory on public.savings_goals;
create trigger validate_savings_goal_subcategory
before insert or update of user_id, subcategory_id on public.savings_goals
for each row execute function public.validate_decision_support_subcategory();

create or replace function public.advance_recurring_date(
  schedule_start date,
  schedule_frequency text,
  next_occurrence_number integer
)
returns date
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  month_increment integer;
  target_month date;
  target_day integer;
  last_day integer;
begin
  if next_occurrence_number < 0 then
    raise exception 'Occurrence number must not be negative.';
  end if;

  if schedule_frequency = 'weekly' then
    return schedule_start + (next_occurrence_number * 7);
  elsif schedule_frequency = 'biweekly' then
    return schedule_start + (next_occurrence_number * 14);
  elsif schedule_frequency = 'monthly' then
    month_increment := next_occurrence_number;
  elsif schedule_frequency = 'quarterly' then
    month_increment := next_occurrence_number * 3;
  elsif schedule_frequency = 'yearly' then
    month_increment := next_occurrence_number * 12;
  else
    raise exception 'Unsupported recurring frequency.';
  end if;

  target_month := (
    date_trunc('month', schedule_start)::date
    + make_interval(months => month_increment)
  )::date;
  target_day := extract(day from schedule_start)::integer;
  last_day := extract(
    day from (target_month + interval '1 month - 1 day')
  )::integer;

  return target_month + (least(target_day, last_day) - 1);
end;
$$;

revoke all on function public.advance_recurring_date(date, text, integer) from public;
revoke all on function public.advance_recurring_date(date, text, integer) from anon;
grant execute on function public.advance_recurring_date(date, text, integer) to authenticated;

create or replace function public.record_recurring_occurrence(
  recurring_id uuid,
  expected_due_date date,
  request_id uuid,
  transaction_type text,
  transaction_subcategory text,
  transaction_amount numeric,
  transaction_date date,
  transaction_description text,
  transaction_notes text
)
returns setof public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.recurring_items%rowtype;
  saved_transaction public.transactions%rowtype;
  next_number integer;
  calculated_next_due date;
begin
  select *
    into saved_transaction
  from public.transactions
  where user_id = (select auth.uid())
    and client_request_id = request_id;

  if found then
    return next saved_transaction;
    return;
  end if;

  select *
    into item
  from public.recurring_items
  where id = recurring_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Recurring item not found.';
  end if;

  if not item.is_active or item.next_due_date <> expected_due_date then
    raise exception 'This recurring item changed. Refresh and try again.';
  end if;

  insert into public.transactions (
    client_request_id,
    user_id,
    type,
    subcategory,
    amount,
    date,
    description,
    notes
  )
  values (
    request_id,
    item.user_id,
    transaction_type,
    nullif(btrim(transaction_subcategory), ''),
    transaction_amount,
    transaction_date,
    btrim(transaction_description),
    transaction_notes
  )
  returning * into saved_transaction;

  insert into public.recurring_occurrence_actions (
    user_id,
    recurring_item_id,
    due_date,
    action,
    transaction_id
  )
  values (
    item.user_id,
    item.id,
    expected_due_date,
    'recorded',
    saved_transaction.id
  );

  next_number := item.occurrence_number + 1;
  calculated_next_due := public.advance_recurring_date(
    item.start_date,
    item.frequency,
    next_number
  );

  update public.recurring_items
  set
    occurrence_number = next_number,
    next_due_date = calculated_next_due,
    is_active = item.end_date is null or calculated_next_due <= item.end_date,
    version = version + 1,
    updated_at = now()
  where id = item.id
    and user_id = item.user_id;

  return next saved_transaction;
end;
$$;

revoke all on function public.record_recurring_occurrence(
  uuid, date, uuid, text, text, numeric, date, text, text
) from public;
revoke all on function public.record_recurring_occurrence(
  uuid, date, uuid, text, text, numeric, date, text, text
) from anon;
grant execute on function public.record_recurring_occurrence(
  uuid, date, uuid, text, text, numeric, date, text, text
) to authenticated;

create or replace function public.skip_recurring_occurrence(
  recurring_id uuid,
  expected_due_date date
)
returns setof public.recurring_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.recurring_items%rowtype;
  next_number integer;
  calculated_next_due date;
begin
  select *
    into item
  from public.recurring_items
  where id = recurring_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Recurring item not found.';
  end if;

  if exists (
    select 1
    from public.recurring_occurrence_actions
    where recurring_item_id = item.id
      and user_id = item.user_id
      and due_date = expected_due_date
      and action = 'skipped'
  ) then
    return next item;
    return;
  end if;

  if not item.is_active or item.next_due_date <> expected_due_date then
    raise exception 'This recurring item changed. Refresh and try again.';
  end if;

  insert into public.recurring_occurrence_actions (
    user_id,
    recurring_item_id,
    due_date,
    action
  )
  values (item.user_id, item.id, expected_due_date, 'skipped');

  next_number := item.occurrence_number + 1;
  calculated_next_due := public.advance_recurring_date(
    item.start_date,
    item.frequency,
    next_number
  );

  update public.recurring_items
  set
    occurrence_number = next_number,
    next_due_date = calculated_next_due,
    is_active = item.end_date is null or calculated_next_due <= item.end_date,
    version = version + 1,
    updated_at = now()
  where id = item.id
    and user_id = item.user_id
  returning * into item;

  return next item;
end;
$$;

revoke all on function public.skip_recurring_occurrence(uuid, date) from public;
revoke all on function public.skip_recurring_occurrence(uuid, date) from anon;
grant execute on function public.skip_recurring_occurrence(uuid, date) to authenticated;

create or replace function public.get_savings_goal_progress()
returns table (
  goal_id uuid,
  saved_amount numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    goal.id,
    coalesce(sum(entry.amount), 0)::numeric as saved_amount
  from public.savings_goals as goal
  join public.transaction_subcategories as subcategory
    on subcategory.id = goal.subcategory_id
    and subcategory.user_id = goal.user_id
    and subcategory.type = 'savings'
  left join public.transactions as entry
    on entry.user_id = goal.user_id
    and entry.type = 'savings'
    and entry.date >= goal.tracking_start_date
    and lower(regexp_replace(btrim(entry.subcategory), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(subcategory.name), '\s+', ' ', 'g'))
  where goal.user_id = (select auth.uid())
  group by goal.id;
$$;

revoke all on function public.get_savings_goal_progress() from public;
revoke all on function public.get_savings_goal_progress() from anon;
grant execute on function public.get_savings_goal_progress() to authenticated;

create or replace function public.search_transactions(
  search_text text default '',
  filter_types text[] default null,
  date_from date default null,
  date_to date default null,
  minimum_amount numeric default null,
  maximum_amount numeric default null,
  sort_direction text default 'newest',
  page_offset integer default 0,
  page_limit integer default 25
)
returns table (
  id uuid,
  client_request_id uuid,
  user_id uuid,
  type text,
  subcategory text,
  amount numeric,
  date date,
  description text,
  notes text,
  version bigint,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    entry.id,
    entry.client_request_id,
    entry.user_id,
    entry.type,
    entry.subcategory,
    entry.amount,
    entry.date,
    entry.description,
    entry.notes,
    entry.version,
    entry.created_at,
    entry.updated_at,
    count(*) over() as total_count
  from public.transactions as entry
  where entry.user_id = (select auth.uid())
    and (
      coalesce(btrim(search_text), '') = ''
      or position(
        lower(btrim(search_text))
        in lower(concat_ws(
          ' ',
          entry.description,
          entry.subcategory,
          entry.notes
        ))
      ) > 0
    )
    and (filter_types is null or entry.type = any(filter_types))
    and (date_from is null or entry.date >= date_from)
    and (date_to is null or entry.date <= date_to)
    and (minimum_amount is null or entry.amount >= minimum_amount)
    and (maximum_amount is null or entry.amount <= maximum_amount)
  order by
    case when sort_direction = 'oldest' then entry.date end asc,
    case when sort_direction = 'oldest' then entry.created_at end asc,
    case when sort_direction = 'oldest' then entry.id end asc,
    case when sort_direction <> 'oldest' then entry.date end desc,
    case when sort_direction <> 'oldest' then entry.created_at end desc,
    case when sort_direction <> 'oldest' then entry.id end desc
  offset greatest(page_offset, 0)
  limit least(greatest(page_limit, 1), 100);
$$;

revoke all on function public.search_transactions(
  text, text[], date, date, numeric, numeric, text, integer, integer
) from public;
revoke all on function public.search_transactions(
  text, text[], date, date, numeric, numeric, text, integer, integer
) from anon;
grant execute on function public.search_transactions(
  text, text[], date, date, numeric, numeric, text, integer, integer
) to authenticated;

alter table public.recurring_items enable row level security;
alter table public.recurring_occurrence_actions enable row level security;
alter table public.savings_goals enable row level security;

revoke all on public.recurring_items from anon;
revoke all on public.recurring_occurrence_actions from anon;
revoke all on public.savings_goals from anon;

revoke all on public.recurring_items from authenticated;
revoke all on public.recurring_occurrence_actions from authenticated;
revoke all on public.savings_goals from authenticated;

grant select, insert, update, delete on public.recurring_items to authenticated;
grant select on public.recurring_occurrence_actions to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;

create policy "Users can read own recurring items"
on public.recurring_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own recurring items"
on public.recurring_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own recurring items"
on public.recurring_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own recurring items"
on public.recurring_items for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own recurring occurrence actions"
on public.recurring_occurrence_actions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own savings goals"
on public.savings_goals for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own savings goals"
on public.savings_goals for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own savings goals"
on public.savings_goals for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own savings goals"
on public.savings_goals for delete to authenticated
using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
