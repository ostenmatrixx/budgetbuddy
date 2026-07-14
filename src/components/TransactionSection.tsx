import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  clampTransactionPage,
  calculateSubcategoryGroups,
  formatCurrency,
  getActiveSubcategoryNames,
  normalizeSubcategoryLabel,
  normalizeTransactionSubcategory,
  paginateTransactions,
  resolveSelectedSubcategoryLabel,
  sortTransactionsForDisplay,
  TRANSACTION_PAGE_SIZE,
  type CategoryPieSegment,
  type SubcategoryGroup,
  type TransactionSortOrder
} from "../lib/budget";
import {
  transactionTypeLabels,
  type Transaction,
  type TransactionSubcategoriesByType,
  type TransactionSubcategoryOption,
  type TransactionType
} from "../types/transaction";
import CategoryPieChart from "./CategoryPieChart";

interface TransactionSectionProps {
  type: TransactionType;
  transactions: Transaction[];
  pieSegments: CategoryPieSegment[];
  subcategoriesByType: TransactionSubcategoriesByType;
  year: number;
  month: number;
  motionIndex?: number;
  onAdd: () => void;
  onAddSubcategory: (type: TransactionType, name: string) => Promise<void>;
  onArchiveSubcategory: (subcategory: TransactionSubcategoryOption) => Promise<void>;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionSection({
  type,
  transactions,
  pieSegments,
  subcategoriesByType,
  year,
  month,
  motionIndex = 0,
  onAdd,
  onAddSubcategory,
  onArchiveSubcategory,
  onDelete,
  onEdit
}: TransactionSectionProps) {
  const [isManagingSubcategories, setIsManagingSubcategories] = useState(false);
  const [selectedSubcategoryLabel, setSelectedSubcategoryLabel] = useState("");
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const subcategoryGroups = calculateSubcategoryGroups(
    transactions,
    year,
    month,
    type,
    subcategoriesByType
  );
  const subcategories = subcategoriesByType[type] ?? [];
  const resolvedSubcategoryLabel = resolveSelectedSubcategoryLabel(
    subcategoryGroups,
    selectedSubcategoryLabel
  );
  const selectedSubcategoryGroup =
    subcategoryGroups.find((group) => group.label === resolvedSubcategoryLabel) ??
    subcategoryGroups[0];

  useEffect(() => {
    if (selectedSubcategoryLabel !== resolvedSubcategoryLabel) {
      setSelectedSubcategoryLabel(resolvedSubcategoryLabel);
    }
  }, [resolvedSubcategoryLabel, selectedSubcategoryLabel]);

  return (
    <>
      <section className={`app-surface animate-card-in stagger-${(motionIndex % 6) + 1} motion-card overflow-hidden`}>
        <div className="flex items-start justify-between gap-3 border-b border-surface-variant p-5">
          <div className="flex min-w-0 items-center gap-4">
            <span
              className="material-symbols-outlined animate-pop grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {getCategoryIcon(type)}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                Category
              </p>
              <h2 className="mt-1 truncate text-2xl font-bold text-on-surface">
                {transactionTypeLabels[type]}
              </h2>
              <p className="mt-1 text-sm font-semibold text-on-surface-variant">
                {formatCurrency(total)} recorded this month
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CategoryActionButton
              label="Add transaction"
              title="Add transaction"
              variant="primary"
              onClick={onAdd}
            >
              <MaterialIcon name="add" />
            </CategoryActionButton>
            <CategoryActionButton
              label="Manage subcategories"
              title="Manage subcategories"
              onClick={() => setIsManagingSubcategories(true)}
            >
              <MaterialIcon name="settings" />
            </CategoryActionButton>
          </div>
        </div>

        <div className="p-5 pt-0">
          <CategoryPieChart segments={pieSegments} />

          {subcategoryGroups.length > 1 ? (
            <SubcategoryNav
              groups={subcategoryGroups}
              selectedLabel={resolvedSubcategoryLabel}
              onSelect={setSelectedSubcategoryLabel}
            />
          ) : null}

          <div className="mt-5 grid gap-3">
            {selectedSubcategoryGroup ? (
              <SubcategoryCard
                group={selectedSubcategoryGroup}
                key={selectedSubcategoryGroup.label}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ) : null}
          </div>
        </div>
      </section>

      {isManagingSubcategories ? (
        <SubcategoryManagerModal
          subcategories={subcategories}
          type={type}
          onAddSubcategory={onAddSubcategory}
          onArchiveSubcategory={onArchiveSubcategory}
          onClose={() => setIsManagingSubcategories(false)}
        />
      ) : null}
    </>
  );
}

interface CategoryActionButtonProps {
  children: ReactNode;
  label: string;
  title: string;
  variant?: "default" | "primary";
  onClick: () => void;
}

function CategoryActionButton({
  children,
  label,
  title,
  variant = "default",
  onClick
}: CategoryActionButtonProps) {
  const className =
    variant === "primary"
      ? "motion-icon-button motion-button grid h-11 w-11 place-items-center rounded-lg bg-primary text-on-primary shadow-sm transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-primary/20"
      : "motion-icon-button motion-button grid h-11 w-11 place-items-center rounded-lg border border-surface-variant bg-surface-container-low text-primary transition hover:border-outline hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/10";

  return (
    <button
      aria-label={label}
      className={className}
      title={title}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface SubcategoryNavProps {
  groups: SubcategoryGroup[];
  selectedLabel: string;
  onSelect: (label: string) => void;
}

function SubcategoryNav({ groups, selectedLabel, onSelect }: SubcategoryNavProps) {
  return (
    <nav
      aria-label="Subcategories"
      className="mt-5 overflow-x-auto rounded-xl border border-surface-variant bg-surface-container-low p-1"
    >
      <div className="flex min-w-max items-center gap-2" role="tablist">
        {groups.map((group) => {
          const isSelected = group.label === selectedLabel;
          const entryLabel = group.transactions.length === 1 ? "entry" : "entries";

          return (
            <button
              aria-selected={isSelected}
              className={`motion-button rounded-lg px-4 py-2.5 text-left text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                isSelected
                  ? "animate-pop bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              }`}
              key={group.label}
              role="tab"
              type="button"
              onClick={() => onSelect(group.label)}
            >
              <span className="block max-w-[9rem] truncate">{group.label}</span>
              <span
                className={`mt-0.5 block font-semibold ${
                  isSelected ? "text-outline" : "text-outline"
                }`}
              >
                {group.transactions.length} {entryLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface SubcategoryManagerModalProps {
  subcategories: TransactionSubcategoryOption[];
  type: TransactionType;
  onAddSubcategory: (type: TransactionType, name: string) => Promise<void>;
  onArchiveSubcategory: (subcategory: TransactionSubcategoryOption) => Promise<void>;
  onClose: () => void;
}

function SubcategoryManagerModal({
  subcategories,
  type,
  onAddSubcategory,
  onArchiveSubcategory,
  onClose
}: SubcategoryManagerModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const activeSubcategories = subcategories.filter((subcategory) => subcategory.isActive);
  const activeNames = getActiveSubcategoryNames({ [type]: subcategories }, type);
  const headingId = `subcategory-manager-${type}`;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = normalizeSubcategoryLabel(name);

    if (!normalizedName) {
      setError("Add a subcategory name.");
      return;
    }

    const isDuplicate = subcategories.some(
      (subcategory) =>
        normalizeSubcategoryLabel(subcategory.name).toLocaleLowerCase() ===
        normalizedName.toLocaleLowerCase()
    );

    if (isDuplicate) {
      setError("That subcategory already exists for this category.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await onAddSubcategory(type, normalizedName);
      setName("");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add subcategory.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(subcategory: TransactionSubcategoryOption) {
    setError("");
    setIsSaving(true);

    try {
      await onArchiveSubcategory(subcategory);
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive this subcategory."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="motion-backdrop fixed inset-0 z-50 flex items-end bg-black-bean/45 px-3 py-4 backdrop-blur-[2px] sm:items-center sm:justify-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby={headingId}
        aria-modal="true"
        className="animate-modal-in max-h-[calc(100svh-2rem)] w-full overflow-y-auto rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_24px_90px_rgba(50,24,24,0.24)] sm:max-w-lg"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-variant p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="material-symbols-outlined animate-pop grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary">
              tune
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                {transactionTypeLabels[type]}
              </p>
              <h3 className="mt-1 text-xl font-bold text-on-surface" id={headingId}>
                Subcategories
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Add options for {transactionTypeLabels[type].toLowerCase()} entries.
              </p>
            </div>
          </div>
          <button
            aria-label="Close subcategory manager"
            className="icon-control shrink-0"
            title="Close"
            type="button"
            onClick={onClose}
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1.5 text-xs font-bold text-primary">
              <MaterialIcon className="text-[16px]" name="settings" />
              {activeNames.length} active
            </span>
          </div>

          <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
            <label className="min-w-0 flex-1 text-xs font-bold uppercase tracking-[0.05em] text-outline">
              New subcategory
              <span className="input-well mt-1 flex items-center gap-2 rounded-xl px-3 py-2">
                <MaterialIcon className="text-[20px] text-outline" name="add_circle" />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-on-surface outline-none focus:ring-0"
                  maxLength={60}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                />
              </span>
            </label>
            <button
              className="motion-button motion-icon-button inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
              disabled={isSaving}
              type="submit"
            >
              <MaterialIcon className="text-[20px]" name="add" />
              Add
            </button>
          </form>

          {error ? <p className="mt-2 text-xs font-semibold text-maroon">{error}</p> : null}

          <div className="mt-4 grid gap-2">
            {activeSubcategories.length === 0 ? (
              <p className="rounded-lg bg-surface-container-low px-3 py-3 text-sm text-on-surface-variant">
                No active subcategories yet.
              </p>
            ) : (
              activeSubcategories.map((subcategory) => (
                <div
                  className="animate-slide-up flex items-center justify-between gap-3 rounded-xl border border-surface-variant bg-surface-container-lowest px-3 py-2.5 transition hover:bg-surface-container-low"
                  key={subcategory.id}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MaterialIcon className="text-[20px] text-primary" name="sell" />
                    <span className="min-w-0 truncate text-sm font-semibold">
                      {subcategory.name}
                    </span>
                  </span>
                  <button
                    aria-label={`Archive ${subcategory.name}`}
                    className="motion-icon-button grid h-9 w-9 place-items-center rounded-lg border border-outline-variant text-primary transition hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSaving}
                    title="Archive"
                    type="button"
                    onClick={() => void handleArchive(subcategory)}
                  >
                    <MaterialIcon className="text-[20px]" name="archive" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

interface SubcategoryCardProps {
  group: SubcategoryGroup;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

function SubcategoryCard({ group, onDelete, onEdit }: SubcategoryCardProps) {
  const entryLabel = group.transactions.length === 1 ? "entry" : "entries";
  const listState = usePaginatedTransactionList(group.transactions);

  return (
    <div className="animate-card-in overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest">
      <div className="flex items-start justify-between gap-3 border-b border-surface-variant p-4">
        <div>
          <h3 className="text-lg font-bold text-on-surface">{group.label}</h3>
          <p className="mt-1 text-xs font-semibold text-outline">
            {group.transactions.length} {entryLabel}
          </p>
        </div>
        <strong className="rounded-full bg-surface-container px-3 py-1 text-sm text-on-surface">
          {formatCurrency(group.total)}
        </strong>
      </div>

      {group.transactions.length === 0 ? (
        <p className="m-4 rounded-lg bg-surface-container-low px-3 py-3 text-sm text-on-surface-variant">
          No entries yet.
        </p>
      ) : (
        <PaginatedTransactionList
          listState={listState}
          onDelete={onDelete}
          onEdit={onEdit}
          surface="subtle"
        />
      )}
    </div>
  );
}

interface PaginatedListState {
  page: ReturnType<typeof paginateTransactions>;
  setPage: (page: number) => void;
  setSortOrder: (sortOrder: TransactionSortOrder) => void;
  sortOrder: TransactionSortOrder;
}

interface PaginatedTransactionListProps {
  listState: PaginatedListState;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  surface?: "default" | "subtle";
}

function PaginatedTransactionList({
  listState,
  onDelete,
  onEdit,
  surface = "default"
}: PaginatedTransactionListProps) {
  const { page, setPage, setSortOrder, sortOrder } = listState;
  const listClassName =
    surface === "subtle"
      ? "divide-y divide-surface-variant bg-surface-container-lowest"
      : "divide-y divide-surface-variant rounded-xl border border-surface-variant bg-surface-container-lowest";

  return (
    <div>
      <TransactionListToolbar sortOrder={sortOrder} onChangeSortOrder={setSortOrder} />

      <div className={`${listClassName} min-h-[22.5rem]`}>
        {page.items.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      {page.totalItems > TRANSACTION_PAGE_SIZE ? (
        <PaginationFooter
          currentPage={page.currentPage}
          hasNextPage={page.hasNextPage}
          hasPreviousPage={page.hasPreviousPage}
          totalPages={page.totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

interface TransactionListToolbarProps {
  sortOrder: TransactionSortOrder;
  onChangeSortOrder: (sortOrder: TransactionSortOrder) => void;
}

function TransactionListToolbar({
  sortOrder,
  onChangeSortOrder
}: TransactionListToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-surface-variant bg-surface-container-low/50 px-4 py-3 text-xs">
      <span className="font-bold uppercase tracking-[0.05em] text-outline">Sort</span>
      <div className="grid grid-cols-2 rounded-lg bg-surface-container p-0.5">
        {(["newest", "oldest"] as const).map((nextSortOrder) => (
          <button
            className={`motion-button rounded-md px-2 py-1 font-bold transition ${
              sortOrder === nextSortOrder
                ? "animate-pop bg-surface-container-lowest text-primary shadow-sm"
                : "text-outline hover:text-primary"
            }`}
            key={nextSortOrder}
            type="button"
            onClick={() => onChangeSortOrder(nextSortOrder)}
          >
            {nextSortOrder === "newest" ? "Newest" : "Oldest"}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PaginationFooterProps {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationFooter({
  currentPage,
  hasNextPage,
  hasPreviousPage,
  totalPages,
  onPageChange
}: PaginationFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-surface-variant bg-surface-container-low/50 px-4 py-3 text-xs">
      <button
        className="motion-button motion-icon-button inline-flex items-center gap-1 rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2 font-bold text-on-surface-variant transition hover:border-outline hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={!hasPreviousPage}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <MaterialIcon className="text-[18px]" name="chevron_left" />
        Previous
      </button>
      <span className="font-semibold text-outline">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="motion-button motion-icon-button inline-flex items-center gap-1 rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2 font-bold text-on-surface-variant transition hover:border-outline hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={!hasNextPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <MaterialIcon className="text-[18px]" name="chevron_right" />
      </button>
    </div>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

function TransactionRow({ transaction, onDelete, onEdit }: TransactionRowProps) {
  const subcategory = normalizeTransactionSubcategory(transaction);

  return (
    <article className="group animate-fade-in grid min-h-[5rem] gap-3 px-4 py-3 transition hover:bg-surface-container-low sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="material-symbols-outlined grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-container text-primary transition group-hover:bg-primary group-hover:text-on-primary">
          {getCategoryIcon(transaction.type)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-on-surface">
            {transaction.description}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-outline">
            {subcategory} · {transaction.date}
            {transaction.notes ? ` · ${transaction.notes}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <strong className="mr-auto text-sm sm:mr-3">{formatCurrency(transaction.amount)}</strong>
        <IconButton label="Edit transaction" title="Edit transaction" onClick={() => onEdit(transaction)}>
          <MaterialIcon className="text-[20px]" name="edit" />
        </IconButton>
        <IconButton
          label="Delete transaction"
          title="Delete transaction"
          variant="danger"
          onClick={() => onDelete(transaction)}
        >
          <MaterialIcon className="text-[20px]" name="delete" />
        </IconButton>
      </div>
    </article>
  );
}

function usePaginatedTransactionList(transactions: Transaction[]): PaginatedListState {
  const [sortOrder, setSortOrder] = useState<TransactionSortOrder>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const sortedTransactions = useMemo(
    () => sortTransactionsForDisplay(transactions, sortOrder),
    [sortOrder, transactions]
  );
  const page = useMemo(
    () => paginateTransactions(sortedTransactions, currentPage),
    [currentPage, sortedTransactions]
  );

  useEffect(() => {
    setCurrentPage((pageNumber) => clampTransactionPage(pageNumber, sortedTransactions.length));
  }, [sortedTransactions.length]);

  function handleSortOrderChange(nextSortOrder: TransactionSortOrder) {
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
  }

  return {
    page,
    setPage: (pageNumber) => setCurrentPage(pageNumber),
    setSortOrder: handleSortOrderChange,
    sortOrder
  };
}

interface IconButtonProps {
  children: ReactNode;
  label: string;
  title: string;
  variant?: "default" | "danger";
  onClick: () => void;
}

function IconButton({
  children,
  label,
  title,
  variant = "default",
  onClick
}: IconButtonProps) {
  const className =
    variant === "danger"
      ? "motion-icon-button grid h-9 w-9 place-items-center rounded-lg border border-outline-variant bg-surface-container-lowest text-primary transition hover:bg-primary-fixed focus:outline-none focus:ring-2 focus:ring-primary/20"
      : "motion-icon-button grid h-9 w-9 place-items-center rounded-lg border border-surface-variant bg-surface-container-lowest text-on-surface-variant transition hover:border-outline hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <button
      aria-label={label}
      className={className}
      title={title}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
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

function getCategoryIcon(type: TransactionType) {
  switch (type) {
    case "bills":
      return "receipt_long";
    case "non_essentials":
      return "shopping_bag";
    case "savings":
      return "savings";
    case "income":
      return "payments";
    default:
      return "receipt_long";
  }
}
