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
  const report = useMemo(
    () => calculateAnnualReport(transactions, year),
    [transactions, year]
  );

  return (
    <section className="flex flex-col gap-5">
      <div className="rounded-lg border border-ecru bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Annual Report</h2>
            <p className="mt-1 text-sm text-black-bean/70">
              Yearly totals and month-by-month movement.
            </p>
          </div>
          <label className="w-full text-sm font-semibold sm:w-36">
            Year
            <input
              className="mt-2 w-full rounded-lg border border-ecru bg-white px-3 py-2 text-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <AnnualSummaryCards report={report} />

      {!report.hasTransactions ? (
        <div className="rounded-lg border border-ecru bg-light-red/5 p-6 text-sm text-black-bean/70 shadow-sm">
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
