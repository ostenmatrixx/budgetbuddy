begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(100);

select has_table('public', 'transactions', 'transactions table exists');
select has_table('public', 'budget_preferences', 'budget preferences table exists');
select has_table('public', 'transaction_subcategories', 'subcategories table exists');
select has_table('public', 'user_settings', 'user settings table exists');
select has_table('public', 'recurring_items', 'recurring items table exists');
select has_table(
  'public',
  'recurring_occurrence_actions',
  'recurring occurrence actions table exists'
);
select has_table('public', 'savings_goals', 'savings goals table exists');
select has_column('public', 'transactions', 'version', 'transactions have a concurrency version');
select has_function(
  'public',
  'get_account_balance',
  array[]::text[],
  'account balance function exists without user-controlled arguments'
);

select is(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.transactions'::regclass),
  true,
  'transactions enables RLS'
);
select is(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.budget_preferences'::regclass),
  true,
  'budget preferences enables RLS'
);
select is(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.transaction_subcategories'::regclass),
  true,
  'subcategories enables RLS'
);
select is(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.user_settings'::regclass),
  true,
  'user settings enables RLS'
);
select is(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.recurring_items'::regclass),
  true,
  'recurring items enables RLS'
);
select is(
  (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.recurring_occurrence_actions'::regclass
  ),
  true,
  'recurring occurrence actions enables RLS'
);
select is(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.savings_goals'::regclass),
  true,
  'savings goals enables RLS'
);

select ok(not has_table_privilege('anon', 'public.transactions', 'select'), 'anon cannot select transactions');
select ok(not has_table_privilege('anon', 'public.budget_preferences', 'select'), 'anon cannot select budget preferences');
select ok(not has_table_privilege('anon', 'public.transaction_subcategories', 'select'), 'anon cannot select subcategories');
select ok(not has_table_privilege('anon', 'public.user_settings', 'select'), 'anon cannot select user settings');
select ok(
  not has_table_privilege('anon', 'public.recurring_items', 'select'),
  'anon cannot select recurring items'
);
select ok(
  not has_table_privilege('anon', 'public.recurring_occurrence_actions', 'select'),
  'anon cannot select recurring occurrence actions'
);
select ok(
  not has_table_privilege('anon', 'public.savings_goals', 'select'),
  'anon cannot select savings goals'
);
select ok(
  not has_function_privilege('anon', 'public.get_account_balance()', 'execute'),
  'anon cannot execute the account balance function'
);
select ok(
  has_function_privilege('authenticated', 'public.get_account_balance()', 'execute'),
  'authenticated users can execute the account balance function'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.record_recurring_occurrence(uuid,date,uuid,text,text,numeric,date,text,text)',
    'execute'
  ),
  'anon cannot record recurring occurrences'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.record_recurring_occurrence(uuid,date,uuid,text,text,numeric,date,text,text)',
    'execute'
  ),
  'authenticated users can record recurring occurrences'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.skip_recurring_occurrence(uuid,date)',
    'execute'
  ),
  'anon cannot skip recurring occurrences'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.skip_recurring_occurrence(uuid,date)',
    'execute'
  ),
  'authenticated users can skip recurring occurrences'
);
select ok(
  not has_function_privilege('anon', 'public.validate_user_settings_time_zone()', 'execute'),
  'anon cannot execute the time zone validation trigger function'
);
select ok(
  not has_function_privilege('authenticated', 'public.validate_user_settings_time_zone()', 'execute'),
  'authenticated users cannot execute the time zone validation trigger function'
);
select ok(
  not has_function_privilege('anon', 'public.set_user_settings_updated_at()', 'execute'),
  'anon cannot execute the settings timestamp trigger function'
);
select ok(
  not has_function_privilege('authenticated', 'public.set_user_settings_updated_at()', 'execute'),
  'authenticated users cannot execute the settings timestamp trigger function'
);
select ok(
  not has_function_privilege('anon', 'public.create_default_user_settings()', 'execute'),
  'anon cannot execute the default settings trigger function'
);
select ok(
  not has_function_privilege('authenticated', 'public.create_default_user_settings()', 'execute'),
  'authenticated users cannot execute the default settings trigger function'
);
select ok(
  not has_function_privilege('anon', 'public.increment_transaction_version()', 'execute'),
  'anon cannot execute the transaction version trigger function'
);
select ok(
  not has_function_privilege('authenticated', 'public.increment_transaction_version()', 'execute'),
  'authenticated users cannot execute the transaction version trigger function'
);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
    'owner-one@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
  ),
  (
    '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
    'owner-two@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

insert into public.transactions (
  id, client_request_id, user_id, type, amount, date, description, notes
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'income', 1000, '2026-07-22', 'Pay', ''
);

select results_eq(
  $$ select version from public.transactions where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values (1::bigint) $$,
  'new transactions start at version one'
);

select throws_ok(
  $$ insert into public.transactions (id, client_request_id, user_id, type, amount, date, description, version) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'income', 1, '2026-07-22', 'Invalid version', 0) $$,
  '23514',
  null,
  'transaction versions must be positive'
);

insert into public.budget_preferences (
  user_id, essentials_percent, savings_percent, non_essentials_percent
)
values ('11111111-1111-4111-8111-111111111111', 50, 30, 20);

insert into public.transaction_subcategories (user_id, type, name)
values ('11111111-1111-4111-8111-111111111111', 'bills', 'Rent');

select results_eq(
  $$ select count(*) from public.transactions $$,
  $$ values (1::bigint) $$,
  'owner can read own transactions'
);
select results_eq(
  $$ select count(*) from public.budget_preferences $$,
  $$ values (1::bigint) $$,
  'owner can read own budget preference'
);
select results_eq(
  $$ select count(*) from public.transaction_subcategories $$,
  $$ values (1::bigint) $$,
  'owner can read own subcategories'
);
select results_eq(
  $$ select count(*) from public.user_settings $$,
  $$ values (1::bigint) $$,
  'new-user trigger creates owner-visible settings'
);

select results_eq(
  $$ update public.transactions set description = 'Updated pay', version = 99 returning version $$,
  $$ values (2::bigint) $$,
  'owner updates increment the version instead of accepting a client value'
);
select results_eq(
  $$ update public.transactions set description = 'Stale pay' where version = 1 returning 1 $$,
  $$ select 1 where false $$,
  'stale transaction versions cannot update a newer row'
);
select results_eq(
  $$ select public.get_account_balance() $$,
  $$ values (1000::numeric) $$,
  'account balance includes only the authenticated owner transactions'
);
select results_eq(
  $$ update public.budget_preferences set essentials_percent = 60, savings_percent = 20, non_essentials_percent = 20 returning 1 $$,
  $$ values (1) $$,
  'owner can update own budget preference'
);
select results_eq(
  $$ update public.transaction_subcategories set is_active = false returning 1 $$,
  $$ values (1) $$,
  'owner can update own subcategories'
);
select results_eq(
  $$ update public.user_settings set currency_code = 'USD' returning 1 $$,
  $$ values (1) $$,
  'owner can update own settings'
);

select results_eq(
  $$ delete from public.transactions where version = 1 returning 1 $$,
  $$ select 1 where false $$,
  'stale transaction versions cannot delete a newer row'
);
select results_eq(
  $$ delete from public.transactions where version = 2 returning 1 $$,
  $$ values (1) $$,
  'owner can delete a transaction with the current version'
);
insert into public.transactions (id, client_request_id, user_id, type, amount, date, description)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'income', 1000, '2026-07-22', 'Pay');

select results_eq(
  $$ delete from public.budget_preferences returning 1 $$,
  $$ values (1) $$,
  'owner can delete own budget preference'
);
insert into public.budget_preferences (user_id, essentials_percent, savings_percent, non_essentials_percent)
values ('11111111-1111-4111-8111-111111111111', 50, 30, 20);

select results_eq(
  $$ delete from public.transaction_subcategories returning 1 $$,
  $$ values (1) $$,
  'owner can delete own subcategories'
);
insert into public.transaction_subcategories (user_id, type, name)
values ('11111111-1111-4111-8111-111111111111', 'bills', 'Rent');

select results_eq(
  $$ delete from public.user_settings returning 1 $$,
  $$ values (1) $$,
  'owner can delete own settings'
);
insert into public.user_settings (user_id)
values ('11111111-1111-4111-8111-111111111111');

insert into public.transaction_subcategories (id, user_id, type, name)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '11111111-1111-4111-8111-111111111111',
  'savings',
  'Emergency Fund'
);

select results_eq(
  $$ insert into public.recurring_items (
    id, user_id, type, amount, description, frequency, start_date, next_due_date
  ) values (
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    '11111111-1111-4111-8111-111111111111',
    'bills',
    50,
    'Internet bill',
    'monthly',
    '2026-07-01',
    '2026-07-01'
  ) returning 1 $$,
  $$ values (1) $$,
  'owner can create a recurring item'
);

select results_eq(
  $$ insert into public.savings_goals (
    id, user_id, name, subcategory_id, target_amount, tracking_start_date
  ) values (
    'abababab-abab-4bab-8bab-abababababab',
    '11111111-1111-4111-8111-111111111111',
    'Emergency reserve',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    5000,
    '2026-07-01'
  ) returning 1 $$,
  $$ values (1) $$,
  'owner can create a savings goal'
);

select results_eq(
  $$ select count(*) from public.recurring_items $$,
  $$ values (1::bigint) $$,
  'owner can read own recurring items'
);

select results_eq(
  $$ select count(*) from public.savings_goals $$,
  $$ values (1::bigint) $$,
  'owner can read own savings goals'
);

select results_eq(
  $$
    select saved_amount
    from public.get_savings_goal_progress()
    where goal_id = 'abababab-abab-4bab-8bab-abababababab'
  $$,
  $$ values (0::numeric) $$,
  'goal progress is owner-scoped and starts at zero'
);

select results_eq(
  $$
    select description
    from public.record_recurring_occurrence(
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      '2026-07-01',
      '12121212-1212-4212-8212-121212121212',
      'bills',
      'Rent',
      50,
      '2026-07-01',
      'Internet bill',
      ''
    )
  $$,
  $$ values ('Internet bill'::text) $$,
  'recording a recurring occurrence creates a transaction'
);

select results_eq(
  $$
    select count(*)
    from public.recurring_occurrence_actions
    where recurring_item_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  $$,
  $$ values (1::bigint) $$,
  'recording stores one occurrence action'
);

select results_eq(
  $$
    select next_due_date
    from public.recurring_items
    where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  $$,
  $$ values ('2026-08-01'::date) $$,
  'recording advances the recurring schedule'
);

select results_eq(
  $$
    select next_due_date
    from public.skip_recurring_occurrence(
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      '2026-08-01'
    )
  $$,
  $$ values ('2026-09-01'::date) $$,
  'skipping advances the next occurrence without a transaction'
);

select results_eq(
  $$
    select count(*)
    from public.recurring_occurrence_actions
    where recurring_item_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  $$,
  $$ values (2::bigint) $$,
  'recorded and skipped occurrence actions are retained'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select results_eq(
  $$ select count(*) from public.transactions $$,
  $$ values (0::bigint) $$,
  'other users cannot see transactions'
);
select results_eq(
  $$ select count(*) from public.budget_preferences $$,
  $$ values (0::bigint) $$,
  'other users cannot see budget preferences'
);
select results_eq(
  $$ select count(*) from public.transaction_subcategories $$,
  $$ values (0::bigint) $$,
  'other users cannot see subcategories'
);
select results_eq(
  $$ select count(*) from public.user_settings where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'other users cannot see owner settings'
);
select results_eq(
  $$ select public.get_account_balance() $$,
  $$ values (0::numeric) $$,
  'account balance cannot expose another owners transactions'
);
select results_eq(
  $$ select count(*) from public.recurring_items $$,
  $$ values (0::bigint) $$,
  'other users cannot see recurring items'
);
select results_eq(
  $$ select count(*) from public.savings_goals $$,
  $$ values (0::bigint) $$,
  'other users cannot see savings goals'
);
select results_eq(
  $$ select count(*) from public.recurring_occurrence_actions $$,
  $$ values (0::bigint) $$,
  'other users cannot see recurring occurrence actions'
);

select throws_ok(
  $$ insert into public.transactions (user_id, type, amount, date, description) values ('11111111-1111-4111-8111-111111111111', 'income', 1, '2026-07-22', 'Spoof') $$,
  '42501',
  'new row violates row-level security policy for table "transactions"',
  'users cannot insert rows for another owner'
);
select throws_ok(
  $$ insert into public.recurring_items (
    user_id, type, amount, description, frequency, start_date, next_due_date
  ) values (
    '11111111-1111-4111-8111-111111111111',
    'bills',
    1,
    'Spoofed schedule',
    'monthly',
    '2026-07-01',
    '2026-07-01'
  ) $$,
  '42501',
  'new row violates row-level security policy for table "recurring_items"',
  'users cannot insert recurring items for another owner'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select throws_ok(
  $$ insert into public.savings_goals (
    user_id, name, subcategory_id, target_amount, tracking_start_date
  ) values (
    '11111111-1111-4111-8111-111111111111',
    'Duplicate reserve',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    6000,
    '2026-07-01'
  ) $$,
  '23505',
  null,
  'only one active goal is allowed per savings subcategory'
);

select throws_ok(
  $$
    insert into public.savings_goals (
      user_id, name, subcategory_id, target_amount, tracking_start_date
    )
    select
      '11111111-1111-4111-8111-111111111111',
      'Wrong category',
      id,
      100,
      '2026-07-01'
    from public.transaction_subcategories
    where user_id = '11111111-1111-4111-8111-111111111111'
      and type = 'bills'
    limit 1
  $$,
  'P0001',
  'Savings goals must use a savings subcategory.',
  'goals reject non-savings subcategories'
);

select throws_ok(
  $$ update public.transactions set user_id = '33333333-3333-4333-8333-333333333333' $$,
  '42501',
  'new row violates row-level security policy for table "transactions"',
  'transaction ownership is immutable'
);
select throws_ok(
  $$ update public.budget_preferences set user_id = '33333333-3333-4333-8333-333333333333' $$,
  '42501',
  'new row violates row-level security policy for table "budget_preferences"',
  'budget preference ownership is immutable'
);
select throws_ok(
  $$ update public.transaction_subcategories set user_id = '33333333-3333-4333-8333-333333333333' $$,
  '42501',
  'new row violates row-level security policy for table "transaction_subcategories"',
  'subcategory ownership is immutable'
);
select throws_ok(
  $$ update public.user_settings set user_id = '33333333-3333-4333-8333-333333333333' where user_id = '11111111-1111-4111-8111-111111111111' $$,
  '42501',
  'new row violates row-level security policy for table "user_settings"',
  'owners cannot transfer settings ownership'
);
select throws_ok(
  $$ update public.user_settings set currency_code = 'INVALID' $$,
  '23514',
  null,
  'currency constraints reject invalid codes'
);
select throws_ok(
  $$ update public.user_settings set time_zone = 'Not/A_Zone' $$,
  '22023',
  'Unsupported IANA timezone: Not/A_Zone',
  'timezone validation rejects unknown IANA zones'
);
select throws_ok(
  $$ insert into public.transactions (client_request_id, user_id, type, amount, date, description) values ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'income', 1, '2026-07-22', 'Retry') $$,
  '23505',
  null,
  'client request ids are unique per owner'
);

select results_eq(
  $$ insert into public.transactions (id, client_request_id, user_id, type, subcategory, amount, date, description, notes) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'cccccccc-1111-4111-8111-cccccccccccc', '11111111-1111-4111-8111-111111111111', 'income', repeat('s', 60), 1, '2026-07-22', 'd', repeat('n', 2000)) returning 1 $$,
  $$ values (1) $$,
  'transaction text accepts the lower description and upper notes and subcategory boundaries'
);
select results_eq(
  $$ insert into public.transactions (id, client_request_id, user_id, type, amount, date, description, notes) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-1111-4111-8111-dddddddddddd', '11111111-1111-4111-8111-111111111111', 'income', 1, '2026-07-22', repeat('d', 200), '') returning 1 $$,
  $$ values (1) $$,
  'transaction text accepts the upper description and empty notes boundaries'
);
select results_eq(
  $$ insert into public.transaction_subcategories (user_id, type, name) values ('11111111-1111-4111-8111-111111111111', 'income', 'x') returning 1 $$,
  $$ values (1) $$,
  'subcategory names accept the lower boundary'
);
select results_eq(
  $$ insert into public.transaction_subcategories (user_id, type, name) values ('11111111-1111-4111-8111-111111111111', 'savings', repeat('y', 60)) returning 1 $$,
  $$ values (1) $$,
  'subcategory names accept the upper boundary'
);
select throws_ok(
  $$ insert into public.transactions (user_id, type, amount, date, description) values ('11111111-1111-4111-8111-111111111111', 'income', 1, '2026-07-22', ' ') $$,
  '23514',
  null,
  'transaction descriptions reject empty text'
);
select throws_ok(
  $$ insert into public.transactions (user_id, type, amount, date, description) values ('11111111-1111-4111-8111-111111111111', 'income', 1, '2026-07-22', repeat('d', 201)) $$,
  '23514',
  null,
  'transaction descriptions reject oversized text'
);
select throws_ok(
  $$ insert into public.transactions (user_id, type, amount, date, description, notes) values ('11111111-1111-4111-8111-111111111111', 'income', 1, '2026-07-22', 'Notes limit', repeat('n', 2001)) $$,
  '23514',
  null,
  'transaction notes reject oversized text'
);
select throws_ok(
  $$ insert into public.transactions (user_id, type, subcategory, amount, date, description) values ('11111111-1111-4111-8111-111111111111', 'income', repeat('s', 61), 1, '2026-07-22', 'Subcategory limit') $$,
  '23514',
  null,
  'transaction subcategories reject oversized text'
);
select throws_ok(
  $$ insert into public.transaction_subcategories (user_id, type, name) values ('11111111-1111-4111-8111-111111111111', 'income', ' ') $$,
  '23514',
  null,
  'subcategory names reject empty text'
);
select throws_ok(
  $$ insert into public.transaction_subcategories (user_id, type, name) values ('11111111-1111-4111-8111-111111111111', 'income', repeat('x', 61)) $$,
  '23514',
  null,
  'subcategory names reject oversized text'
);

reset role;
delete from auth.users where id = '11111111-1111-4111-8111-111111111111';

select results_eq(
  $$ select count(*) from public.transactions where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'deleting an auth user cascades transactions'
);
select results_eq(
  $$ select count(*) from public.budget_preferences where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'deleting an auth user cascades budget preferences'
);
select results_eq(
  $$ select count(*) from public.transaction_subcategories where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'deleting an auth user cascades subcategories'
);
select results_eq(
  $$ select count(*) from public.user_settings where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'deleting an auth user cascades settings'
);
select results_eq(
  $$ select count(*) from public.recurring_items where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'deleting an auth user cascades recurring items'
);
select results_eq(
  $$ select count(*) from public.recurring_occurrence_actions where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'deleting an auth user cascades recurring occurrence actions'
);
select results_eq(
  $$ select count(*) from public.savings_goals where user_id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values (0::bigint) $$,
  'deleting an auth user cascades savings goals'
);

select * from finish();
rollback;
