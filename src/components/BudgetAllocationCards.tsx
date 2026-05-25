import { formatCurrency, progressPercent, type BudgetSummary } from "../lib/budget";

interface BudgetAllocationCardsProps {
  summary: BudgetSummary;
}

export default function BudgetAllocationCards({ summary }: BudgetAllocationCardsProps) {
  const cards = [
    {
      label: "50% Essentials / Bills",
      target: summary.essentialsTarget,
      actual: summary.billsSpent,
      remainingLabel: "Essentials remaining",
      remaining: summary.essentialsRemaining
    },
    {
      label: "30% Savings",
      target: summary.savingsTarget,
      actual: summary.savingsSaved,
      remainingLabel: "Savings to target",
      remaining: summary.savingsTarget - summary.savingsSaved
    },
    {
      label: "20% Non-Essentials",
      target: summary.nonEssentialsTarget,
      actual: summary.nonEssentialsSpent,
      remainingLabel: "Non-essentials remaining",
      remaining: summary.nonEssentialsRemaining
    }
  ];

  return (
    <section className="grid gap-3 xl:grid-cols-3" aria-label="50 30 20 budget targets">
      {cards.map((card) => {
        const isOver = card.remaining < 0;
        const percent = progressPercent(card.actual, card.target);

        return (
          <article
            className="rounded-lg border border-ecru bg-light-red/10 p-4 shadow-sm"
            key={card.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">{card.label}</h2>
                <p className="mt-1 text-xs text-black-bean/70">
                  Target {formatCurrency(card.target)}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-bold ${
                  isOver ? "bg-light-red/35 text-maroon" : "bg-white text-black-bean"
                }`}
              >
                {percent}%
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOver ? "bg-light-red" : "bg-maroon"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <p className="flex justify-between gap-3">
                <span className="text-black-bean/70">Actual</span>
                <strong>{formatCurrency(card.actual)}</strong>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-black-bean/70">{card.remainingLabel}</span>
                <strong className={isOver ? "text-maroon" : ""}>
                  {formatCurrency(card.remaining)}
                </strong>
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
