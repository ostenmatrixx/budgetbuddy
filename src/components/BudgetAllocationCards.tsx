import { progressPercent, type BudgetPreference, type BudgetSummary } from "../lib/budget";
import { useUserSettings } from "../contexts/UserSettingsContext";

interface BudgetAllocationCardsProps {
  isWriteDisabled?: boolean;
  preference: BudgetPreference;
  summary: BudgetSummary;
  onEditTargets: () => void;
}

export default function BudgetAllocationCards({
  isWriteDisabled = false,
  onEditTargets,
  preference,
  summary
}: BudgetAllocationCardsProps) {
  const { formatCurrency } = useUserSettings();
  const cards = [
    {
      label: `${preference.essentialsPercent}% Essentials`,
      target: summary.essentialsTarget,
      actual: summary.billsSpent,
      remainingLabel: "Essentials remaining",
      remaining: summary.essentialsRemaining
    },
    {
      label: `${preference.savingsPercent}% Savings`,
      target: summary.savingsTarget,
      actual: summary.savingsSaved,
      remainingLabel:
        summary.savingsSaved > summary.savingsTarget ? "Saved beyond target" : "Savings to target",
      remaining: Math.abs(summary.savingsTarget - summary.savingsSaved),
      positiveOverTarget: true
    },
    {
      label: `${preference.nonEssentialsPercent}% Non-Essentials`,
      target: summary.nonEssentialsTarget,
      actual: summary.nonEssentialsSpent,
      remainingLabel: "Non-essentials remaining",
      remaining: summary.nonEssentialsRemaining
    }
  ];

  return (
    <section className="app-surface animate-card-in stagger-2 p-5" aria-label="Budget targets">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">Budget Targets</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Your saved allocation split for this account.
          </p>
        </div>
        <button
          className="motion-button motion-icon-button inline-flex w-fit items-center gap-2 rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-primary transition hover:border-outline hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/10"
          disabled={isWriteDisabled}
          type="button"
          onClick={onEditTargets}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            tune
          </span>
          Edit Targets
        </button>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {cards.map((card, index) => {
          const isOver = !card.positiveOverTarget && card.remaining < 0;
          const percent = progressPercent(card.actual, card.target);

          return (
            <article
              className={`animate-card-in stagger-${index + 1} motion-card rounded-xl border border-surface-variant bg-surface-container-lowest p-4`}
              key={card.label}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">{card.label}</h3>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Target {formatCurrency(card.target)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 font-label-sm text-label-sm ${
                    isOver
                      ? "bg-error-container text-error"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {percent}%
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-container">
                <div
                  className="animate-bar-fill h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                <p className="flex justify-between gap-3">
                  <span className="text-on-surface-variant">Actual</span>
                  <strong className="text-on-surface">{formatCurrency(card.actual)}</strong>
                </p>
                <p className="flex items-start justify-between gap-3">
                  <span className="min-w-0 text-on-surface-variant">{card.remainingLabel}</span>
                  <strong
                    className={`shrink-0 whitespace-nowrap text-right ${
                      isOver ? "text-primary" : "text-on-surface"
                    }`}
                  >
                    {formatCurrency(card.remaining)}
                  </strong>
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
