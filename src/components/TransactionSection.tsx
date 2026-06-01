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
      <section className="rounded-lg border border-ecru bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{transactionTypeLabels[type]}</h2>
            <p className="mt-1 text-sm text-black-bean/70">{formatCurrency(total)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CategoryActionButton
              label="Add transaction"
              title="Add transaction"
              variant="primary"
              onClick={onAdd}
            >
              <PlusIcon />
            </CategoryActionButton>
            <CategoryActionButton
              label="Manage subcategories"
              title="Manage subcategories"
              onClick={() => setIsManagingSubcategories(true)}
            >
              <GearIcon />
            </CategoryActionButton>
          </div>
        </div>

        <CategoryPieChart segments={pieSegments} />

        {subcategoryGroups.length > 1 ? (
          <SubcategoryNav
            groups={subcategoryGroups}
            selectedLabel={resolvedSubcategoryLabel}
            onSelect={setSelectedSubcategoryLabel}
          />
        ) : null}

        <div className="mt-4 grid gap-3">
          {selectedSubcategoryGroup ? (
            <SubcategoryCard
              group={selectedSubcategoryGroup}
              key={selectedSubcategoryGroup.label}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ) : null}
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
      ? "grid h-10 w-10 place-items-center rounded-lg bg-maroon text-white transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-maroon/30"
      : "grid h-10 w-10 place-items-center rounded-lg border border-ecru bg-white text-maroon transition hover:border-maroon hover:bg-light-red/10 focus:outline-none focus:ring-2 focus:ring-maroon/30";

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

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.38 1.08V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.08-.38H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .38-1.08V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.37.56.6 1 .6h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1 .6Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
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
      className="mt-3 overflow-x-auto border-b border-ecru/70 pb-2"
    >
      <div className="flex min-w-max items-center gap-2" role="tablist">
        {groups.map((group) => {
          const isSelected = group.label === selectedLabel;
          const entryLabel = group.transactions.length === 1 ? "entry" : "entries";

          return (
            <button
              aria-selected={isSelected}
              className={`rounded-lg px-3 py-2 text-left text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-maroon/25 ${
                isSelected
                  ? "bg-maroon text-white shadow-sm"
                  : "bg-light-red/10 text-black-bean/70 hover:bg-light-red/20 hover:text-maroon"
              }`}
              key={group.label}
              role="tab"
              type="button"
              onClick={() => onSelect(group.label)}
            >
              <span className="block max-w-[9rem] truncate">{group.label}</span>
              <span
                className={`mt-0.5 block font-semibold ${
                  isSelected ? "text-white/75" : "text-black-bean/45"
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
      className="fixed inset-0 z-50 flex items-end bg-black-bean/45 px-3 py-4 sm:items-center sm:justify-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby={headingId}
        aria-modal="true"
        className="animate-modal-in max-h-[calc(100svh-2rem)] w-full overflow-y-auto rounded-lg border border-ecru bg-white p-5 shadow-[0_20px_80px_rgba(50,24,24,0.22)] sm:max-w-lg"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-maroon">
              {transactionTypeLabels[type]}
            </p>
            <h3 className="mt-1 text-xl font-bold" id={headingId}>
              Subcategories
            </h3>
            <p className="mt-1 text-sm text-black-bean/60">
              Add options for {transactionTypeLabels[type].toLowerCase()} entries.
            </p>
          </div>
          <button
            aria-label="Close subcategory manager"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ecru text-black-bean transition hover:border-maroon hover:text-maroon focus:outline-none focus:ring-2 focus:ring-maroon/20"
            title="Close"
            type="button"
            onClick={onClose}
          >
            <XIcon />
          </button>
        </div>

        <div className="mt-4 flex justify-start">
          <span className="rounded-full bg-light-red/15 px-3 py-1.5 text-xs font-bold text-maroon">
            {activeNames.length} active
          </span>
        </div>

        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
          <label className="min-w-0 flex-1 text-xs font-bold text-black-bean/65">
            New subcategory
            <input
              className="mt-1 w-full rounded-lg border border-ecru bg-white px-3 py-2 text-sm text-black-bean outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
              maxLength={60}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
            />
          </label>
          <button
            className="rounded-lg bg-maroon px-4 py-2 text-sm font-bold text-white transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-maroon/30 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
            disabled={isSaving}
            type="submit"
          >
            Add
          </button>
        </form>

        {error ? <p className="mt-2 text-xs font-semibold text-maroon">{error}</p> : null}

        <div className="mt-4 grid gap-2">
          {activeSubcategories.length === 0 ? (
            <p className="rounded-lg bg-light-red/5 px-3 py-3 text-sm text-black-bean/60">
              No active subcategories yet.
            </p>
          ) : (
            activeSubcategories.map((subcategory) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border border-ecru/70 bg-white px-3 py-2"
                key={subcategory.id}
              >
                <span className="min-w-0 truncate text-sm font-semibold">
                  {subcategory.name}
                </span>
                <button
                  className="rounded-lg border border-light-red px-3 py-1.5 text-xs font-bold text-maroon transition hover:bg-light-red/25 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  type="button"
                  onClick={() => void handleArchive(subcategory)}
                >
                  Archive
                </button>
              </div>
            ))
          )}
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
    <div className="rounded-lg border border-light-red/30 bg-light-red/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">{group.label}</h3>
          <p className="mt-1 text-xs text-black-bean/60">
            {group.transactions.length} {entryLabel}
          </p>
        </div>
        <strong className="text-sm">{formatCurrency(group.total)}</strong>
      </div>

      {group.transactions.length === 0 ? (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-3 text-sm text-black-bean/60">
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
      ? "mt-3 divide-y divide-ecru/70 rounded-lg bg-white/75 px-3"
      : "divide-y divide-ecru/60 rounded-lg bg-white";

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
    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
      <span className="font-semibold text-black-bean/55">Sort</span>
      <div className="grid grid-cols-2 rounded-lg border border-ecru bg-white p-0.5">
        {(["newest", "oldest"] as const).map((nextSortOrder) => (
          <button
            className={`rounded-md px-2 py-1 font-bold transition ${
              sortOrder === nextSortOrder
                ? "bg-light-red/25 text-maroon"
                : "text-black-bean/60 hover:text-maroon"
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
    <div className="mt-3 flex items-center justify-between gap-3 text-xs">
      <button
        className="rounded-lg border border-ecru px-3 py-2 font-bold text-black-bean/70 transition hover:border-maroon hover:text-maroon disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        disabled={!hasPreviousPage}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      <span className="font-semibold text-black-bean/60">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="rounded-lg border border-ecru px-3 py-2 font-bold text-black-bean/70 transition hover:border-maroon hover:text-maroon disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        disabled={!hasNextPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
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
  return (
    <article className="flex min-h-[4.5rem] flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold">{transaction.description}</p>
        <p className="mt-1 truncate text-sm text-black-bean/70">
          {transaction.date}
          {` - ${normalizeTransactionSubcategory(transaction)}`}
          {transaction.notes ? ` - ${transaction.notes}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <strong className="mr-auto sm:mr-3">{formatCurrency(transaction.amount)}</strong>
        <IconButton label="Edit transaction" title="Edit transaction" onClick={() => onEdit(transaction)}>
          <PencilIcon />
        </IconButton>
        <IconButton
          label="Delete transaction"
          title="Delete transaction"
          variant="danger"
          onClick={() => onDelete(transaction)}
        >
          <TrashIcon />
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
      ? "rounded-lg border border-light-red p-2 text-maroon transition hover:bg-light-red/25 focus:outline-none focus:ring-2 focus:ring-maroon/20"
      : "rounded-lg border border-ecru p-2 text-black-bean transition hover:border-maroon hover:text-maroon focus:outline-none focus:ring-2 focus:ring-maroon/20";

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

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}
