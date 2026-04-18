import { useState, useEffect, useRef } from 'react';
import { APP_NAME } from '../../constants/app';
import { MOCK_STOCKS, POPULAR_SYMBOLS } from '../../data/mockStocks';
import { MOCK_NEWS } from '../../data/mockNews';
import { fetchOverview, fetchNews } from '../../services/stockAPI';
import { useApp } from '../../context/AppContext';
import StockCard  from '../../components/StockCard/StockCard';
import NewsCard   from '../../components/NewsCard/NewsCard';
import styles from './Landing.module.css';

const TABS = [
  { id: 'popular',   label: 'Popular'   },
  { id: 'watchlist', label: 'Watched'   },
  { id: 'gainers',   label: 'Gainers'   },
  { id: 'losers',    label: 'Losers'    },
];

export default function Landing() {
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useApp();

  const [activeTab, setActiveTab]           = useState('popular');
  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const [overviewCache, setOverviewCache]   = useState({});
  const [news, setNews]                     = useState(MOCK_NEWS.slice(0, 8));
  const tableRef = useRef(null);

  useEffect(() => {
    fetchNews().then(setNews);
  }, []);

  const breakingNews = news.filter((a) => a.isBreaking);
  const latestNews   = news;

  const displayedStocks = {
    popular:   POPULAR_SYMBOLS.map((sym) => MOCK_STOCKS.find((s) => s.symbol === sym)).filter(Boolean),
    watchlist: watchlist.map((w) => MOCK_STOCKS.find((s) => s.symbol === w.symbol)).filter(Boolean),
    gainers:   [...MOCK_STOCKS].sort((a, b) => b.changePercent - a.changePercent).slice(0, 8),
    losers:    [...MOCK_STOCKS].sort((a, b) => a.changePercent - b.changePercent).slice(0, 8),
  }[activeTab] ?? [];

  async function handleExpand(symbol) {
    setExpandedSymbol(symbol);
    if (symbol && !overviewCache[symbol]) {
      const data = await fetchOverview(symbol);
      setOverviewCache((prev) => ({ ...prev, [symbol]: data }));
    }
  }

  function handleTabChange(id) {
    setActiveTab(id);
    setExpandedSymbol(null);
  }

  useEffect(() => {
    function onMouseDown(e) {
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setExpandedSymbol(null);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className={styles.page}>

      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className={styles.masthead}>
        <time className={styles.date}>{today}</time>
        <div className={styles.mastheadTitle}>
          <h1 className={styles.title}>{APP_NAME}</h1>
          <p className={styles.tagline}>Markets · Community · Insight</p>
        </div>
      </header>

      {/* ── Ticker + editorial ───────────────────────────────────── */}
      <div className={styles.body}>

        {breakingNews.length > 0 && (
          <div className={styles.ticker}>
            <span className={`section-label ${styles.tickerLabel}`}>Breaking</span>
            <div className={styles.tickerItems}>
              {breakingNews.map((a) => (
                <a key={a.id} href={a.url} className={styles.tickerItem}>
                  {a.headline}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className={styles.editorialHeaders}>
          <div className={`section-label ${styles.marketsHead}`}>
            <span className="section-label">Markets</span>
            <div className={styles.tabStrip}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <h2 className={`section-label ${styles.newsHead}`}>Latest</h2>
        </div>

        <div className={styles.editorialContent}>
          <div className={styles.marketsBody} ref={tableRef}>
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
                {displayedStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyTab}>
                      {activeTab === 'watchlist'
                        ? 'No stocks in your watchlist yet.'
                        : 'No data available.'}
                    </td>
                  </tr>
                ) : (
                  displayedStocks.map((stock) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.newsContent}>
            {latestNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
