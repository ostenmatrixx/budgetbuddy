import {
  transactionTypeShortLabels,
  transactionTypes,
  type Transaction,
  type TransactionType
} from "../types/transaction";

interface CalendarWidgetProps {
  month: number;
  year: number;
  selectedDate?: string;
  transactions: Transaction[];
  onSelectDate: (date: string) => void;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dotClasses: Record<TransactionType, string> = {
  income: "bg-maroon",
  bills: "bg-light-red",
  non_essentials: "bg-black-bean",
  savings: "bg-ecru"
};

export default function CalendarWidget({
  month,
  year,
  selectedDate,
  transactions,
  onSelectDate
}: CalendarWidgetProps) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : undefined;
  });

  function entriesForDay(day: number): Transaction[] {
    const date = toDateKey(year, month, day);
    return transactions.filter((transaction) => transaction.date === date);
  }

  return (
    <section className="rounded-lg border border-ecru bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Calendar</h2>
          <p className="text-sm text-black-bean/70">Entries by day</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold text-black-bean/60">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) {
            return <span className="aspect-square rounded-lg bg-light-red/5" key={index} />;
          }

          const date = toDateKey(year, month, day);
          const dayEntries = entriesForDay(day);
          const dayTypes = transactionTypes.filter((type) =>
            dayEntries.some((transaction) => transaction.type === type)
          );
          const isSelected = selectedDate === date;

          return (
            <button
              className={`aspect-square rounded-lg border p-1 text-left text-xs transition hover:border-maroon hover:bg-light-red/10 ${
                isSelected
                  ? "border-maroon bg-light-red/15"
                  : "border-transparent bg-white"
              }`}
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              title={`${dayEntries.length} entries`}
            >
              <span className="font-bold">{day}</span>
              <span className="mt-1 flex flex-wrap gap-0.5">
                {dayTypes.map((type) => (
                  <span
                    aria-label={transactionTypeShortLabels[type]}
                    className={`h-1.5 w-1.5 rounded-full ${dotClasses[type]}`}
                    key={type}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-black-bean/70">
        {transactionTypes.map((type) => (
          <span className="flex items-center gap-2" key={type}>
            <span className={`h-2 w-2 rounded-full ${dotClasses[type]}`} />
            {transactionTypeShortLabels[type]}
          </span>
        ))}
      </div>
    </section>
  );
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
