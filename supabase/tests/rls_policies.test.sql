begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(68);

select has_table('public', 'transactions', 'transactions table exists');
select has_table('public', 'budget_preferences', 'budget preferences table exists');
select has_table('public', 'transaction_subcategories', 'subcategories table exists');
select has_table('public', 'user_settings', 'user settings table exists');
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

select ok(not has_table_privilege('anon', 'public.transactions', 'select'), 'anon cannot select transactions');
select ok(not has_table_privilege('anon', 'public.budget_preferences', 'select'), 'anon cannot select budget preferences');
select ok(not has_table_privilege('anon', 'public.transaction_subcategories', 'select'), 'anon cannot select subcategories');
select ok(not has_table_privilege('anon', 'public.user_settings', 'select'), 'anon cannot select user settings');
select ok(
  not has_function_privilege('anon', 'public.get_account_balance()', 'execute'),
  'anon cannot execute the account balance function'
);
select ok(
  has_function_privilege('authenticated', 'public.get_account_balance()', 'execute'),
  'authenticated users can execute the account balance function'
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

select throws_ok(
  $$ insert into public.transactions (user_id, type, amount, date, description) values ('11111111-1111-4111-8111-111111111111', 'income', 1, '2026-07-22', 'Spoof') $$,
  '42501',
  'new row violates row-level security policy for table "transactions"',
  'users cannot insert rows for another owner'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

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

select * from finish();
rollback;
