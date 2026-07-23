import {
  transactionTypeShortLabels,
  transactionTypes,
  type Transaction,
  type TransactionType
} from "../types/transaction";

interface CalendarWidgetProps {
  locale?: string;
  month: number;
  year: number;
  selectedDate?: string;
  transactions: Transaction[];
  onSelectDate: (date: string) => void;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dotClasses: Record<TransactionType, string> = {
  income: "bg-primary",
  bills: "bg-primary-fixed-dim",
  non_essentials: "bg-on-surface",
  savings: "bg-tertiary"
};

export default function CalendarWidget({
  locale = "en-PH",
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
    <section
      className="app-surface animate-card-in stagger-3 p-4"
      aria-label="Transaction calendar"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">Calendar</h2>
          <p className="text-sm text-on-surface-variant">Entries by day</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center font-label-sm text-label-sm text-outline">
        {weekdays.map((weekday) => (
          <span aria-hidden="true" key={weekday}>
            {weekday}
          </span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) {
            return (
              <span
                aria-hidden="true"
                className="aspect-square rounded-lg bg-surface-container-low"
                key={index}
              />
            );
          }

          const date = toDateKey(year, month, day);
          const dayEntries = entriesForDay(day);
          const dayTypes = transactionTypes.filter((type) =>
            dayEntries.some((transaction) => transaction.type === type)
          );
          const isSelected = selectedDate === date;
          const typeLabels = dayTypes.map((type) => transactionTypeShortLabels[type]);
          const countLabel = `${dayEntries.length} ${dayEntries.length === 1 ? "entry" : "entries"}`;
          const accessibleLabel = [
            formatAccessibleDate(year, month, day, locale),
            countLabel,
            typeLabels.length > 0 ? typeLabels.join(", ") : undefined
          ]
            .filter(Boolean)
            .join("; ");

          return (
            <button
              aria-label={accessibleLabel}
              aria-pressed={isSelected}
              className={`motion-button aspect-square min-h-11 rounded-lg border p-1 text-left text-xs transition hover:border-outline hover:bg-surface-container ${
                isSelected
                  ? "animate-pop border-primary bg-primary text-on-primary shadow-sm"
                  : "border-transparent bg-surface-container-lowest text-on-surface"
              }`}
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              title={accessibleLabel}
            >
              <span className="font-bold">{day}</span>
              <span className="mt-1 flex flex-wrap gap-0.5">
                {dayTypes.map((type) => (
                  <span
                    aria-hidden="true"
                    className={`animate-pop h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-on-primary" : dotClasses[type]
                    }`}
                    key={type}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-surface-variant bg-surface-container-low p-3 text-xs text-on-surface-variant">
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

function formatAccessibleDate(year: number, month: number, day: number, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(
      new Date(Date.UTC(year, month - 1, day, 12))
    );
  } catch {
    return toDateKey(year, month, day);
  }
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
