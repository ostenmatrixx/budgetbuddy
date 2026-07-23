export type DashboardView = "monthly" | "annual";

interface DashboardViewToggleProps {
  compact?: boolean;
  view: DashboardView;
  onChange: (view: DashboardView) => void;
}

const views: Array<{ id: DashboardView; icon: string; label: string; shortLabel: string }> = [
  { id: "monthly", icon: "dashboard", label: "Monthly Dashboard", shortLabel: "Monthly" },
  { id: "annual", icon: "bar_chart", label: "Annual Report", shortLabel: "Annual" }
];

export default function DashboardViewToggle({
  compact = false,
  view,
  onChange
}: DashboardViewToggleProps) {
  return (
    <div
      className={compact ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"}
      aria-label="Dashboard view"
    >
      {views.map((item) => {
        const isActive = view === item.id;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={`motion-nav-item motion-button flex w-full items-center rounded-lg py-2.5 text-sm font-semibold transition ${
              compact ? "justify-center gap-2 px-3 text-center" : "gap-3 px-4 text-left"
            } ${
              isActive
                ? "animate-pop bg-secondary-fixed text-on-secondary-fixed-variant"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
            }`}
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
            >
              {item.icon}
            </span>
            {compact ? item.shortLabel : item.label}
          </button>
        );
      })}
    </div>
  );
}
