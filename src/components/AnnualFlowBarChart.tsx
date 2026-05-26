import { formatCurrency, type AnnualReport } from "../lib/budget";

interface AnnualFlowBarChartProps {
  report: AnnualReport;
}

export default function AnnualFlowBarChart({ report }: AnnualFlowBarChartProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-ecru bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Income vs Outflow</h2>
          <p className="mt-1 text-sm text-black-bean/70">
            Outflow includes essentials, non-essentials, and savings.
          </p>
        </div>
        <div className="flex gap-4 text-xs text-black-bean/70">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-maroon" />
            Income
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-light-red" />
            Outflow
          </span>
        </div>
      </div>

      <div className="mt-5 w-full overflow-x-auto pb-1">
        <div className="grid min-w-[620px] gap-3 lg:min-w-0">
          {report.months.map((month) => (
            <div
              className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3"
              key={month.month}
            >
              <p className="text-xs font-bold text-black-bean/70">{month.monthLabel}</p>
              <div className="grid gap-1.5">
                <Bar
                  label={`${month.monthLabel} income`}
                  value={month.totalIncome}
                  max={report.maxChartValue}
                  className="bg-maroon"
                />
                <Bar
                  label={`${month.monthLabel} outflow`}
                  value={month.outflow}
                  max={report.maxChartValue}
                  className="bg-light-red"
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
      className="relative h-7 overflow-hidden rounded-full bg-light-red/5"
      role="img"
      title={`${label}: ${formatCurrency(value)}`}
    >
      <span
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${className}`}
        style={{ width }}
      />
      <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-black-bean">
        {formatCurrency(value)}
      </span>
    </div>
  );
}
