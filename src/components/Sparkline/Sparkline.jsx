/**
 * Tufte-style sparkline — a miniature line chart with no axes, no labels,
 * no grid. The shape of the data is the entire message.
 */
export default function Sparkline({ data, width = 80, height = 28, positive }) {
  if (!data || data.length < 2) return null;

  const prices = data.map((d) => d.price);
  const min    = Math.min(...prices);
  const max    = Math.max(...prices);
  const range  = max - min || 1;

  const xStep = width / (prices.length - 1);

  const points = prices.map((price, i) => {
    const x = i * xStep;
    const y = height - ((price - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  const color = positive === false
    ? 'var(--color-down)'
    : positive === true
    ? 'var(--color-up)'
    : 'var(--color-text-muted)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* End-point dot */}
      <circle
        cx={parseFloat(points[points.length - 1].split(',')[0])}
        cy={parseFloat(points[points.length - 1].split(',')[1])}
        r="2"
        fill={color}
      />
    </svg>
  );
}
