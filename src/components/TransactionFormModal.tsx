import { type FormEvent, useState } from "react";
import {
  getActiveSubcategoryNames,
  normalizeSubcategoryLabel,
  validateTransactionInput
} from "../lib/budget";
import {
  transactionTypeShortLabels,
  transactionTypes,
  type Transaction,
  type TransactionDraft,
  type TransactionErrors,
  type TransactionFormValues,
  type TransactionSubcategoriesByType,
  type TransactionSubcategoryOption,
  type TransactionType
} from "../types/transaction";

interface TransactionFormModalProps {
  defaultDate?: string;
  initialType?: TransactionType;
  subcategoriesByType: TransactionSubcategoriesByType;
  transaction?: Transaction;
  onClose: () => void;
  onSubmit: (draft: TransactionDraft) => void;
}

export default function TransactionFormModal({
  defaultDate,
  initialType,
  subcategoriesByType,
  transaction,
  onClose,
  onSubmit
}: TransactionFormModalProps) {
  const initialSubcategory = normalizeSubcategoryLabel(transaction?.subcategory);
  const [values, setValues] = useState<TransactionFormValues>(() => ({
    type: transaction?.type ?? initialType ?? "",
    subcategory: initialSubcategory,
    amount: transaction ? String(transaction.amount) : "",
    date: transaction?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10),
    description: transaction?.description ?? "",
    notes: transaction?.notes ?? ""
  }));
  const [errors, setErrors] = useState<TransactionErrors>({});

  function updateValue(field: keyof TransactionFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateType(value: string) {
    setValues((current) => ({ ...current, type: value, subcategory: "" }));
    setErrors((current) => ({ ...current, type: undefined, subcategory: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateTransactionInput(values, validationSubcategoriesByType);

    if (!result.isValid || !result.value) {
      setErrors(result.errors);
      return;
    }

    onSubmit(result.value);
  }

  const selectedType = transactionTypes.find((type) => type === values.type);
  const subcategories = selectedType
    ? getFormSubcategoryNames(subcategoriesByType, selectedType, transaction)
    : [];
  const validationSubcategoriesByType = selectedType
    ? getValidationSubcategoriesByType(subcategoriesByType, selectedType, transaction)
    : subcategoriesByType;

  return (
    <div className="motion-backdrop fixed inset-0 z-50 flex items-end bg-black-bean/45 px-3 py-4 backdrop-blur-[2px] sm:items-center sm:justify-center">
      <form
        className="animate-modal-in max-h-[calc(100svh-2rem)] w-full overflow-y-auto rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_24px_90px_rgba(50,24,24,0.24)] sm:max-w-3xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-variant p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="material-symbols-outlined animate-pop grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              add_circle
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                {transaction ? "Edit entry" : "New entry"}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-on-surface">
                Transaction details
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Add the amount, category, and date for your budget record.
              </p>
            </div>
          </div>
          <button
            aria-label="Close transaction form"
            className="icon-control motion-icon-button shrink-0"
            title="Close"
            type="button"
            onClick={onClose}
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div className="p-5">
          <section className="rounded-xl border border-surface-variant bg-surface-container-lowest p-6 text-center">
            <label className="block text-xs font-bold uppercase tracking-[0.05em] text-outline">
              Transaction amount
              <span className="mt-3 flex items-center justify-center gap-3">
                <span className="text-4xl font-bold text-primary">$</span>
                <input
                  className="w-full max-w-[16rem] border-0 bg-transparent p-0 text-center text-4xl font-bold text-on-surface outline-none placeholder:text-surface-variant focus:ring-0"
                  min="0"
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={values.amount}
                  onChange={(event) => updateValue("amount", event.target.value)}
                />
              </span>
            </label>
            {errors.amount ? (
              <span className="mt-2 block text-xs font-semibold text-maroon">
                {errors.amount}
              </span>
            ) : null}
          </section>

          <div className="mt-5 grid grid-cols-12 gap-4">
            <label className="col-span-12 text-xs font-bold uppercase tracking-[0.05em] text-outline sm:col-span-6">
              Type
              <span className="input-well mt-2 flex items-center gap-2 rounded-xl px-3 py-2">
                <MaterialIcon className="text-[20px] text-outline" name="category" />
                <select
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-on-surface outline-none focus:ring-0"
                  value={values.type}
                  onChange={(event) => updateType(event.target.value)}
                >
                  <option value="">Choose type</option>
                  {transactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {transactionTypeShortLabels[type]}
                    </option>
                  ))}
                </select>
              </span>
              {errors.type ? (
                <span className="mt-1 block text-xs normal-case tracking-normal text-maroon">
                  {errors.type}
                </span>
              ) : null}
            </label>

            {selectedType ? (
              <label className="col-span-12 text-xs font-bold uppercase tracking-[0.05em] text-outline sm:col-span-6">
                Subcategory <span className="font-semibold normal-case tracking-normal">(optional)</span>
                <span className="input-well mt-2 flex items-center gap-2 rounded-xl px-3 py-2">
                  <MaterialIcon className="text-[20px] text-outline" name="sell" />
                  <select
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-on-surface outline-none focus:ring-0"
                    value={values.subcategory ?? ""}
                    onChange={(event) => updateValue("subcategory", event.target.value)}
                  >
                    <option value="">No subcategory</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                    {subcategories.length === 0 ? (
                      <option disabled value="__none">
                        No saved subcategories yet
                      </option>
                    ) : null}
                  </select>
                </span>
                {errors.subcategory ? (
                  <span className="mt-1 block text-xs normal-case tracking-normal text-maroon">
                    {errors.subcategory}
                  </span>
                ) : null}
              </label>
            ) : null}

            <label className="col-span-12 text-xs font-bold uppercase tracking-[0.05em] text-outline sm:col-span-6">
              Date
              <span className="input-well mt-2 flex items-center gap-2 rounded-xl px-3 py-2">
                <MaterialIcon className="text-[20px] text-outline" name="calendar_today" />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-on-surface outline-none focus:ring-0"
                  type="date"
                  value={values.date}
                  onChange={(event) => updateValue("date", event.target.value)}
                />
              </span>
              {errors.date ? (
                <span className="mt-1 block text-xs normal-case tracking-normal text-maroon">
                  {errors.date}
                </span>
              ) : null}
            </label>

            <label className="col-span-12 text-xs font-bold uppercase tracking-[0.05em] text-outline sm:col-span-6">
              Description
              <span className="input-well mt-2 flex items-center gap-2 rounded-xl px-3 py-2">
                <MaterialIcon className="text-[20px] text-outline" name="notes" />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-on-surface outline-none placeholder:text-outline focus:ring-0"
                  type="text"
                  value={values.description}
                  onChange={(event) => updateValue("description", event.target.value)}
                />
              </span>
              {errors.description ? (
                <span className="mt-1 block text-xs normal-case tracking-normal text-maroon">
                  {errors.description}
                </span>
              ) : null}
            </label>
          </div>

          <label className="mt-4 block text-xs font-bold uppercase tracking-[0.05em] text-outline">
            Notes
            <span className="input-well mt-2 flex items-start gap-2 rounded-xl px-3 py-3">
              <MaterialIcon className="mt-0.5 text-[20px] text-outline" name="receipt_long" />
              <textarea
                className="min-h-24 min-w-0 flex-1 resize-y border-0 bg-transparent p-0 text-sm font-semibold text-on-surface outline-none placeholder:text-outline focus:ring-0"
                value={values.notes}
                onChange={(event) => updateValue("notes", event.target.value)}
              />
            </span>
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="motion-button rounded-lg border border-outline px-5 py-3 text-sm font-bold text-primary transition hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/10"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="motion-button motion-icon-button inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-primary/20"
              type="submit"
            >
              <MaterialIcon className="text-[20px]" filled name="check_circle" />
              Save entry
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

interface MaterialIconProps {
  className?: string;
  filled?: boolean;
  name: string;
}

function MaterialIcon({ className = "text-[22px]", filled = false, name }: MaterialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : undefined }}
    >
      {name}
    </span>
  );
}

function getFormSubcategoryNames(
  subcategoriesByType: TransactionSubcategoriesByType,
  type: TransactionType,
  transaction?: Transaction
): string[] {
  const activeNames = getActiveSubcategoryNames(subcategoriesByType, type);
  const currentName =
    transaction?.type === type ? normalizeSubcategoryLabel(transaction.subcategory) : "";
  const hasCurrentName =
    currentName &&
    !activeNames.some(
      (name) => normalizeSubcategoryLabel(name).toLocaleLowerCase() ===
        currentName.toLocaleLowerCase()
    );

  return hasCurrentName ? [...activeNames, currentName] : activeNames;
}

function getValidationSubcategoriesByType(
  subcategoriesByType: TransactionSubcategoriesByType,
  type: TransactionType,
  transaction?: Transaction
): TransactionSubcategoriesByType {
  const currentName =
    transaction?.type === type ? normalizeSubcategoryLabel(transaction.subcategory) : "";

  if (!currentName) {
    return subcategoriesByType;
  }

  const alreadyAvailable = (subcategoriesByType[type] ?? []).some(
    (subcategory) =>
      subcategory.isActive &&
      normalizeSubcategoryLabel(subcategory.name).toLocaleLowerCase() ===
        currentName.toLocaleLowerCase()
  );

  if (alreadyAvailable) {
    return subcategoriesByType;
  }

  const currentOption: TransactionSubcategoryOption = {
    id: `current-${type}-${currentName}`,
    type,
    name: currentName,
    isActive: true,
    createdAt: transaction?.createdAt ?? "",
    updatedAt: transaction?.updatedAt ?? ""
  };

  return {
    ...subcategoriesByType,
    [type]: [...(subcategoriesByType[type] ?? []), currentOption]
  };
}
