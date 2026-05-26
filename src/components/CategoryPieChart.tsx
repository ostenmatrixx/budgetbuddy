import { formatCurrency, type CategoryPieSegment } from "../lib/budget";

interface CategoryPieChartProps {
  segments: CategoryPieSegment[];
}

const segmentColors = ["#A64242", "#F3A6A6", "#321818", "#F6D5D5"];

export default function CategoryPieChart({ segments }: CategoryPieChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const gradient = buildGradient(segments);

  return (
    <div className="mt-4 grid gap-4 rounded-lg bg-light-red/5 p-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center">
      <div className="flex justify-center">
        <div
          aria-label={total > 0 ? "Category pie chart" : "No category entries yet"}
          className="grid h-24 w-24 place-items-center rounded-full border border-ecru"
          role="img"
          style={{
            background: total > 0 ? gradient : "#fff7f7"
          }}
        >
          <div className="h-14 w-14 rounded-full bg-white shadow-inner" />
        </div>
      </div>

      <div className="grid gap-2">
        {segments.map((segment, index) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs"
            key={segment.label}
          >
            <span className="flex min-w-0 items-center gap-2 text-black-bean/70">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segmentColors[index % segmentColors.length] }}
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <strong className="text-right text-black-bean">
              {segment.percentage}% - {formatCurrency(segment.value)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildGradient(segments: CategoryPieSegment[]): string {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) {
    return "#fff7f7";
  }

  let cursor = 0;
  const stops = segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => segment.value > 0)
    .map(({ segment, index }) => {
      const start = cursor;
      const size = (segment.value / total) * 100;
      cursor += size;
      const color = segmentColors[index % segmentColors.length];

      return `${color} ${start}% ${cursor}%`;
    });

  return `conic-gradient(${stops.join(", ")})`;
}
