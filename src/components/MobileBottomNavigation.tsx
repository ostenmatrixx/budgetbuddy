export type MobileDestination = "home" | "activity" | "reports";

interface MobileBottomNavigationProps {
  active: MobileDestination;
  isAddDisabled?: boolean;
  onAdd: () => void;
  onNavigate: (destination: MobileDestination) => void;
  onSettings: () => void;
}

const destinations: Array<{
  id: MobileDestination;
  icon: string;
  label: string;
}> = [
  { id: "home", icon: "home", label: "Home" },
  { id: "activity", icon: "receipt_long", label: "Activity" },
  { id: "reports", icon: "bar_chart", label: "Reports" }
];

export default function MobileBottomNavigation({
  active,
  isAddDisabled = false,
  onAdd,
  onNavigate,
  onSettings
}: MobileBottomNavigationProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-surface-variant bg-surface-container-lowest px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(50,24,24,0.08)] md:hidden"
    >
      <DestinationButton
        active={active === destinations[0].id}
        icon={destinations[0].icon}
        label={destinations[0].label}
        onClick={() => onNavigate(destinations[0].id)}
      />
      <DestinationButton
        active={active === destinations[1].id}
        icon={destinations[1].icon}
        label={destinations[1].label}
        onClick={() => onNavigate(destinations[1].id)}
      />
      <button
        aria-label="Add transaction"
        className="motion-button mx-auto -mt-5 grid h-14 w-14 place-items-center rounded-full bg-primary text-on-primary shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isAddDisabled}
        type="button"
        onClick={onAdd}
      >
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          add
        </span>
      </button>
      <DestinationButton
        active={active === destinations[2].id}
        icon={destinations[2].icon}
        label={destinations[2].label}
        onClick={() => onNavigate(destinations[2].id)}
      />
      <DestinationButton active={false} icon="settings" label="Settings" onClick={onSettings} />
    </nav>
  );
}

function DestinationButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={`motion-button flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-bold transition ${
        active ? "text-primary" : "text-outline hover:text-on-surface"
      }`}
      type="button"
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[22px]"
        style={{ fontVariationSettings: active ? "'FILL' 1" : undefined }}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
