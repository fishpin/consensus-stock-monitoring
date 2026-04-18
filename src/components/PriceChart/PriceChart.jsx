import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { CHART_PERIODS } from '../../constants/app';
import styles from './PriceChart.module.css';

/** Filter history array to the selected time period */
function filterHistory(history, period) {
  const now = new Date();
  const days = CHART_PERIODS.find((p) => p.value === period)?.days ?? 30;
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  return history.filter((h) => new Date(h.date) >= cutoff);
}

export default function PriceChart({ history, currentPrice }) {
  const [activePeriod, setActivePeriod] = useState('1M');

  const data = filterHistory(history, activePeriod);
  const firstPrice = data[0]?.price ?? currentPrice;
  const isPositive = currentPrice >= firstPrice;

  const chartColor = isPositive
    ? 'var(--color-up)'
    : 'var(--color-down)';

  return (
    <div className={styles.wrapper}>
      <div className={styles.periodBar}>
        {CHART_PERIODS.map(({ label, value }) => (
          <button
            key={value}
            className={`${styles.periodBtn} ${activePeriod === value ? styles.periodActive : ''}`}
            onClick={() => setActivePeriod(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={chartColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickFormatter={(d) => {
              const date = new Date(d);
              return activePeriod === '1D'
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            width={56}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: 'var(--color-text)',
            }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 4, fill: chartColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
