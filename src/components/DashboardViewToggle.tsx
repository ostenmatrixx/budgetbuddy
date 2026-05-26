export type DashboardView = "monthly" | "annual";

interface DashboardViewToggleProps {
  view: DashboardView;
  onChange: (view: DashboardView) => void;
}

const views: Array<{ id: DashboardView; label: string }> = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual Report" }
];

export default function DashboardViewToggle({ view, onChange }: DashboardViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-ecru bg-white p-1 shadow-sm">
      {views.map((item) => {
        const isActive = view === item.id;

        return (
          <button
            className={`rounded-md px-4 py-2 text-sm font-bold transition ${
              isActive
                ? "bg-maroon text-white shadow-sm"
                : "text-black-bean/70 hover:bg-light-red/10 hover:text-maroon"
            }`}
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
