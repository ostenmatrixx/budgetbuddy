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
      difference: summary.essentialsRemaining,
      remainingLabel:
        summary.essentialsRemaining < 0 ? "Essentials over target" : "Essentials remaining",
      positiveOverTarget: false
    },
    {
      label: `${preference.savingsPercent}% Savings`,
      target: summary.savingsTarget,
      actual: summary.savingsSaved,
      difference: summary.savingsTarget - summary.savingsSaved,
      remainingLabel:
        summary.savingsSaved > summary.savingsTarget ? "Saved beyond target" : "Savings to target",
      positiveOverTarget: true
    },
    {
      label: `${preference.nonEssentialsPercent}% Non-Essentials`,
      target: summary.nonEssentialsTarget,
      actual: summary.nonEssentialsSpent,
      difference: summary.nonEssentialsRemaining,
      remainingLabel:
        summary.nonEssentialsRemaining < 0
          ? "Non-essentials over target"
          : "Non-essentials remaining",
      positiveOverTarget: false
    }
  ];

  return (
    <section
      className="app-surface animate-card-in stagger-2 min-w-0 p-4 sm:p-5"
      aria-label="Budget targets"
    >
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
          const isBeyondTarget = card.difference < 0;
          const isOver = !card.positiveOverTarget && isBeyondTarget;
          const isPositiveBeyondTarget = card.positiveOverTarget && isBeyondTarget;
          const barPercent = progressPercent(card.actual, card.target);
          const actualPercent =
            card.target > 0 ? Math.max(0, Math.round((card.actual / card.target) * 100)) : 0;
          const remaining = Math.abs(card.difference);

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
                      : isPositiveBeyondTarget
                        ? "bg-surface-container text-success"
                        : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {actualPercent}%
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-container">
                <div
                  className="animate-bar-fill h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${barPercent}%` }}
                />
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                <p className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-3">
                  <span className="text-on-surface-variant">Actual</span>
                  <strong className="min-w-0 break-all text-right text-on-surface tabular-nums">
                    {formatCurrency(card.actual)}
                  </strong>
                </p>
                <p className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] items-start gap-3 rounded-lg bg-surface-container-low px-3 py-2">
                  <span className="min-w-0 break-words font-semibold text-on-surface-variant">
                    {card.remainingLabel}
                  </span>
                  <strong
                    className={`min-w-0 break-all text-right tabular-nums ${
                      isOver
                        ? "text-error"
                        : isPositiveBeyondTarget
                          ? "text-success"
                          : "text-on-surface"
                    }`}
                  >
                    {formatCurrency(remaining)}
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
