export type ThemeMode = "light" | "dark";

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
  compact?: boolean;
  className?: string;
}

export default function ThemeToggle({
  className = "",
  compact = false,
  onToggle,
  theme
}: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`motion-button motion-icon-button inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-surface-variant bg-surface-container-lowest px-3 text-sm font-semibold text-on-surface-variant transition hover:border-outline hover:bg-surface-container-high hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
      onClick={onToggle}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
      {compact ? null : <span className="hidden lg:inline">{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
