import { useUserSettings } from "../contexts/UserSettingsContext";
import { normalizeTransactionSubcategory } from "../lib/budget";
import { transactionTypeShortLabels, type Transaction } from "../types/transaction";

interface DailyTransactionLogProps {
  date: string;
  isWriteDisabled?: boolean;
  transactions: Transaction[];
  onClose: () => void;
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function DailyTransactionLog({
  date,
  isWriteDisabled = false,
  transactions,
  onClose,
  onDelete,
  onEdit
}: DailyTransactionLogProps) {
  const { formatCurrency, formatDate } = useUserSettings();
  return (
    <section className="app-surface animate-card-in p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">Daily Log</h2>
          <p className="text-sm text-on-surface-variant">{formatDate(date)}</p>
        </div>
        <button
          className="icon-control motion-icon-button h-9 w-9 shrink-0"
          aria-label="Close daily log"
          title="Close daily log"
          type="button"
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            close
          </span>
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {transactions.length === 0 ? (
          <p className="rounded-lg bg-surface-container-low px-3 py-4 text-sm text-on-surface-variant">
            No entries on this date.
          </p>
        ) : (
          transactions.map((transaction) => (
            <article
              className="animate-slide-up rounded-xl border border-surface-variant bg-surface-container-lowest p-3"
              key={transaction.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-label-sm text-label-sm uppercase text-primary">
                    {transactionTypeShortLabels[transaction.type]}
                  </p>
                  <h3 className="mt-1 font-semibold text-on-surface">{transaction.description}</h3>
                  {transaction.notes ? (
                    <p className="mt-1 text-sm text-on-surface-variant">{transaction.notes}</p>
                  ) : null}
                  <p className="mt-1 text-xs font-semibold text-outline">
                    {normalizeTransactionSubcategory(transaction)}
                  </p>
                </div>
                <strong className="text-on-surface">{formatCurrency(transaction.amount)}</strong>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  aria-label="Edit transaction"
                  className="icon-control motion-icon-button h-9 w-9"
                  disabled={isWriteDisabled}
                  title="Edit transaction"
                  type="button"
                  onClick={() => onEdit(transaction)}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    edit
                  </span>
                </button>
                <button
                  aria-label="Delete transaction"
                  className="motion-icon-button grid h-9 w-9 place-items-center rounded-lg border border-outline-variant bg-surface-container-lowest text-primary transition hover:bg-error-container focus:outline-none focus:ring-2 focus:ring-primary/10"
                  disabled={isWriteDisabled}
                  title="Delete transaction"
                  type="button"
                  onClick={() => onDelete(transaction)}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    delete
                  </span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
