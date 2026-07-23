create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency_code text not null default 'PHP',
  locale text not null default 'en-PH',
  time_zone text not null default 'Asia/Manila',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_currency_code_check
    check (currency_code ~ '^[A-Z]{3}$'),
  constraint user_settings_locale_check
    check (locale ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  constraint user_settings_time_zone_not_blank_check
    check (btrim(time_zone) <> '' and length(time_zone) <= 64)
);

create or replace function public.validate_user_settings_time_zone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = new.time_zone
  ) then
    raise exception 'Unsupported IANA timezone: %', new.time_zone
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_user_settings_time_zone() from public;

drop trigger if exists validate_user_settings_time_zone on public.user_settings;
create trigger validate_user_settings_time_zone
before insert or update of time_zone on public.user_settings
for each row execute function public.validate_user_settings_time_zone();

create or replace function public.set_user_settings_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_user_settings_updated_at() from public;

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_user_settings_updated_at();

create or replace function public.create_default_user_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_default_user_settings() from public;

drop trigger if exists create_default_user_settings on auth.users;
create trigger create_default_user_settings
after insert on auth.users
for each row execute function public.create_default_user_settings();

insert into public.user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table public.user_settings enable row level security;

revoke all on public.user_settings from anon;
revoke all on public.user_settings from authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

drop policy if exists "User settings are viewable by owner" on public.user_settings;
drop policy if exists "User settings are insertable by owner" on public.user_settings;
drop policy if exists "User settings are updatable by owner" on public.user_settings;
drop policy if exists "User settings are deletable by owner" on public.user_settings;

create policy "User settings are viewable by owner"
on public.user_settings
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "User settings are insertable by owner"
on public.user_settings
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "User settings are updatable by owner"
on public.user_settings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "User settings are deletable by owner"
on public.user_settings
for delete
to authenticated
using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
