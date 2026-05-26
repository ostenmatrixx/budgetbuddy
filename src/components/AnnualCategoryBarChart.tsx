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
  { key: "totalIncome", label: "Income", className: "bg-maroon" },
  { key: "billsSpent", label: "Essentials", className: "bg-light-red" },
  { key: "nonEssentialsSpent", label: "Non-Essentials", className: "bg-black-bean" },
  { key: "savingsSaved", label: "Savings", className: "bg-ecru" }
];

export default function AnnualCategoryBarChart({ report }: AnnualCategoryBarChartProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-ecru bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Monthly Category Breakdown</h2>
          <p className="mt-1 text-sm text-black-bean/70">
            Income, essentials, non-essentials, and savings by month.
          </p>
        </div>
        <Legend />
      </div>

      <div className="mt-5 w-full overflow-x-auto pb-2">
        <div className="grid min-w-[620px] grid-cols-12 gap-2 lg:min-w-0">
          {report.months.map((month) => (
            <div className="flex flex-col gap-2" key={month.month}>
              <div className="flex h-56 items-end justify-center gap-1 rounded-lg bg-light-red/5 px-2 py-3">
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
                        className={`w-full rounded-t-md transition-all duration-500 ${category.className}`}
                        style={{ height }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs font-bold text-black-bean/70">
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
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-black-bean/70">
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
