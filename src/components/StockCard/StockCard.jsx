import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Star } from 'lucide-react';
import { stockPath } from '../../constants/routes';
import Sparkline from '../Sparkline/Sparkline';
import styles from './StockCard.module.css';

export default function StockCard({ stock, expanded, onExpand, overview, isWatched, onWatchToggle }) {
  const navigate   = useNavigate();
  const isPositive = stock.change >= 0;

  function handleClick(e) {
    e.stopPropagation();
    onExpand(expanded ? null : stock.symbol);
  }

  // Fragment is required — a component can't return sibling <tr> elements any other way
  return (
    <Fragment>
      <tr
        className={`${styles.row} ${expanded ? styles.rowExpanded : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
        aria-expanded={expanded}
        aria-label={`${stock.name} — click to ${expanded ? 'collapse' : 'expand'}`}
      >
        <td className={styles.symbol}>{stock.symbol}</td>
        <td className={styles.name}>{stock.name}</td>
        <td className={styles.spark}>
          <Sparkline data={stock.history.slice(-30)} positive={isPositive} />
        </td>
        <td className={styles.price}>${stock.price.toFixed(2)}</td>
        <td className={isPositive ? styles.changeUp : styles.changeDown}>
          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </td>
        <td className={styles.watchCell}>
          <button
            className={`btn-icon ${styles.watchBtn} ${isWatched ? styles.watchBtnActive : ''}`}
            onClick={(e) => { e.stopPropagation(); onWatchToggle(); }}
            aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Star size={13} fill={isWatched ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className={styles.detailRow}>
          <td colSpan={5} className={styles.detailCell}>
            {overview ? (
              <div className={styles.detailStats}>
                {overview.marketCap     && <Stat label="Mkt Cap"  value={overview.marketCap} />}
                {overview.peRatio       && <Stat label="P/E"       value={overview.peRatio.toFixed(1)} />}
                {overview.eps           && <Stat label="EPS"       value={`$${overview.eps.toFixed(2)}`} />}
                {overview.beta          && <Stat label="Beta"      value={overview.beta.toFixed(2)} />}
                {overview.high52w       && <Stat label="52w High"  value={`$${overview.high52w.toFixed(2)}`} />}
                {overview.low52w        && <Stat label="52w Low"   value={`$${overview.low52w.toFixed(2)}`} />}
                {overview.analystTarget && <Stat label="Target"    value={`$${overview.analystTarget.toFixed(2)}`} />}
                {overview.dividendYield && <Stat label="Yield"     value={overview.dividendYield} />}
              </div>
            ) : (
              <p className={styles.detailLoading}>Loading…</p>
            )}
          </td>
          <td className={`${styles.detailCell} ${styles.watchCell}`}>
            {overview && (
              <button
                className={`btn-icon ${styles.watchBtn}`}
                onClick={(e) => { e.stopPropagation(); navigate(stockPath(stock.symbol)); }}
                aria-label="Full details"
              >
                <ExternalLink size={13} />
              </button>
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
