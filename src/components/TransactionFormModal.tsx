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
    <div className="fixed inset-0 z-50 flex items-end bg-black-bean/45 px-3 py-4 sm:items-center sm:justify-center">
      <form
        className="animate-modal-in w-full rounded-lg border border-ecru bg-white p-5 shadow-[0_20px_80px_rgba(50,24,24,0.22)] sm:max-w-lg"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-maroon">
              {transaction ? "Edit entry" : "New entry"}
            </p>
            <h2 className="mt-1 text-2xl font-bold">Transaction details</h2>
          </div>
          <button
            className="rounded-lg border border-ecru px-3 py-2 text-sm font-bold transition hover:border-maroon hover:text-maroon"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Type
            <select
              className="mt-2 w-full rounded-lg border border-ecru bg-white/70 px-3 py-2 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
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
            {errors.type ? <span className="mt-1 block text-xs text-maroon">{errors.type}</span> : null}
          </label>

          {selectedType && subcategories.length > 0 ? (
            <label className="text-sm font-semibold">
              Subcategory <span className="font-normal text-black-bean/50">(optional)</span>
              <select
                className="mt-2 w-full rounded-lg border border-ecru bg-white/70 px-3 py-2 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
                value={values.subcategory ?? ""}
                onChange={(event) => updateValue("subcategory", event.target.value)}
              >
                <option value="">No subcategory</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
              {errors.subcategory ? (
                <span className="mt-1 block text-xs text-maroon">{errors.subcategory}</span>
              ) : null}
            </label>
          ) : null}

          <label className="text-sm font-semibold">
            Amount
            <input
              className="mt-2 w-full rounded-lg border border-ecru bg-white/70 px-3 py-2 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
              type="number"
              min="0"
              step="0.01"
              value={values.amount}
              onChange={(event) => updateValue("amount", event.target.value)}
            />
            {errors.amount ? (
              <span className="mt-1 block text-xs text-maroon">{errors.amount}</span>
            ) : null}
          </label>

          <label className="text-sm font-semibold">
            Date
            <input
              className="mt-2 w-full rounded-lg border border-ecru bg-white/70 px-3 py-2 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
              type="date"
              value={values.date}
              onChange={(event) => updateValue("date", event.target.value)}
            />
            {errors.date ? <span className="mt-1 block text-xs text-maroon">{errors.date}</span> : null}
          </label>

          <label className="text-sm font-semibold">
            Description
            <input
              className="mt-2 w-full rounded-lg border border-ecru bg-white/70 px-3 py-2 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
              type="text"
              value={values.description}
              onChange={(event) => updateValue("description", event.target.value)}
            />
            {errors.description ? (
              <span className="mt-1 block text-xs text-maroon">{errors.description}</span>
            ) : null}
          </label>
        </div>

        <label className="mt-4 block text-sm font-semibold">
          Notes
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-ecru bg-white/70 px-3 py-2 outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-ecru px-4 py-3 text-sm font-bold transition hover:border-maroon hover:text-maroon"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-maroon px-4 py-3 text-sm font-bold text-white transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-maroon/30"
            type="submit"
          >
            Save entry
          </button>
        </div>
      </form>
    </div>
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
