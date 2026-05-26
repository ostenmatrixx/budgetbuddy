import {
  formatCurrency,
  normalizeTransactionSubcategory,
  type CategoryPieSegment
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
  onAdd: () => void;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionSection({
  type,
  transactions,
  pieSegments,
  onAdd,
  onDelete,
  onEdit
}: TransactionSectionProps) {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

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

      <div className="mt-4 divide-y divide-ecru/60">
        {transactions.length === 0 ? (
          <p className="rounded-lg bg-light-red/5 px-3 py-4 text-sm text-black-bean/70">
            No {transactionTypeShortLabels[type].toLowerCase()} entries for this month.
          </p>
        ) : (
          transactions.map((transaction) => (
            <article
              className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={transaction.id}
            >
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
                <button
                  className="rounded-lg border border-ecru px-3 py-2 text-sm font-semibold transition hover:border-maroon hover:text-maroon"
                  type="button"
                  onClick={() => onEdit(transaction)}
                >
                  Edit
                </button>
                <button
                  className="rounded-lg border border-light-red px-3 py-2 text-sm font-semibold text-maroon transition hover:bg-light-red/25"
                  type="button"
                  onClick={() => onDelete(transaction)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
