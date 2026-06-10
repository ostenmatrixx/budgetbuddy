import { formatCurrency, type BudgetSummary } from "../lib/budget";

interface SummaryCardsProps {
  summary: BudgetSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const items = [
    { label: "Income", value: summary.totalIncome, tone: "primary" },
    { label: "Essentials", value: summary.billsSpent },
    { label: "Non-Essentials", value: summary.nonEssentialsSpent },
    { label: "Savings", value: summary.savingsSaved },
    { label: "Total Spent", value: summary.totalSpent },
    {
      label: "Remaining Income",
      value: summary.remainingIncome,
      alert: summary.remainingIncome < 0,
      tone: "primary"
    }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Dashboard summary">
      {items.map((item, index) => (
        <article
          className={`animate-card-in stagger-${(index % 6) + 1} motion-card rounded-xl border bg-surface-container-lowest p-4 ambient-shadow transition-colors ${
            item.alert
              ? "border-outline-variant"
              : item.tone === "primary"
                ? "border-surface-variant"
                : "border-surface-variant"
          }`}
          key={item.label}
        >
          <p className="font-label-sm text-label-sm uppercase text-outline">
            {item.label}
          </p>
          <p
            className={`mt-2 text-2xl font-bold leading-8 ${
              item.alert || item.tone === "primary" ? "text-primary" : "text-on-surface"
            }`}
          >
            {formatCurrency(item.value)}
          </p>
        </article>
      ))}
    </section>
  );
}
