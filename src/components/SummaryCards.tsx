import { formatCurrency, type BudgetSummary } from "../lib/budget";

interface SummaryCardsProps {
  summary: BudgetSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const items = [
    { label: "Total Income", value: summary.totalIncome },
    { label: "Bills Spent", value: summary.billsSpent },
    { label: "Non-Essentials Spent", value: summary.nonEssentialsSpent },
    { label: "Savings Saved", value: summary.savingsSaved },
    { label: "Total Spent", value: summary.totalSpent },
    { label: "Remaining Income", value: summary.remainingIncome, alert: summary.remainingIncome < 0 }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Dashboard summary">
      {items.map((item) => (
        <article
          className={`rounded-lg border p-4 ${
            item.alert
              ? "border-light-red bg-light-red/15"
              : "border-ecru bg-white shadow-sm"
          }`}
          key={item.label}
        >
          <p className="text-sm font-semibold text-black-bean/70">{item.label}</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(item.value)}</p>
        </article>
      ))}
    </section>
  );
}
