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
    <div className="rounded-lg border border-ecru bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold">
          Month
          <select
            className="mt-2 w-full rounded-lg border border-ecru bg-white px-3 py-2 text-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            value={month}
            onChange={(event) => onChange(year, Number(event.target.value))}
          >
            {months.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
        </label>

        <label className="w-full text-sm font-semibold sm:w-32">
          Year
          <input
            className="mt-2 w-full rounded-lg border border-ecru bg-white px-3 py-2 text-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) => onChange(Number(event.target.value), month)}
          />
        </label>
      </div>
    </div>
  );
}
