revoke all on function public.validate_user_settings_time_zone()
  from public, anon, authenticated;
revoke all on function public.set_user_settings_updated_at()
  from public, anon, authenticated;
revoke all on function public.create_default_user_settings()
  from public, anon, authenticated;
revoke all on function public.increment_transaction_version()
  from public, anon, authenticated;

notify pgrst, 'reload schema';
