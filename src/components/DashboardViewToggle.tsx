export type DashboardView = "monthly" | "annual";

interface DashboardViewToggleProps {
  view: DashboardView;
  onChange: (view: DashboardView) => void;
}

const views: Array<{ id: DashboardView; icon: string; label: string }> = [
  { id: "monthly", icon: "dashboard", label: "Monthly Dashboard" },
  { id: "annual", icon: "bar_chart", label: "Annual Report" }
];

export default function DashboardViewToggle({ view, onChange }: DashboardViewToggleProps) {
  return (
    <div className="flex flex-col gap-1" aria-label="Dashboard view">
      {views.map((item) => {
        const isActive = view === item.id;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={`motion-nav-item motion-button flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition ${
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
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
