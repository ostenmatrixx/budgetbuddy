import { formatCurrency, type AnnualReport } from "../lib/budget";

interface AnnualFlowBarChartProps {
  report: AnnualReport;
}

export default function AnnualFlowBarChart({ report }: AnnualFlowBarChartProps) {
  return (
    <section className="app-surface animate-card-in stagger-1 min-w-0 overflow-hidden p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-label-sm font-label-sm uppercase text-outline">Cash Flow</p>
          <h2 className="mt-1 text-headline-md font-headline-md text-on-surface">
            Income vs Outflow
          </h2>
          <p className="mt-1 text-body-md font-body-md text-on-surface-variant">
            Outflow includes essentials, non-essentials, and savings.
          </p>
        </div>
        <div className="flex gap-4 rounded-lg border border-surface-variant bg-surface-container-low p-3 text-label-sm font-label-sm text-on-surface-variant">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Income
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
            Outflow
          </span>
        </div>
      </div>

      <div className="mt-5 w-full overflow-x-auto pb-1">
        <div className="grid min-w-[680px] gap-3 lg:min-w-0">
          {report.months.map((month, index) => (
            <div
              className={`animate-slide-up stagger-${(index % 6) + 1} grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3`}
              key={month.month}
            >
              <p className="text-label-sm font-label-sm text-outline">{month.monthLabel}</p>
              <div className="grid gap-1.5">
                <Bar
                  label={`${month.monthLabel} income`}
                  value={month.totalIncome}
                  max={report.maxChartValue}
                  className="bg-primary"
                />
                <Bar
                  label={`${month.monthLabel} outflow`}
                  value={month.outflow}
                  max={report.maxChartValue}
                  className="bg-secondary"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface BarProps {
  label: string;
  value: number;
  max: number;
  className: string;
}

function Bar({ label, value, max, className }: BarProps) {
  const width = max <= 0 || value <= 0 ? "0%" : `${Math.max(4, Math.round((value / max) * 100))}%`;

  return (
    <div
      aria-label={`${label}: ${formatCurrency(value)}`}
      className="relative h-7 overflow-hidden rounded-full bg-surface-container ring-1 ring-surface-variant"
      role="img"
      title={`${label}: ${formatCurrency(value)}`}
    >
      <span
        className={`animate-bar-fill absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${className}`}
        style={{ width }}
      />
      <span className="absolute inset-y-0 right-3 flex items-center text-label-sm font-label-sm text-on-surface">
        {formatCurrency(value)}
      </span>
    </div>
  );
}
