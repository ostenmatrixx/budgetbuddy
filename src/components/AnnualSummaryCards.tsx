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
