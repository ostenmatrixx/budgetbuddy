import { useEffect, useMemo, useState } from "react";
import {
  balanceBudgetPreference,
  getBudgetPreferenceTotal,
  validateBudgetPreferenceInput,
  type BudgetPreference,
  type BudgetPreferenceKey
} from "../lib/budget";
import AccessibleDialog from "./AccessibleDialog";

interface BudgetPreferenceEditorProps {
  isWriteDisabled?: boolean;
  isSaving: boolean;
  preference: BudgetPreference;
  onClose: () => void;
  onSave: (preference: BudgetPreference) => Promise<void>;
}

const fields: Array<{
  key: BudgetPreferenceKey;
  label: string;
}> = [
  { key: "essentialsPercent", label: "Essentials" },
  { key: "savingsPercent", label: "Savings" },
  { key: "nonEssentialsPercent", label: "Non-Essentials" }
];

export default function BudgetPreferenceEditor({
  isWriteDisabled = false,
  isSaving,
  onClose,
  preference,
  onSave
}: BudgetPreferenceEditorProps) {
  const [draft, setDraft] = useState(preference);
  const [lastEditedKey, setLastEditedKey] = useState<BudgetPreferenceKey>("essentialsPercent");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setDraft(preference);
  }, [preference]);

  const validation = useMemo(() => validateBudgetPreferenceInput(draft), [draft]);
  const total = getBudgetPreferenceTotal(draft);
  const hasChanges =
    draft.essentialsPercent !== preference.essentialsPercent ||
    draft.savingsPercent !== preference.savingsPercent ||
    draft.nonEssentialsPercent !== preference.nonEssentialsPercent;

  function updateValue(key: BudgetPreferenceKey, value: string) {
    const nextValue = value === "" ? 0 : Number(value);

    setStatusMessage("");
    setLastEditedKey(key);
    setDraft((current) => ({
      ...current,
      [key]: Number.isFinite(nextValue) ? Math.round(nextValue) : current[key]
    }));
  }

  function handleBalanceOthers() {
    setStatusMessage("");
    setDraft((current) => balanceBudgetPreference(current, lastEditedKey, current[lastEditedKey]));
  }

  async function handleSave() {
    if (isWriteDisabled) {
      setStatusMessage("Reconnect to save budget targets.");
      return;
    }

    if (!validation.isValid || !validation.value) {
      return;
    }

    try {
      await onSave(validation.value);
      setStatusMessage("Targets saved.");
    } catch (saveError) {
      setStatusMessage(
        saveError instanceof Error ? saveError.message : "Unable to save budget targets."
      );
    }
  }

  return (
    <AccessibleDialog
      className="animate-modal-in w-full rounded-xl border border-surface-variant bg-surface-container-lowest p-5 ambient-shadow sm:max-w-2xl"
      descriptionId="budget-targets-description"
      isCloseBlocked={isSaving}
      labelId="budget-targets-title"
      open
      onRequestClose={onClose}
    >
      <section aria-busy={isSaving}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-label-sm text-label-sm uppercase text-primary">
              Allocation settings
            </p>
            <h2 className="mt-1 text-xl font-semibold text-on-surface" id="budget-targets-title">
              Budget Targets
            </h2>
            <p
              className="mt-1 text-sm leading-6 text-on-surface-variant"
              id="budget-targets-description"
            >
              Set the monthly allocation split used by the target cards. The total must be exactly
              100%.
            </p>
          </div>
          <button
            aria-label="Close budget target editor"
            className="icon-control motion-icon-button shrink-0"
            title="Close"
            type="button"
            disabled={isSaving}
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <span
          aria-live="polite"
          className={`mt-4 inline-flex w-fit rounded-full px-2.5 py-1 font-label-sm text-label-sm ${
            total === 100
              ? "bg-surface-container text-on-surface-variant"
              : "bg-error-container text-error"
          }`}
        >
          Total {total}%
        </span>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {fields.map((field, index) => (
            <label
              className={`animate-card-in stagger-${index + 1} rounded-xl border border-surface-variant bg-surface-container-low p-3 text-sm font-semibold text-on-surface`}
              key={field.key}
            >
              {field.label}
              <div className="mt-2 flex items-center rounded-lg border border-transparent bg-surface-container-lowest px-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <input
                  aria-describedby={validation.errors[field.key] ? `${field.key}-error` : undefined}
                  aria-invalid={Boolean(validation.errors[field.key])}
                  className="min-w-0 flex-1 bg-transparent py-2 text-base font-bold text-on-surface outline-none"
                  disabled={isSaving || isWriteDisabled}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={draft[field.key]}
                  onChange={(event) => updateValue(field.key, event.target.value)}
                />
                <span className="text-sm font-bold text-outline">%</span>
              </div>
              {validation.errors[field.key] ? (
                <span className="mt-1 block text-xs text-primary" id={`${field.key}-error`}>
                  {validation.errors[field.key]}
                </span>
              ) : null}
            </label>
          ))}
        </div>

        {validation.errors.total ? (
          <p
            className="mt-3 rounded-lg bg-error-container px-3 py-2 text-sm font-semibold text-error"
            role="alert"
          >
            {validation.errors.total}
          </p>
        ) : null}

        {statusMessage ? (
          <p
            className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface-variant"
            role="status"
          >
            {statusMessage}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="motion-button rounded-lg border border-surface-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition hover:border-outline hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/10"
            type="button"
            disabled={isSaving || isWriteDisabled}
            onClick={handleBalanceOthers}
          >
            Balance others
          </button>
          <button
            className="motion-button rounded-lg border border-surface-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition hover:border-outline hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/10"
            type="button"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="motion-button rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary ambient-shadow transition hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={!validation.isValid || !hasChanges || isSaving || isWriteDisabled}
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : "Save targets"}
          </button>
        </div>
      </section>
    </AccessibleDialog>
  );
}
