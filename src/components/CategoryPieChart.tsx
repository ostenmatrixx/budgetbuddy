import { useUserSettings } from "../contexts/UserSettingsContext";
import { type CategoryPieSegment } from "../lib/budget";

interface CategoryPieChartProps {
  segments: CategoryPieSegment[];
}

const segmentColors = [
  "#af101a",
  "#9e4039",
  "#fb877d",
  "#455b65",
  "#ffb3ac",
  "#7c1d2a",
  "#d35d75",
  "#875d5a"
];

export default function CategoryPieChart({ segments }: CategoryPieChartProps) {
  const { formatCurrency } = useUserSettings();
  const sortedSegments = [...segments].sort(
    (first, second) => second.value - first.value || first.label.localeCompare(second.label)
  );
  const total = sortedSegments.reduce((sum, segment) => sum + segment.value, 0);
  const topSegment = sortedSegments.find((segment) => segment.value > 0);
  const ringSegments = buildRingSegments(sortedSegments);

  return (
    <div className="animate-card-in mt-5 grid min-w-0 gap-5 rounded-xl border border-surface-variant bg-surface-container-lowest p-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
      <div className="flex justify-center">
        <div
          aria-label={total > 0 ? "Category donut chart" : "No category entries yet"}
          className="chart-container relative grid h-40 w-40 place-items-center rounded-full"
          role="img"
        >
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" fill="transparent" r="15.5" stroke="#eeeef0" strokeWidth="3" />
            {ringSegments.map((segment) => (
              <circle
                cx="18"
                cy="18"
                fill="transparent"
                key={segment.label}
                r="15.5"
                stroke={segment.color}
                strokeDasharray={`${getVisibleSlicePercentage(segment.percentage, ringSegments.length)} 100`}
                strokeDashoffset={segment.offset}
                strokeLinecap="butt"
                className="animate-fade-in"
                strokeWidth="3"
              />
            ))}
          </svg>
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-surface-container-lowest text-center shadow-[inset_0_0_0_1px_rgba(226,226,228,0.7)]">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              {total > 0 ? "Top" : "Empty"}
            </span>
            <span className="mt-1 max-w-[5.5rem] truncate text-base font-bold text-on-surface">
              {topSegment?.label ?? "No entries"}
            </span>
          </div>
        </div>
      </div>

      <div
        aria-label={sortedSegments.length > 0 ? "Category totals" : undefined}
        className="grid min-w-0 gap-3"
        role={sortedSegments.length > 0 ? "list" : undefined}
      >
        {sortedSegments.length === 0 ? (
          <p className="rounded-lg bg-surface-container-low px-3 py-3 text-sm font-medium text-on-surface-variant">
            No category entries yet.
          </p>
        ) : null}
        {sortedSegments.map((segment, index) => (
          <div
            className={`animate-slide-up stagger-${(index % 6) + 1} grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm`}
            key={segment.label}
            role="listitem"
          >
            <span className="flex min-w-0 items-start gap-2 text-on-surface-variant">
              <span
                className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: segmentColors[index % segmentColors.length] }}
              />
              <span className="min-w-0 break-words font-semibold [overflow-wrap:anywhere]">
                {segment.label}
              </span>
            </span>
            <span className="min-w-0 text-right tabular-nums">
              <strong className="block text-sm text-on-surface">{segment.percentage}%</strong>
              <span className="block break-all text-xs font-semibold text-outline">
                {formatCurrency(segment.value)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildRingSegments(segments: CategoryPieSegment[]) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) {
    return [];
  }

  let cursor = 0;
  return segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => segment.value > 0)
    .map(({ segment, index }) => {
      const percentage = (segment.value / total) * 100;
      const offset = -cursor;
      cursor += percentage;
      const color = segmentColors[index % segmentColors.length];

      return {
        color,
        label: segment.label,
        offset,
        percentage
      };
    });
}

function getVisibleSlicePercentage(percentage: number, segmentCount: number) {
  if (segmentCount <= 1) {
    return percentage;
  }

  const gap = Math.min(0.45, percentage / 4);
  return Math.max(percentage - gap, 0);
}
