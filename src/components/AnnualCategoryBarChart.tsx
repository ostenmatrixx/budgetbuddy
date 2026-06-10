import { formatCurrency, type AnnualReport, type AnnualMonthReport } from "../lib/budget";

interface AnnualCategoryBarChartProps {
  report: AnnualReport;
}

const categories: Array<{
  key: keyof Pick<
    AnnualMonthReport,
    "totalIncome" | "billsSpent" | "nonEssentialsSpent" | "savingsSaved"
  >;
  label: string;
  className: string;
}> = [
  { key: "totalIncome", label: "Income", className: "bg-primary" },
  { key: "billsSpent", label: "Essentials", className: "bg-secondary" },
  { key: "nonEssentialsSpent", label: "Non-Essentials", className: "bg-tertiary" },
  { key: "savingsSaved", label: "Savings", className: "bg-primary-fixed-dim" }
];

export default function AnnualCategoryBarChart({ report }: AnnualCategoryBarChartProps) {
  return (
    <section className="app-surface animate-card-in min-w-0 overflow-hidden p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-label-sm font-label-sm uppercase text-outline">By Category</p>
          <h2 className="mt-1 text-headline-md font-headline-md text-on-surface">
            Monthly Category Breakdown
          </h2>
          <p className="mt-1 text-body-md font-body-md text-on-surface-variant">
            Income, essentials, non-essentials, and savings by month.
          </p>
        </div>
        <Legend />
      </div>

      <div className="mt-5 w-full overflow-x-auto pb-2">
        <div className="grid min-w-[680px] grid-cols-12 gap-2.5 lg:min-w-0">
          {report.months.map((month, monthIndex) => (
            <div className={`animate-slide-up stagger-${(monthIndex % 6) + 1} flex flex-col gap-2`} key={month.month}>
              <div className="flex h-56 items-end justify-center gap-1.5 rounded-lg bg-surface-container px-2 py-3 ring-1 ring-surface-variant">
                {categories.map((category) => {
                  const value = month[category.key];
                  const height = barHeight(value, report.maxChartValue);

                  return (
                    <div
                      aria-label={`${month.monthLabel} ${category.label}: ${formatCurrency(value)}`}
                      className="flex h-full flex-1 items-end"
                      key={category.key}
                      role="img"
                      title={`${category.label}: ${formatCurrency(value)}`}
                    >
                      <span
                        className={`animate-bar-fill w-full rounded-t-sm transition-all duration-500 ${category.className}`}
                        style={{ height, animationDelay: `${monthIndex * 35}ms` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-label-sm font-label-sm text-outline">
                {month.monthLabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Legend() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-surface-variant bg-surface-container-low p-3 text-label-sm font-label-sm text-on-surface-variant">
      {categories.map((category) => (
        <span className="flex items-center gap-2" key={category.key}>
          <span className={`h-2.5 w-2.5 rounded-full ${category.className}`} />
          {category.label}
        </span>
      ))}
    </div>
  );
}

function barHeight(value: number, max: number): string {
  if (value <= 0 || max <= 0) {
    return "0%";
  }

  return `${Math.max(6, Math.round((value / max) * 100))}%`;
}
