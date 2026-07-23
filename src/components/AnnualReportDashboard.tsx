import { useMemo } from "react";
import { calculateAnnualReport } from "../lib/budget";
import type { Transaction } from "../types/transaction";
import AnnualCategoryBarChart from "./AnnualCategoryBarChart";
import AnnualFlowBarChart from "./AnnualFlowBarChart";
import AnnualSummaryCards from "./AnnualSummaryCards";

interface AnnualReportDashboardProps {
  transactions: Transaction[];
  year: number;
  onYearChange: (year: number) => void;
}

export default function AnnualReportDashboard({
  transactions,
  year,
  onYearChange
}: AnnualReportDashboardProps) {
  const report = useMemo(() => calculateAnnualReport(transactions, year), [transactions, year]);

  return (
    <section className="animate-screen-in flex flex-col gap-5">
      <div className="app-surface animate-card-in p-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined animate-pop grid h-10 w-10 place-items-center rounded-lg bg-primary-fixed text-primary"
              aria-hidden="true"
            >
              calendar_month
            </span>
            <div>
              <p className="text-label-sm font-label-sm uppercase text-outline">Annual View</p>
              <h2 className="text-headline-md font-headline-md text-on-surface">Annual Report</h2>
            </div>
          </div>
          <label className="w-full text-label-sm font-label-sm uppercase text-outline sm:w-32">
            Year
            <input
              className="field-control mt-2 h-10 w-full px-3 text-label-md font-label-md"
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
            />
          </label>
        </div>
        <p className="mt-3 max-w-2xl text-body-md font-body-md text-on-surface-variant">
          Yearly totals and month-by-month movement.
        </p>
      </div>

      <AnnualSummaryCards report={report} />

      {!report.hasTransactions ? (
        <div className="app-surface animate-card-in p-6 text-body-md font-body-md text-on-surface-variant">
          No transactions recorded for {year}. Add monthly entries to see annual charts.
        </div>
      ) : (
        <div className="grid min-w-0 gap-5">
          <AnnualCategoryBarChart report={report} />
          <AnnualFlowBarChart report={report} />
        </div>
      )}
    </section>
  );
}
