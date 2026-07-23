import { useUserSettings } from "../contexts/UserSettingsContext";
import { type BudgetSummary } from "../lib/budget";

interface SummaryCardsProps {
  hideRemainingBelowDesktop?: boolean;
  summary: BudgetSummary;
}

export default function SummaryCards({
  hideRemainingBelowDesktop = false,
  summary
}: SummaryCardsProps) {
  const { formatCurrency } = useUserSettings();
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
      tone:
        summary.remainingIncome < 0 ? "error" : summary.remainingIncome > 0 ? "success" : "neutral",
      isRemaining: true
    }
  ];

  return (
    <section className="summary-grid" aria-label="Dashboard summary">
      {items.map((item, index) => (
        <article
          className={`summary-card animate-card-in stagger-${(index % 6) + 1} motion-card transition-colors ${
            item.alert ? "is-alert" : ""
          } ${item.isRemaining && hideRemainingBelowDesktop ? "is-desktop-only" : ""}`}
          key={item.label}
        >
          <p className="font-label-sm text-label-sm uppercase text-outline">{item.label}</p>
          <p
            className={`mt-2 text-2xl font-bold leading-8 ${
              item.tone === "error"
                ? "text-error"
                : item.tone === "success"
                  ? "text-success"
                  : item.tone === "primary"
                    ? "text-primary"
                    : "text-on-surface"
            }`}
          >
            {formatCurrency(item.value)}
          </p>
        </article>
      ))}
    </section>
  );
}
