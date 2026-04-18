import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getStockBySymbol } from '../../data/mockStocks';
import { fetchOverview } from '../../services/stockAPI';
import StockCard from '../../components/StockCard/StockCard';
import styles from './Watchlist.module.css';

export default function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useApp();
  const navigate = useNavigate();

  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const [overviewCache,  setOverviewCache]  = useState({});

  const stocks = watchlist
    .map((w) => getStockBySymbol(w.symbol))
    .filter(Boolean);

  async function handleExpand(symbol) {
    setExpandedSymbol(symbol);
    if (symbol && !overviewCache[symbol]) {
      const data = await fetchOverview(symbol);
      setOverviewCache((prev) => ({ ...prev, [symbol]: data }));
    }
  }

  if (watchlist.length === 0) {
    return (
      <div className="empty-state">
        <Star size={48} className={styles.emptyIcon} />
        <h2 className="empty-state__title">Your watchlist is empty</h2>
        <p className="empty-state__text">
          Search for a stock and click "Watch" to track it here.
        </p>
        <button className="btn-lg" onClick={() => navigate('/')}>Browse stocks</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Watchlist</h1>
        <span className="page-subtitle">{watchlist.length} stock{watchlist.length !== 1 ? 's' : ''}</span>
      </div>

      <div className={`table-wrapper ${styles.tableWrapper}`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>30d</th>
              <th className="col-right">Price</th>
              <th className="col-right">Change</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                expanded={expandedSymbol === stock.symbol}
                onExpand={handleExpand}
                overview={overviewCache[stock.symbol] ?? null}
                isWatched={isInWatchlist(stock.symbol)}
                onWatchToggle={() => {
                  if (isInWatchlist(stock.symbol)) {
                    removeFromWatchlist(stock.symbol);
                  } else {
                    addToWatchlist({ symbol: stock.symbol, name: stock.name, price: stock.price, change: stock.change, changePercent: stock.changePercent });
                  }
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
