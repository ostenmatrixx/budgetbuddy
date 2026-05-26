import type { ReactNode } from "react";
import {
  calculateSubcategoryGroups,
  formatCurrency,
  normalizeTransactionSubcategory,
  type CategoryPieSegment,
  type SubcategoryGroup
} from "../lib/budget";
import {
  transactionTypeLabels,
  transactionTypeShortLabels,
  type Transaction,
  type TransactionType
} from "../types/transaction";
import CategoryPieChart from "./CategoryPieChart";

interface TransactionSectionProps {
  type: TransactionType;
  transactions: Transaction[];
  pieSegments: CategoryPieSegment[];
  year: number;
  month: number;
  onAdd: () => void;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionSection({
  type,
  transactions,
  pieSegments,
  year,
  month,
  onAdd,
  onDelete,
  onEdit
}: TransactionSectionProps) {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const subcategoryGroups = calculateSubcategoryGroups(transactions, year, month, type);
  const hasSubcategoryGroups = subcategoryGroups.length > 0;

  return (
    <section className="rounded-lg border border-ecru bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{transactionTypeLabels[type]}</h2>
          <p className="mt-1 text-sm text-black-bean/70">{formatCurrency(total)}</p>
        </div>
        <button
          className="rounded-lg bg-maroon px-3 py-2 text-sm font-bold text-white transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-maroon/30"
          type="button"
          onClick={onAdd}
        >
          Add
        </button>
      </div>

      <CategoryPieChart segments={pieSegments} />

      {hasSubcategoryGroups ? (
        <div className="mt-4 grid gap-3">
          {subcategoryGroups.map((group) => (
            <SubcategoryCard
              group={group}
              key={group.label}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <TransactionList
          emptyLabel={transactionTypeShortLabels[type].toLowerCase()}
          transactions={transactions}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      )}
    </section>
  );
}

interface SubcategoryCardProps {
  group: SubcategoryGroup;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

function SubcategoryCard({ group, onDelete, onEdit }: SubcategoryCardProps) {
  const entryLabel = group.transactions.length === 1 ? "entry" : "entries";

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
        <div className="mt-3 divide-y divide-ecru/70 rounded-lg bg-white/75 px-3">
          {group.transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TransactionListProps {
  emptyLabel: string;
  transactions: Transaction[];
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

function TransactionList({ emptyLabel, transactions, onDelete, onEdit }: TransactionListProps) {
  return (
    <div className="mt-4 divide-y divide-ecru/60">
      {transactions.length === 0 ? (
        <p className="rounded-lg bg-light-red/5 px-3 py-4 text-sm text-black-bean/70">
          No {emptyLabel} entries for this month.
        </p>
      ) : (
        transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))
      )}
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
    <article className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{transaction.description}</p>
        <p className="mt-1 text-sm text-black-bean/70">
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
