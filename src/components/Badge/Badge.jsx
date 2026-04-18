import styles from './Badge.module.css';

/**
 * Small coloured pill showing a percentage change.
 * Green for positive, red for negative, grey for zero.
 */
export default function Badge({ value }) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const cls = isPositive
    ? styles.up
    : isNegative
    ? styles.down
    : styles.neutral;

  const prefix = isPositive ? '+' : '';

  return (
    <span className={`${styles.badge} ${cls}`}>
      {prefix}{value.toFixed(2)}%
    </span>
  );
}
