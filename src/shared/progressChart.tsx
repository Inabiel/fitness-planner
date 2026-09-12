import type { ProgressPoint } from './progress';

interface ChartDomain {
  min: number;
  max: number;
  range: number;
}

export function ProgressLineChart({
  points,
  ariaLabel,
}: {
  points: ProgressPoint[];
  ariaLabel: string;
}) {
  if (!points.length) return null;

  const domain = chartDomain(points.map((point) => point.value));
  const targetY = chartPoint(100, 0, points.length, domain).split(',')[1];
  const chartPoints = points.map((point, index) => chartPoint(point.value, index, points.length, domain));

  return (
    <div className="progress-chart-wrap">
      <div className="chart-stage">
        <svg
          className="progress-chart"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={ariaLabel}
        >
          <path className="chart-gridline" d="M8 24 H92 M8 55 H92 M8 86 H92" />
          <path className="progress-target-line" d={`M8 ${targetY} H92`} />
          <polyline className="progress-chart-line" pathLength="1" points={chartPoints.join(' ')} />
        </svg>
        <div className="chart-markers">
          {points.map((point, index) => {
            const [x, y] = chartPoints[index].split(',');

            return (
              <ChartMarker
                detail={`${point.value}% of planned dose`}
                key={point.id}
                label={point.label}
                x={Number(x)}
                y={Number(y)}
              />
            );
          })}
        </div>
      </div>
      <div className="chart-labels">
        <span>{points[0].label}</span>
        <strong>{points[points.length - 1].value}% target</strong>
        <span>{points[points.length - 1].label}</span>
      </div>
      <p className="chart-caption">100% means the planned reps or duration were completed.</p>
    </div>
  );
}

export function ChartMarker({
  x,
  y,
  label,
  detail,
}: {
  x: number;
  y: number;
  label: string;
  detail: string;
}) {
  const description = `${label}: ${detail}`;

  return (
    <span
      aria-label={description}
      className="chart-marker"
      role="img"
      style={{ left: `${x}%`, top: `${y}%` }}
      tabIndex={0}
      title={description}
    >
      <span aria-hidden="true" className="chart-tooltip">
        <span>{label}</span>
        <strong>{detail}</strong>
      </span>
    </span>
  );
}

function chartDomain(values: number[]): ChartDomain {
  const min = Math.max(0, Math.min(100, Math.floor((Math.min(...values) - 10) / 10) * 10));
  const max = Math.max(100, Math.ceil((Math.max(...values) + 10) / 10) * 10);
  return { min, max, range: Math.max(10, max - min) };
}

function chartPoint(value: number, index: number, count: number, domain: ChartDomain): string {
  const x = count === 1 ? 50 : 8 + (index / (count - 1)) * 84;
  const y = 86 - ((value - domain.min) / domain.range) * 62;
  return `${x},${Math.max(8, Math.min(92, y))}`;
}
