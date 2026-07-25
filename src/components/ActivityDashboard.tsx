import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useUserSettings } from "../contexts/UserSettingsContext";
import { loadActivityPage } from "../lib/storage";
import type { ActivityFilters, ActivityPage } from "../types/decisionSupport";
import {
  transactionTypeShortLabels,
  transactionTypes,
  type Transaction,
  type TransactionType
} from "../types/transaction";

interface ActivityDashboardProps {
  refreshKey: number;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onRepeat: (transaction: Transaction) => void;
}

const emptyFilters: ActivityFilters = {
  search: "",
  types: [],
  dateFrom: "",
  dateTo: "",
  minimumAmount: "",
  maximumAmount: "",
  sort: "newest"
};

export default function ActivityDashboard({
  refreshKey,
  onDelete,
  onEdit,
  onRepeat
}: ActivityDashboardProps) {
  const { formatCurrency } = useUserSettings();
  const [draftFilters, setDraftFilters] = useState<ActivityFilters>(emptyFilters);
  const [filters, setFilters] = useState<ActivityFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ActivityPage>({
    items: [],
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError("");

    loadActivityPage(filters, page)
      .then((nextResult) => {
        if (isActive) {
          setResult(nextResult);
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load transaction activity."
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [filterKey, filters, page, refreshKey]);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters(draftFilters);
  }

  function toggleType(type: TransactionType) {
    setDraftFilters((current) => ({
      ...current,
      types: current.types.includes(type)
        ? current.types.filter((entry) => entry !== type)
        : [...current.types, type]
    }));
  }

  return (
    <section className="animate-screen-in" aria-labelledby="activity-title">
      <div className="app-surface p-5">
        <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">All history</p>
        <h2 className="mt-1 text-2xl font-bold text-on-surface" id="activity-title">
          Activity
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Search, filter, edit, or repeat any transaction in your account.
        </p>

        <form className="mt-5 grid gap-3" onSubmit={submitFilters}>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
            <label className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
              Search
              <input
                aria-label="Search activity"
                className="input-well mt-2 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Description, subcategory, or notes"
                type="search"
                value={draftFilters.search}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, search: event.target.value }))
                }
              />
            </label>
            <FilterInput
              label="From"
              type="date"
              value={draftFilters.dateFrom}
              onChange={(value) => setDraftFilters((current) => ({ ...current, dateFrom: value }))}
            />
            <FilterInput
              label="To"
              type="date"
              value={draftFilters.dateTo}
              onChange={(value) => setDraftFilters((current) => ({ ...current, dateTo: value }))}
            />
          </div>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
              Categories
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {transactionTypes.map((type) => {
                const selected = draftFilters.types.includes(type);
                return (
                  <button
                    aria-pressed={selected}
                    className={`motion-button rounded-full border px-3 py-2 text-xs font-bold transition ${
                      selected
                        ? "border-primary bg-primary text-on-primary"
                        : "border-surface-variant bg-surface-container-low text-on-surface-variant hover:border-outline"
                    }`}
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                  >
                    {transactionTypeShortLabels[type]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
            <FilterInput
              label="Minimum amount"
              min="0"
              step="0.01"
              type="number"
              value={draftFilters.minimumAmount}
              onChange={(value) =>
                setDraftFilters((current) => ({ ...current, minimumAmount: value }))
              }
            />
            <FilterInput
              label="Maximum amount"
              min="0"
              step="0.01"
              type="number"
              value={draftFilters.maximumAmount}
              onChange={(value) =>
                setDraftFilters((current) => ({ ...current, maximumAmount: value }))
              }
            />
            <label className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
              Sort
              <select
                aria-label="Sort activity"
                className="input-well mt-2 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                value={draftFilters.sort}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    sort: event.target.value as ActivityFilters["sort"]
                  }))
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
            <button
              className="motion-button self-end rounded-lg border border-surface-variant px-4 py-2.5 text-sm font-bold text-primary transition hover:border-outline hover:bg-surface-container-low"
              type="button"
              onClick={() => {
                setDraftFilters(emptyFilters);
                setFilters(emptyFilters);
                setPage(1);
              }}
            >
              Reset
            </button>
            <button
              className="motion-button self-end rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition hover:bg-black-bean"
              type="submit"
            >
              Apply filters
            </button>
          </div>
        </form>
      </div>

      <div className="app-surface mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-surface-variant p-5">
          <div>
            <h3 className="font-bold text-on-surface">Transactions</h3>
            <p className="text-sm text-on-surface-variant">
              {isLoading ? "Loading…" : `${result.totalItems} matching entries`}
            </p>
          </div>
          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
            Page {result.page} of {result.totalPages}
          </span>
        </div>

        {error ? (
          <p
            className="m-5 rounded-lg bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {!isLoading && !error && result.items.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-[36px] text-outline" aria-hidden="true">
              search_off
            </span>
            <h3 className="mt-3 font-bold text-on-surface">No matching activity</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Adjust the filters or add a new transaction.
            </p>
          </div>
        ) : null}

        <div className="divide-y divide-surface-variant">
          {result.items.map((transaction) => (
            <article
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              key={transaction.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-bold text-primary">
                    {transactionTypeShortLabels[transaction.type]}
                  </span>
                  <span className="text-xs font-semibold text-outline">{transaction.date}</span>
                </div>
                <h3 className="mt-2 truncate font-bold text-on-surface">
                  {transaction.description}
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {transaction.subcategory || "No subcategory"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <strong className="whitespace-nowrap text-on-surface">
                  {formatCurrency(transaction.amount)}
                </strong>
                <div className="flex gap-1">
                  <ActivityAction
                    icon="content_copy"
                    label={`Repeat ${transaction.description}`}
                    onClick={() => onRepeat(transaction)}
                  />
                  <ActivityAction
                    icon="edit"
                    label={`Edit ${transaction.description}`}
                    onClick={() => onEdit(transaction)}
                  />
                  <ActivityAction
                    danger
                    icon="delete"
                    label={`Delete ${transaction.description}`}
                    onClick={() => onDelete(transaction)}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        {result.totalItems > 0 ? (
          <div className="flex items-center justify-between border-t border-surface-variant p-4">
            <button
              className="motion-button rounded-lg border border-surface-variant px-4 py-2 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1 || isLoading}
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <button
              className="motion-button rounded-lg border border-surface-variant px-4 py-2 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= result.totalPages || isLoading}
              type="button"
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FilterInput({
  label,
  onChange,
  value,
  ...inputProps
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  min?: string;
  step?: string;
  type: "date" | "number";
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
      {label}
      <input
        {...inputProps}
        aria-label={label}
        className="input-well mt-2 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ActivityAction({
  danger = false,
  icon,
  label,
  onClick
}: {
  danger?: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`motion-icon-button grid h-10 w-10 place-items-center rounded-lg border transition ${
        danger
          ? "border-error/30 text-error hover:bg-error-container"
          : "border-surface-variant text-on-surface-variant hover:border-outline hover:text-primary"
      }`}
      title={label}
      type="button"
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
