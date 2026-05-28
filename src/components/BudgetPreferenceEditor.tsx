import { useEffect, useMemo, useState } from "react";
import {
  balanceBudgetPreference,
  getBudgetPreferenceTotal,
  validateBudgetPreferenceInput,
  type BudgetPreference,
  type BudgetPreferenceKey
} from "../lib/budget";

interface BudgetPreferenceEditorProps {
  isSaving: boolean;
  preference: BudgetPreference;
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
  isSaving,
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
    if (!validation.isValid || !validation.value) {
      return;
    }

    try {
      await onSave(validation.value);
      setStatusMessage("Targets saved.");
    } catch {
      setStatusMessage("");
    }
  }

  return (
    <section className="rounded-lg border border-light-red/35 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold">Budget Targets</h2>
          <p className="mt-1 text-sm text-black-bean/65">
            Set the monthly allocation split used by the target cards.
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-2 py-1 text-xs font-bold ${
            total === 100 ? "bg-light-red/15 text-black-bean" : "bg-light-red/35 text-maroon"
          }`}
        >
          Total {total}%
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {fields.map((field) => (
          <label className="text-sm font-semibold" key={field.key}>
            {field.label}
            <div className="mt-2 flex items-center rounded-lg border border-ecru bg-white/80 px-3 focus-within:border-maroon focus-within:ring-2 focus-within:ring-maroon/20">
              <input
                className="min-w-0 flex-1 bg-transparent py-2 text-base font-bold outline-none"
                type="number"
                min="0"
                max="100"
                step="1"
                value={draft[field.key]}
                onChange={(event) => updateValue(field.key, event.target.value)}
              />
              <span className="text-sm font-bold text-black-bean/50">%</span>
            </div>
            {validation.errors[field.key] ? (
              <span className="mt-1 block text-xs text-maroon">
                {validation.errors[field.key]}
              </span>
            ) : null}
          </label>
        ))}
      </div>

      {validation.errors.total ? (
        <p className="mt-3 rounded-lg bg-light-red/15 px-3 py-2 text-sm font-semibold text-maroon">
          {validation.errors.total}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="mt-3 rounded-lg bg-light-red/10 px-3 py-2 text-sm font-semibold text-black-bean/70">
          {statusMessage}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          className="rounded-lg border border-ecru px-4 py-2 text-sm font-bold text-black-bean transition hover:border-maroon hover:text-maroon focus:outline-none focus:ring-2 focus:ring-maroon/20"
          type="button"
          onClick={handleBalanceOthers}
        >
          Balance others
        </button>
        <button
          className="rounded-lg bg-maroon px-4 py-2 text-sm font-bold text-white transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-maroon/30 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={!validation.isValid || !hasChanges || isSaving}
          onClick={handleSave}
        >
          {isSaving ? "Saving..." : "Save targets"}
        </button>
      </div>
    </section>
  );
}
