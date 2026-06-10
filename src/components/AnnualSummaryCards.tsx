import { formatCurrency, type AnnualReport } from "../lib/budget";

interface AnnualSummaryCardsProps {
  report: AnnualReport;
}

export default function AnnualSummaryCards({ report }: AnnualSummaryCardsProps) {
  const items = [
    { label: "Income", value: report.yearly.totalIncome },
    { label: "Essentials", value: report.yearly.billsSpent },
    { label: "Non-Essentials", value: report.yearly.nonEssentialsSpent },
    { label: "Savings", value: report.yearly.savingsSaved },
    { label: "Total Spent", value: report.yearly.totalSpent },
    {
      label: "Remaining Income",
      value: report.yearly.remainingIncome,
      alert: report.yearly.remainingIncome < 0
    }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Annual summary">
      {items.map((item, index) => (
        <article
          className={`animate-card-in stagger-${(index % 6) + 1} motion-card rounded-xl border p-4 ambient-shadow ${
            item.alert
              ? "border-error-container bg-error-container/45"
              : "border-surface-variant bg-surface-container-lowest"
          }`}
          key={item.label}
        >
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-label-sm font-label-sm uppercase ${
                item.alert ? "text-error" : "text-outline"
              }`}
            >
              {item.label}
            </p>
            <span
              className={`material-symbols-outlined text-[20px] ${
                item.alert ? "text-error" : "text-on-surface-variant"
              }`}
              aria-hidden="true"
            >
              {item.alert ? "warning" : "monitoring"}
            </span>
          </div>
          <p
            className={`mt-3 text-headline-md font-headline-md ${
              item.alert ? "text-error" : "text-on-surface"
            }`}
          >
            {formatCurrency(item.value)}
          </p>
        </article>
      ))}
    </section>
  );
}
