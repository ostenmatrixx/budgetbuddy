import { useUserSettings } from "../contexts/UserSettingsContext";
import { type BudgetSummary } from "../lib/budget";

interface SummaryCardsProps {
  hideRemainingBelowDesktop?: boolean;
  remainingFunds: number;
  summary: BudgetSummary;
}

export default function SummaryCards({
  hideRemainingBelowDesktop = false,
  remainingFunds,
  summary
}: SummaryCardsProps) {
  const { formatCurrency } = useUserSettings();
  const items = [
    { label: "Income", value: summary.totalIncome, tone: "primary" },
    { label: "Essentials", value: summary.billsSpent },
    { label: "Non-Essentials", value: summary.nonEssentialsSpent },
    { label: "Savings Added", value: summary.savingsSaved },
    { label: "Savings Withdrawn", value: summary.savingsWithdrawn },
    {
      label: "Savings Balance",
      value: summary.savingsBalance,
      alert: summary.savingsBalance < 0,
      tone: "primary"
    },
    { label: "Total Spent", value: summary.totalSpent },
    {
      label: "Remaining Funds",
      value: remainingFunds,
      alert: remainingFunds < 0,
      tone: remainingFunds < 0 ? "error" : remainingFunds > 0 ? "success" : "neutral",
      description: "All months, including carryover",
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
          {item.description ? (
            <p className="mt-1 text-xs text-on-surface-variant">{item.description}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
