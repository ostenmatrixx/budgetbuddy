import { useMemo, useState, type FormEvent } from "react";
import { useUserSettings } from "../contexts/UserSettingsContext";
import {
  getUpcomingRecurringItems,
  validateRecurringItemDraft,
  validateSavingsGoalDraft
} from "../lib/decisionSupport";
import {
  recurringFrequencies,
  recurringFrequencyLabels,
  type RecurringItem,
  type RecurringItemDraft,
  type SavingsGoal,
  type SavingsGoalDraft,
  type SavingsGoalProgress
} from "../types/decisionSupport";
import {
  transactionTypeShortLabels,
  transactionTypes,
  type TransactionSubcategoriesByType,
  type TransactionType
} from "../types/transaction";
import AccessibleDialog from "./AccessibleDialog";
import ConfirmDialog from "./ConfirmDialog";

interface DecisionSupportPanelsProps {
  goals: Array<{ goal: SavingsGoal; progress: SavingsGoalProgress }>;
  isWriteDisabled?: boolean;
  recurringItems: RecurringItem[];
  subcategoriesByType: TransactionSubcategoriesByType;
  todayKey: string;
  onRecordRecurring: (item: RecurringItem) => void;
  onSaveGoal: (goal: SavingsGoal | undefined, draft: SavingsGoalDraft) => Promise<void>;
  onSaveRecurring: (item: RecurringItem | undefined, draft: RecurringItemDraft) => Promise<void>;
  onSkipRecurring: (item: RecurringItem) => Promise<void>;
  onToggleGoal: (goal: SavingsGoal, isActive: boolean) => Promise<void>;
  onToggleRecurring: (item: RecurringItem, isActive: boolean) => Promise<void>;
}

export default function DecisionSupportPanels(props: DecisionSupportPanelsProps) {
  const { formatCurrency } = useUserSettings();
  const [isRecurringManagerOpen, setIsRecurringManagerOpen] = useState(false);
  const [isGoalManagerOpen, setIsGoalManagerOpen] = useState(false);
  const [itemToSkip, setItemToSkip] = useState<RecurringItem>();
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipError, setSkipError] = useState("");
  const upcoming = getUpcomingRecurringItems(props.recurringItems, props.todayKey);
  const activeGoals = props.goals.filter(({ goal }) => goal.isActive);

  async function confirmSkip() {
    if (!itemToSkip) {
      return;
    }

    setIsSkipping(true);
    setSkipError("");
    try {
      await props.onSkipRecurring(itemToSkip);
      setItemToSkip(undefined);
    } catch (error) {
      setSkipError(error instanceof Error ? error.message : "Unable to skip this occurrence.");
    } finally {
      setIsSkipping(false);
    }
  }

  return (
    <>
      <section className="grid gap-5 xl:grid-cols-2" aria-label="Plans and goals">
        <article className="app-surface p-5">
          <PanelHeader
            action="Manage"
            icon="event_repeat"
            title="Upcoming"
            onAction={() => setIsRecurringManagerOpen(true)}
          />
          {upcoming.length === 0 ? (
            <EmptyState
              message="Add a schedule to see bills and deposits before they are due."
              title="No upcoming recurring items"
            />
          ) : (
            <div className="mt-4 grid gap-3">
              {upcoming.slice(0, 4).map((item) => {
                const isOverdue = item.nextDueDate < props.todayKey;
                return (
                  <div
                    className="rounded-xl border border-surface-variant bg-surface-container-low p-4"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              isOverdue
                                ? "bg-error-container text-error"
                                : "bg-primary-fixed text-primary"
                            }`}
                          >
                            {isOverdue ? "Overdue" : item.nextDueDate}
                          </span>
                          <span className="text-xs font-semibold text-outline">
                            {recurringFrequencyLabels[item.frequency]}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate font-bold text-on-surface">
                          {item.description}
                        </h3>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {formatCurrency(item.amount)} · {transactionTypeShortLabels[item.type]}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="motion-button flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
                        disabled={props.isWriteDisabled}
                        type="button"
                        onClick={() => props.onRecordRecurring(item)}
                      >
                        Record
                      </button>
                      <button
                        className="motion-button rounded-lg border border-surface-variant px-3 py-2 text-sm font-bold text-on-surface-variant disabled:opacity-50"
                        disabled={props.isWriteDisabled}
                        type="button"
                        onClick={() => setItemToSkip(item)}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="app-surface p-5">
          <PanelHeader
            action="Manage"
            icon="savings"
            title="Savings Goals"
            onAction={() => setIsGoalManagerOpen(true)}
          />
          {activeGoals.length === 0 ? (
            <EmptyState
              message="Link a goal to a savings subcategory and contributions update automatically."
              title="No active savings goals"
            />
          ) : (
            <div className="mt-4 grid gap-3">
              {activeGoals.slice(0, 4).map(({ goal, progress }) => (
                <div
                  className="rounded-xl border border-surface-variant bg-surface-container-low p-4"
                  key={goal.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-on-surface">{goal.name}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {formatCurrency(progress.savedAmount)} of{" "}
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        progress.status === "overdue"
                          ? "bg-error-container text-error"
                          : progress.status === "completed"
                            ? "bg-tertiary-container text-success"
                            : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {progress.percent}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  {progress.recommendedPerMonth ? (
                    <p className="mt-3 text-xs font-semibold text-on-surface-variant">
                      Suggested: {formatCurrency(progress.recommendedPerMonth)} per month
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {isRecurringManagerOpen ? (
        <RecurringManager {...props} onClose={() => setIsRecurringManagerOpen(false)} />
      ) : null}
      {isGoalManagerOpen ? (
        <GoalManager {...props} onClose={() => setIsGoalManagerOpen(false)} />
      ) : null}

      <ConfirmDialog
        confirmLabel="Skip occurrence"
        description={
          itemToSkip
            ? `Skip “${itemToSkip.description}” due ${itemToSkip.nextDueDate}? No transaction will be created.`
            : "Skip this recurring occurrence?"
        }
        errorMessage={skipError || undefined}
        isOpen={Boolean(itemToSkip)}
        isPending={isSkipping}
        title="Skip this occurrence?"
        onCancel={() => {
          if (!isSkipping) {
            setItemToSkip(undefined);
            setSkipError("");
          }
        }}
        onConfirm={() => void confirmSkip()}
      />
    </>
  );
}

function PanelHeader({
  action,
  icon,
  onAction,
  title
}: {
  action: string;
  icon: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary" aria-hidden="true">
          {icon}
        </span>
        <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
      </div>
      <button
        className="motion-button rounded-lg border border-surface-variant px-3 py-2 text-sm font-bold text-primary hover:bg-surface-container-low"
        type="button"
        onClick={onAction}
      >
        {action}
      </button>
    </div>
  );
}

function EmptyState({ message, title }: { message: string; title: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-outline/60 bg-surface-container-low p-6 text-center">
      <h3 className="font-bold text-on-surface">{title}</h3>
      <p className="mt-1 text-sm text-on-surface-variant">{message}</p>
    </div>
  );
}

function RecurringManager({
  isWriteDisabled = false,
  onClose,
  onSaveRecurring,
  onToggleRecurring,
  recurringItems,
  subcategoriesByType,
  todayKey
}: DecisionSupportPanelsProps & { onClose: () => void }) {
  const { formatCurrency } = useUserSettings();
  const [editing, setEditing] = useState<RecurringItem>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle(item: RecurringItem) {
    setIsBusy(true);
    setError("");
    try {
      await onToggleRecurring(item, !item.isActive);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update schedule.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AccessibleDialog
      className="animate-modal-in max-h-[calc(100svh-2rem)] w-full overflow-y-auto rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_24px_90px_rgba(50,24,24,0.24)] sm:max-w-3xl"
      descriptionId="recurring-manager-description"
      isCloseBlocked={isBusy}
      labelId="recurring-manager-title"
      open
      onRequestClose={onClose}
    >
      <ManagerHeader
        description="Create schedules and confirm each occurrence before it becomes a transaction."
        title="Recurring items"
        titleId="recurring-manager-title"
        onClose={onClose}
      />
      <button
        className="motion-button mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-on-primary disabled:opacity-50"
        disabled={isWriteDisabled || isBusy}
        type="button"
        onClick={() => {
          setEditing(undefined);
          setIsFormOpen(true);
        }}
      >
        Add recurring item
      </button>
      {error ? (
        <p
          className="mt-4 rounded-lg bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-5 grid gap-3">
        {recurringItems.length === 0 ? (
          <EmptyState
            message="Your recurring schedules will appear here."
            title="No schedules yet"
          />
        ) : (
          recurringItems.map((item) => (
            <article
              className="rounded-xl border border-surface-variant bg-surface-container-low p-4"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-on-surface">{item.description}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {formatCurrency(item.amount)} · {recurringFrequencyLabels[item.frequency]} ·
                    Next {item.nextDueDate}
                  </p>
                </div>
                <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                  {item.isActive ? (item.nextDueDate < todayKey ? "Overdue" : "Active") : "Paused"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="motion-button rounded-lg border border-surface-variant px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"
                  disabled={isWriteDisabled || isBusy}
                  type="button"
                  onClick={() => {
                    setEditing(item);
                    setIsFormOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="motion-button rounded-lg border border-surface-variant px-3 py-2 text-xs font-bold text-on-surface-variant disabled:opacity-50"
                  disabled={isWriteDisabled || isBusy}
                  type="button"
                  onClick={() => void toggle(item)}
                >
                  {item.isActive ? "Pause" : "Resume"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      {isFormOpen ? (
        <RecurringForm
          item={editing}
          subcategoriesByType={subcategoriesByType}
          todayKey={todayKey}
          onCancel={() => setIsFormOpen(false)}
          onSave={async (draft) => {
            await onSaveRecurring(editing, draft);
            setIsFormOpen(false);
          }}
        />
      ) : null}
    </AccessibleDialog>
  );
}

function RecurringForm({
  item,
  onCancel,
  onSave,
  subcategoriesByType,
  todayKey
}: {
  item?: RecurringItem;
  onCancel: () => void;
  onSave: (draft: RecurringItemDraft) => Promise<void>;
  subcategoriesByType: TransactionSubcategoriesByType;
  todayKey: string;
}) {
  const [type, setType] = useState<TransactionType>(item?.type ?? "bills");
  const [subcategoryId, setSubcategoryId] = useState(item?.subcategoryId ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [frequency, setFrequency] = useState(item?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(item?.startDate ?? todayKey);
  const [endDate, setEndDate] = useState(item?.endDate ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const subcategories = (subcategoriesByType[type] ?? []).filter(
    (subcategory) => subcategory.isActive || subcategory.id === item?.subcategoryId
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft: RecurringItemDraft = {
      type,
      subcategoryId: subcategoryId || undefined,
      amount: Number(amount),
      description,
      notes,
      frequency,
      startDate,
      endDate: endDate || undefined
    };
    const validationError = validateRecurringItemDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save recurring item.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="mt-5 rounded-xl border border-primary/25 bg-primary-fixed/20 p-4"
      onSubmit={(event) => void submit(event)}
    >
      <h3 className="font-bold text-on-surface">{item ? "Edit schedule" : "New schedule"}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FormSelect
          label="Type"
          value={type}
          onChange={(value) => {
            setType(value as TransactionType);
            setSubcategoryId("");
          }}
          options={transactionTypes.map((transactionType) => ({
            value: transactionType,
            label: transactionTypeShortLabels[transactionType]
          }))}
        />
        <FormSelect
          label="Subcategory"
          value={subcategoryId}
          onChange={setSubcategoryId}
          options={[
            { value: "", label: "No subcategory" },
            ...subcategories.map((subcategory) => ({
              value: subcategory.id,
              label: subcategory.name
            }))
          ]}
        />
        <FormInput
          label="Amount"
          min="0.01"
          step="0.01"
          type="number"
          value={amount}
          onChange={setAmount}
        />
        <FormSelect
          label="Frequency"
          value={frequency}
          onChange={(value) => setFrequency(value as typeof frequency)}
          options={recurringFrequencies.map((entry) => ({
            value: entry,
            label: recurringFrequencyLabels[entry]
          }))}
        />
        <FormInput label="Start date" type="date" value={startDate} onChange={setStartDate} />
        <FormInput label="End date (optional)" type="date" value={endDate} onChange={setEndDate} />
        <div className="sm:col-span-2">
          <FormInput
            label="Description"
            maxLength={200}
            type="text"
            value={description}
            onChange={setDescription}
          />
        </div>
        <label className="text-xs font-bold uppercase tracking-[0.05em] text-outline sm:col-span-2">
          Notes
          <textarea
            className="input-well mt-2 min-h-20 w-full rounded-lg px-3 py-2 text-sm font-semibold text-on-surface outline-none"
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>
      <FormError error={error} />
      <FormActions isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}

function GoalManager({
  goals,
  isWriteDisabled = false,
  onClose,
  onSaveGoal,
  onToggleGoal,
  subcategoriesByType,
  todayKey
}: DecisionSupportPanelsProps & { onClose: () => void }) {
  const { formatCurrency } = useUserSettings();
  const [editing, setEditing] = useState<SavingsGoal>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle(goal: SavingsGoal) {
    setIsBusy(true);
    setError("");
    try {
      await onToggleGoal(goal, !goal.isActive);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update goal.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AccessibleDialog
      className="animate-modal-in max-h-[calc(100svh-2rem)] w-full overflow-y-auto rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_24px_90px_rgba(50,24,24,0.24)] sm:max-w-3xl"
      descriptionId="goal-manager-description"
      isCloseBlocked={isBusy}
      labelId="goal-manager-title"
      open
      onRequestClose={onClose}
    >
      <ManagerHeader
        description="Progress follows matching savings transactions from the goal’s start date."
        title="Savings goals"
        titleId="goal-manager-title"
        onClose={onClose}
      />
      <button
        className="motion-button mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-on-primary disabled:opacity-50"
        disabled={isWriteDisabled || isBusy}
        type="button"
        onClick={() => {
          setEditing(undefined);
          setIsFormOpen(true);
        }}
      >
        Add savings goal
      </button>
      {error ? (
        <p
          className="mt-4 rounded-lg bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-5 grid gap-3">
        {goals.length === 0 ? (
          <EmptyState message="Your goal progress will appear here." title="No goals yet" />
        ) : (
          goals.map(({ goal, progress }) => (
            <article
              className="rounded-xl border border-surface-variant bg-surface-container-low p-4"
              key={goal.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-on-surface">{goal.name}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {formatCurrency(progress.savedAmount)} of {formatCurrency(goal.targetAmount)}
                    {goal.targetDate ? ` · Due ${goal.targetDate}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                  {goal.isActive ? progress.status : "Archived"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="motion-button rounded-lg border border-surface-variant px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"
                  disabled={isWriteDisabled || isBusy}
                  type="button"
                  onClick={() => {
                    setEditing(goal);
                    setIsFormOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="motion-button rounded-lg border border-surface-variant px-3 py-2 text-xs font-bold text-on-surface-variant disabled:opacity-50"
                  disabled={isWriteDisabled || isBusy}
                  type="button"
                  onClick={() => void toggle(goal)}
                >
                  {goal.isActive ? "Archive" : "Restore"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      {isFormOpen ? (
        <GoalForm
          goal={editing}
          goals={goals.map(({ goal }) => goal)}
          subcategoriesByType={subcategoriesByType}
          todayKey={todayKey}
          onCancel={() => setIsFormOpen(false)}
          onSave={async (draft) => {
            await onSaveGoal(editing, draft);
            setIsFormOpen(false);
          }}
        />
      ) : null}
    </AccessibleDialog>
  );
}

function GoalForm({
  goal,
  goals,
  onCancel,
  onSave,
  subcategoriesByType,
  todayKey
}: {
  goal?: SavingsGoal;
  goals: SavingsGoal[];
  onCancel: () => void;
  onSave: (draft: SavingsGoalDraft) => Promise<void>;
  subcategoriesByType: TransactionSubcategoriesByType;
  todayKey: string;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [subcategoryId, setSubcategoryId] = useState(goal?.subcategoryId ?? "");
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : "");
  const [trackingStartDate, setTrackingStartDate] = useState(goal?.trackingStartDate ?? todayKey);
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const usedSubcategoryIds = useMemo(
    () =>
      new Set(
        goals
          .filter((entry) => entry.isActive && entry.id !== goal?.id)
          .map((entry) => entry.subcategoryId)
      ),
    [goal?.id, goals]
  );
  const subcategories = (subcategoriesByType.savings ?? []).filter(
    (subcategory) =>
      (subcategory.isActive || subcategory.id === goal?.subcategoryId) &&
      !usedSubcategoryIds.has(subcategory.id)
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft: SavingsGoalDraft = {
      name,
      subcategoryId,
      targetAmount: Number(targetAmount),
      trackingStartDate,
      targetDate: targetDate || undefined
    };
    const validationError = validateSavingsGoalDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save goal.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="mt-5 rounded-xl border border-primary/25 bg-primary-fixed/20 p-4"
      onSubmit={(event) => void submit(event)}
    >
      <h3 className="font-bold text-on-surface">{goal ? "Edit goal" : "New goal"}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FormInput label="Goal name" maxLength={100} type="text" value={name} onChange={setName} />
        <FormSelect
          label="Savings subcategory"
          value={subcategoryId}
          onChange={setSubcategoryId}
          options={[
            { value: "", label: "Choose subcategory" },
            ...subcategories.map((subcategory) => ({
              value: subcategory.id,
              label: subcategory.name
            }))
          ]}
        />
        <FormInput
          label="Target amount"
          min="0.01"
          step="0.01"
          type="number"
          value={targetAmount}
          onChange={setTargetAmount}
        />
        <FormInput
          label="Tracking start"
          type="date"
          value={trackingStartDate}
          onChange={setTrackingStartDate}
        />
        <div className="sm:col-span-2">
          <FormInput
            label="Target date (optional)"
            type="date"
            value={targetDate}
            onChange={setTargetDate}
          />
        </div>
      </div>
      <FormError error={error} />
      <FormActions isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}

function ManagerHeader({
  description,
  onClose,
  title,
  titleId
}: {
  description: string;
  onClose: () => void;
  title: string;
  titleId: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-on-surface" id={titleId}>
          {title}
        </h2>
        <p
          className="mt-1 text-sm text-on-surface-variant"
          id={titleId.replace("title", "description")}
        >
          {description}
        </p>
      </div>
      <button
        aria-label={`Close ${title.toLowerCase()}`}
        className="icon-control motion-icon-button"
        type="button"
        onClick={onClose}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          close
        </span>
      </button>
    </div>
  );
}

function FormInput({
  label,
  onChange,
  value,
  ...inputProps
}: {
  label: string;
  maxLength?: number;
  min?: string;
  onChange: (value: string) => void;
  step?: string;
  type: "date" | "number" | "text";
  value: string;
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
      {label}
      <input
        {...inputProps}
        className="input-well mt-2 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FormSelect({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
      {label}
      <select
        className="input-well mt-2 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || "__empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormError({ error }: { error: string }) {
  return error ? (
    <p
      className="mt-4 rounded-lg bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container"
      role="alert"
    >
      {error}
    </p>
  ) : null;
}

function FormActions({ isSaving, onCancel }: { isSaving: boolean; onCancel: () => void }) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button
        className="motion-button rounded-lg border border-surface-variant px-4 py-2 text-sm font-bold text-on-surface-variant"
        disabled={isSaving}
        type="button"
        onClick={onCancel}
      >
        Cancel
      </button>
      <button
        className="motion-button rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
