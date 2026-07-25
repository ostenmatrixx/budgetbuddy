import { useUserSettings } from "../contexts/UserSettingsContext";
import { getInsightCategoryLabel } from "../lib/decisionSupport";
import type { MonthlyInsights } from "../types/decisionSupport";

interface MonthlyInsightsCardProps {
  insights: MonthlyInsights;
}

export default function MonthlyInsightsCard({ insights }: MonthlyInsightsCardProps) {
  const { formatCurrency } = useUserSettings();
  const paceLabel =
    insights.budgetPace?.status === "over"
      ? "Over target pace"
      : insights.budgetPace?.status === "watch"
        ? "Close to target"
        : "On track";

  return (
    <section className="app-surface animate-card-in p-5" aria-label="This month insights">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
          Decision support
        </p>
        <h2 className="mt-1 text-xl font-semibold text-on-surface">
          {insights.period === "current"
            ? "This Month"
            : insights.period === "historical"
              ? "Month in Review"
              : "Future Month"}
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          A compact read on spending pace and savings progress.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Insight
          icon="payments"
          label="Safe to spend daily"
          value={
            insights.safeToSpendPerDay === undefined
              ? insights.period === "historical"
                ? "Month closed"
                : "Not available yet"
              : formatCurrency(insights.safeToSpendPerDay)
          }
        />
        <Insight
          icon="savings"
          label="Savings rate"
          value={
            insights.savingsRate === undefined
              ? "No income recorded"
              : `${insights.savingsRate}% of ${insights.savingsTargetRate}% target`
          }
        />
        <Insight
          icon="speed"
          label="Budget pace"
          tone={insights.budgetPace?.status === "over" ? "warning" : "default"}
          value={insights.budgetPace ? paceLabel : "Starts when the month begins"}
        />
        <Insight
          icon="compare_arrows"
          label="Largest monthly change"
          value={
            insights.largestSpendingChange
              ? `${getInsightCategoryLabel(insights.largestSpendingChange.type)} ${
                  insights.largestSpendingChange.direction === "up"
                    ? "up"
                    : insights.largestSpendingChange.direction === "down"
                      ? "down"
                      : "unchanged"
                } ${formatCurrency(Math.abs(insights.largestSpendingChange.amount))}`
              : "No spending comparison yet"
          }
        />
      </div>
    </section>
  );
}

function Insight({
  icon,
  label,
  tone = "default",
  value
}: {
  icon: string;
  label: string;
  tone?: "default" | "warning";
  value: string;
}) {
  return (
    <article className="rounded-xl border border-surface-variant bg-surface-container-low p-4">
      <span
        aria-hidden="true"
        className={`material-symbols-outlined text-[22px] ${
          tone === "warning" ? "text-error" : "text-primary"
        }`}
      >
        {icon}
      </span>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.05em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-on-surface">{value}</p>
    </article>
  );
}
