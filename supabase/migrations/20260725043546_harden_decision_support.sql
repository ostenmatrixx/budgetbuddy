revoke all on function public.validate_decision_support_subcategory() from public;
revoke all on function public.validate_decision_support_subcategory() from anon;
revoke all on function public.validate_decision_support_subcategory() from authenticated;

create index if not exists recurring_items_subcategory_idx
  on public.recurring_items (subcategory_id)
  where subcategory_id is not null;

create index if not exists recurring_occurrence_item_owner_idx
  on public.recurring_occurrence_actions (recurring_item_id, user_id);

create index if not exists recurring_occurrence_transaction_idx
  on public.recurring_occurrence_actions (transaction_id)
  where transaction_id is not null;

create index if not exists savings_goals_subcategory_idx
  on public.savings_goals (subcategory_id);

notify pgrst, 'reload schema';
