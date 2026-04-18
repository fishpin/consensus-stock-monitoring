import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MessageCircle, ArrowLeft } from 'lucide-react';
import { getStockBySymbol } from '../../data/mockStocks';
import { getNewsBySymbol } from '../../data/mockNews';
import { fetchNews } from '../../services/stockAPI';
import { getSentimentBySymbol } from '../../data/mockSentiment';
import { getAnalystBySymbol } from '../../data/mockAnalyst';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../constants/routes';
import { BID_MULTIPLIER, ASK_MULTIPLIER, NOTIFICATION_TIMEOUT_MS, MIN_TRADE_QTY, WIDE_SPREAD_THRESHOLD_PCT } from '../../constants/trading';
import { getConsensusLabel } from '../../constants/analyst';
import { MOCK_CASH } from '../../data/mockAccount';
import { formatCurrency } from '../../utils/formatters';
import PriceChart from '../../components/PriceChart/PriceChart';
import Badge      from '../../components/Badge/Badge';
import StockChat  from '../../components/StockChat/StockChat';
import styles from './StockDetail.module.css';

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate   = useNavigate();
  const {
    addToWatchlist, removeFromWatchlist, isInWatchlist,
    addToPortfolio, removeFromPortfolio, updatePortfolioQty, isInPortfolio, portfolio,
  } = useApp();

  const stock     = getStockBySymbol(symbol);
  const sentiment = getSentimentBySymbol(symbol);
  const analyst   = getAnalystBySymbol(symbol);

  const [news, setNews] = useState(() => getNewsBySymbol(symbol));

  useEffect(() => {
    fetchNews(symbol).then(setNews);
  }, [symbol]);

  const chatRef = useRef(null);

  // Two-screen flow: 'entry' shows the order form, 'confirm' shows the review summary
  const [tradeScreen, setTradeScreen] = useState('entry');
  const [tradeMode,   setTradeMode]   = useState('buy');
  const [orderType,   setOrderType]   = useState('market');
  const [quantity,    setQuantity]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [notification, setNotification] = useState('');

  function notify(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(''), NOTIFICATION_TIMEOUT_MS);
  }

  if (!stock) {
    return (
      <div className={styles.notFound}>
        <p>Stock <strong>{symbol}</strong> not found.</p>
        <button className={styles.backBtn} onClick={() => navigate(ROUTES.HOME)}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(stock.symbol);
  const inPortfolio = isInPortfolio(stock.symbol);
  const holding     = portfolio.find((h) => h.symbol === stock.symbol);

  function handleWatchlist() {
    if (inWatchlist) {
      removeFromWatchlist(stock.symbol);
      notify('Removed from watchlist');
    } else {
      addToWatchlist({ symbol: stock.symbol, name: stock.name, price: stock.price, change: stock.change, changePercent: stock.changePercent });
      notify('Added to watchlist');
    }
  }

  const bid        = stock.price * BID_MULTIPLIER;
  const ask        = stock.price * ASK_MULTIPLIER;
  const spreadPct  = ((ask - bid) / ask) * 100;

  const qty            = parseInt(quantity, 10) || 0;
  const estPrice       = tradeMode === 'buy' ? ask : bid;
  const estTotal       = qty * estPrice;
  const holdingValue   = holding ? holding.price * holding.quantity : 0;
  const holdingGain    = holding ? (holding.price - holding.buyPrice) * holding.quantity : 0;
  const holdingGainPct = holding ? ((holding.price - holding.buyPrice) / holding.buyPrice) * 100 : 0;

  const canReview = qty >= MIN_TRADE_QTY
    && (tradeMode === 'buy' ? estTotal <= MOCK_CASH : qty <= (holding?.quantity ?? 0));

  function handleReview(e) {
    e.preventDefault();
    if (!canReview) return;
    setTradeScreen('confirm');
  }

  function handleBack() {
    setTradeScreen('entry');
    setSubmitting(false);
  }

  function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);

    if (tradeMode === 'buy') {
      addToPortfolio({ symbol: stock.symbol, name: stock.name, price: stock.price, changePercent: stock.changePercent, quantity: qty, buyPrice: ask });
      notify(`Bought ${qty} share${qty !== 1 ? 's' : ''} of ${stock.symbol}`);
    } else {
      if (qty >= holding.quantity) {
        removeFromPortfolio(stock.symbol);
      } else {
        updatePortfolioQty(stock.symbol, holding.quantity - qty);
      }
      notify(`Sold ${qty} share${qty !== 1 ? 's' : ''} of ${stock.symbol}`);
    }

    setTradeScreen('entry');
    setQuantity('');
    setSubmitting(false);
  }

  return (
    <div className={styles.page}>

      {notification && <div className={styles.notification}>{notification}</div>}

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className={styles.titleRow}>
          <div className={styles.titleChartCol}>
            <div>
              <h1 className={styles.symbol}>{stock.symbol}</h1>
              <p className={styles.name}>{stock.name}</p>
            </div>
            <div className={styles.priceBlock}>
              <span className={styles.price}>${stock.price.toFixed(2)}</span>
              <Badge value={stock.changePercent} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Editorial body ──────────────────────────────────────── */}
      <div className={styles.body}>

        <div className={styles.editorialHeaders}>
          <div className={`section-label ${styles.sectionHead}`}>
            <span>Price History</span>
            <div className={styles.sectionHeadIcons}>
              <button
                className={`${styles.actionIcon} ${inWatchlist ? styles.actionIconActive : ''}`}
                onClick={handleWatchlist}
                aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <span className={styles.actionLabel}>{inWatchlist ? 'Watching' : 'Watch'}</span>
                <Star size={14} fill={inWatchlist ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
              <button
                className={styles.actionIcon}
                onClick={() => chatRef.current?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Jump to discussion"
              >
                <span className={styles.actionLabel}>Chat</span>
                <MessageCircle size={14} />
              </button>
            </div>
          </div>
          <div className={`section-label ${styles.sectionHeadAside}`}>
            {tradeScreen === 'confirm' ? 'Review order' : 'Trade'}
          </div>
        </div>

        <div className={styles.editorialContent}>

          {/* ── Main column: chart + stats + description ──────── */}
          <div className={styles.mainCol}>
            <div className={styles.chartArea}>
              <PriceChart history={stock.history} currentPrice={stock.price} />
            </div>
            <hr className={styles.divider} />
            <dl className={styles.stats}>
              <div className={styles.stat}><dt>Market Cap</dt><dd>{stock.marketCap}</dd></div>
              <div className={styles.stat}><dt>Volume</dt><dd>{stock.volume}</dd></div>
              <div className={styles.stat}><dt>P/E</dt><dd>{stock.peRatio}</dd></div>
              <div className={styles.stat}><dt>52w High</dt><dd>${stock.high52w.toFixed(2)}</dd></div>
              <div className={styles.stat}><dt>52w Low</dt><dd>${stock.low52w.toFixed(2)}</dd></div>
              <div className={styles.stat}><dt>Sector</dt><dd>{stock.sector}</dd></div>
            </dl>
            <p className={styles.description}>{stock.description}</p>

            {(sentiment || analyst) && (() => {
              const total     = analyst ? analyst.strongBuy + analyst.buy + analyst.hold + analyst.sell + analyst.strongSell : 0;
              const buyPct    = analyst ? Math.round((analyst.strongBuy + analyst.buy) / total * 100) : 0;
              const holdPct   = analyst ? Math.round(analyst.hold / total * 100) : 0;
              const sellPct   = analyst ? 100 - buyPct - holdPct : 0;
              const consensus = getConsensusLabel(buyPct, sellPct);
              const upside    = analyst?.targetPrice ? ((analyst.targetPrice - stock.price) / stock.price * 100) : null;

              return (
                <div className={styles.insightRow}>
                  {sentiment && (
                    <div className={styles.insightSection}>
                      <p className="section-label">News Sentiment</p>
                      <div className={styles.sentimentBar}>
                        <div className={styles.sentimentBull}    style={{ width: `${sentiment.bullishPct}%` }} />
                        <div className={styles.sentimentNeutral} style={{ width: `${sentiment.neutralPct}%` }} />
                        <div className={styles.sentimentBear}    style={{ width: `${sentiment.bearishPct}%` }} />
                      </div>
                      <div className={styles.insightStats}>
                        <span className={'up'}>{sentiment.bullishPct}% bullish</span>
                        <span className={styles.insightMuted}>{sentiment.neutralPct}% neutral</span>
                        <span className={'down'}>{sentiment.bearishPct}% bearish</span>
                      </div>
                      <p className={styles.insightCaption}>{sentiment.label} · {sentiment.articleCount} articles</p>
                    </div>
                  )}

                  {analyst && (
                    <div className={styles.insightSection}>
                      <p className="section-label">Analyst Consensus</p>
                      <div className={styles.sentimentBar}>
                        <div className={styles.sentimentBull}    style={{ width: `${buyPct}%` }} />
                        <div className={styles.sentimentNeutral} style={{ width: `${holdPct}%` }} />
                        <div className={styles.sentimentBear}    style={{ width: `${sellPct}%` }} />
                      </div>
                      <div className={styles.insightStats}>
                        <span className={'up'}>{buyPct}% buy</span>
                        <span className={styles.insightMuted}>{holdPct}% hold</span>
                        <span className={'down'}>{sellPct}% sell</span>
                      </div>
                      <p className={styles.insightCaption}>
                        {consensus} · {total} analysts
                        {upside !== null && (
                          <> · target {formatCurrency(analyst.targetPrice)}{' '}
                            <span className={upside >= 0 ? 'up' : 'down'}>
                              ({upside >= 0 ? '+' : ''}{upside.toFixed(1)}%)
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── Aside: trade + news ───────────────────────────── */}
          <div className={styles.asideCol}>

            {/* ── Trade ──────────────────────────────────────── */}
            <div className={styles.tradeSection}>

              {tradeScreen === 'entry' ? (

                <>
                  <div className={styles.bidAsk}>
                    <div className={styles.bidAskCol}>
                      <span className={styles.bidAskLabel}>Bid</span>
                      <span className={styles.bidAskValue}>{formatCurrency(bid)}</span>
                    </div>
                    <div className={styles.bidAskCol}>
                      <span className={styles.bidAskLabel}>Ask</span>
                      <span className={styles.bidAskValue}>{formatCurrency(ask)}</span>
                    </div>
                  </div>

                  {spreadPct > WIDE_SPREAD_THRESHOLD_PCT && (
                    <p className={styles.cautionNote}>
                      Wide spread — consider a limit order for better price control.
                    </p>
                  )}

                  {inPortfolio && holding && (
                    <p className={styles.positionRow}>
                      {holding.quantity} sh&ensp;·&ensp;{formatCurrency(holdingValue)}&ensp;·&ensp;
                      <span className={holdingGain >= 0 ? 'up' : 'down'}>
                        {holdingGain >= 0 ? '+' : ''}{holdingGainPct.toFixed(2)}%
                      </span>
                    </p>
                  )}

                  <div className={styles.segmented}>
                    <button
                      className={`${styles.segBtn} ${tradeMode === 'buy' ? styles.segBuyActive : ''}`}
                      onClick={() => { setTradeMode('buy'); setQuantity(''); }}
                    >Buy</button>
                    <button
                      className={`${styles.segBtn} ${tradeMode === 'sell' ? styles.segSellActive : ''}`}
                      onClick={() => { if (inPortfolio) { setTradeMode('sell'); setQuantity(''); } }}
                      disabled={!inPortfolio}
                    >Sell</button>
                  </div>

                  <form className={styles.orderForm} onSubmit={handleReview}>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Order type</label>
                      <select
                        className={styles.formSelect}
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                      >
                        <option value="market">Market</option>
                        <option value="limit" disabled>Limit (coming soon)</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.formLabel} htmlFor="qty-input">
                        Shares
                        {tradeMode === 'sell' && holding && (
                          <span className={styles.formHint}>&ensp;of {holding.quantity} held</span>
                        )}
                      </label>
                      <input
                        id="qty-input"
                        type="number"
                        min={MIN_TRADE_QTY}
                        step="1"
                        max={tradeMode === 'sell' ? holding?.quantity : undefined}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={styles.formInput}
                        placeholder="0"
                        autoComplete="off"
                      />
                    </div>

                    <div className={styles.estimatedCost}>
                      <div className={styles.estRow}>
                        <span className={styles.estLabel}>
                          Est. {tradeMode === 'buy' ? 'cost' : 'proceeds'}
                        </span>
                        <span className={styles.estTotal}>{qty > 0 ? formatCurrency(estTotal) : '—'}</span>
                      </div>
                      {tradeMode === 'buy' && (
                        <div className={styles.estRow}>
                          <span className={styles.estLabel}>Buying power</span>
                          <span className={`${styles.estValue} ${qty > 0 && estTotal > MOCK_CASH ? styles.dangerText : ''}`}>
                            {formatCurrency(MOCK_CASH)}
                          </span>
                        </div>
                      )}
                      <p className={styles.estCaption}>
                        Based on current {tradeMode === 'buy' ? 'ask' : 'bid'} × {qty} share{qty !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <button type="submit" className={styles.reviewBtn} disabled={!canReview}>
                      Review order
                    </button>
                  </form>
                </>

              ) : (

                <>
                  <p className={styles.confirmSubtitle}>Please confirm the details before submitting.</p>

                  <dl className={styles.summaryRows}>
                    <div className={styles.summaryRow}>
                      <dt>Action</dt>
                      <dd className={tradeMode === 'buy' ? styles.successText : styles.dangerText}>
                        {tradeMode === 'buy' ? 'Buy' : 'Sell'}
                      </dd>
                    </div>
                    <div className={styles.summaryRow}>
                      <dt>Stock</dt>
                      <dd>{stock.symbol}</dd>
                    </div>
                    <div className={styles.summaryRow}>
                      <dt>Order type</dt>
                      <dd>Market</dd>
                    </div>
                    <div className={styles.summaryRow}>
                      <dt>Shares</dt>
                      <dd>{qty}</dd>
                    </div>
                    <div className={styles.summaryRow}>
                      <dt>Est. price</dt>
                      <dd>{formatCurrency(estPrice)}</dd>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.summaryRowFinal}`}>
                      <dt>Est. total</dt>
                      <dd>{formatCurrency(estTotal)}</dd>
                    </div>
                  </dl>

                  <p className={styles.warningNote}>
                    Market orders fill at the best available price and may differ from the estimate.
                  </p>

                  <div className={styles.confirmActions}>
                    <button type="button" className={styles.confirmBack} onClick={handleBack}>
                      Back
                    </button>
                    <button
                      type="button"
                      className={styles.confirmSubmit}
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting…' : 'Submit order'}
                    </button>
                  </div>
                </>

              )}
            </div>

            {/* ── News ────────────────────────────────────────── */}
            <div className={styles.newsSection}>
              <p className={`section-label ${styles.newsSectionHead}`}>Related News</p>
              {news.map((article) => {
                const published = new Date(article.publishedAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                });
                return (
                  <a key={article.id} href={article.url} className={styles.newsItem} target="_blank" rel="noreferrer">
                    <div className={styles.newsMeta}>
                      {article.isBreaking && <span className={styles.newsBreaking}>Breaking</span>}
                      <span className={styles.newsSource}>{article.source}</span>
                      <span className={styles.newsDot}>·</span>
                      <time className={styles.newsTime}>{published}</time>
                    </div>
                    <p className={styles.newsHeadline}>{article.headline}</p>
                    <p className={styles.newsSummary}>{article.summary}</p>
                  </a>
                );
              })}
            </div>

          </div>

        </div>
      </div>{/* end .body */}

      <section ref={chatRef} className={styles.discussionSection}>
        <p className="section-label">Discussion</p>
        <StockChat symbol={stock.symbol} />
      </section>

    </div>
  );
}
