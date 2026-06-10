interface MonthlySelectorProps {
  month: number;
  year: number;
  onChange: (year: number, month: number) => void;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export default function MonthlySelector({ month, year, onChange }: MonthlySelectorProps) {
  return (
    <div className="animate-card-in motion-card rounded-xl border border-surface-variant bg-surface-container-lowest p-3 ambient-shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined animate-pop grid h-10 w-10 place-items-center rounded-lg bg-primary-fixed text-primary">
            calendar_month
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline">Period</p>
            <h2 className="text-base font-bold text-on-surface">{months[month - 1]} {year}</h2>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_7rem]">
          <label className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
            <span className="sr-only">Month</span>
            <select
              className="field-control mt-2 w-full"
              value={month}
              onChange={(event) => onChange(year, Number(event.target.value))}
              aria-label="Month"
            >
              {months.map((monthName, index) => (
                <option key={monthName} value={index + 1}>
                  {monthName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
            <span className="sr-only">Year</span>
            <input
              className="field-control mt-2 w-full"
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(event) => onChange(Number(event.target.value), month)}
              aria-label="Year"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
