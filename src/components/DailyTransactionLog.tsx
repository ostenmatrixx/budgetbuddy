import { formatCurrency, normalizeTransactionSubcategory } from "../lib/budget";
import {
  transactionTypeShortLabels,
  type Transaction
} from "../types/transaction";

interface DailyTransactionLogProps {
  date: string;
  transactions: Transaction[];
  onClose: () => void;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function DailyTransactionLog({
  date,
  transactions,
  onClose,
  onDelete,
  onEdit
}: DailyTransactionLogProps) {
  return (
    <section className="rounded-lg border border-ecru bg-light-red/10 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Daily Log</h2>
          <p className="text-sm text-black-bean/70">{date}</p>
        </div>
        <button
          className="rounded-lg border border-ecru px-3 py-2 text-sm font-bold transition hover:border-maroon hover:text-maroon"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {transactions.length === 0 ? (
          <p className="rounded-lg bg-white px-3 py-4 text-sm text-black-bean/70">
            No entries on this date.
          </p>
        ) : (
          transactions.map((transaction) => (
            <article className="rounded-lg bg-white p-3 shadow-sm" key={transaction.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-maroon">
                    {transactionTypeShortLabels[transaction.type]}
                  </p>
                  <h3 className="mt-1 font-bold">{transaction.description}</h3>
                  {transaction.notes ? (
                    <p className="mt-1 text-sm text-black-bean/70">{transaction.notes}</p>
                  ) : null}
                  <p className="mt-1 text-xs font-semibold text-black-bean/55">
                    {normalizeTransactionSubcategory(transaction)}
                  </p>
                </div>
                <strong>{formatCurrency(transaction.amount)}</strong>
              </div>
              <div className="mt-3 flex gap-2">
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
