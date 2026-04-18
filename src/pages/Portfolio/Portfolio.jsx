import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { stockPath } from '../../constants/routes';
import { CHART_PERIODS, PORTFOLIO_COLORS } from '../../constants/app';
import { ASK_MULTIPLIER, BID_MULTIPLIER } from '../../constants/trading';
import { getStockBySymbol } from '../../data/mockStocks';
import { formatCurrency } from '../../utils/formatters';
import Badge from '../../components/Badge/Badge';
import styles from './Portfolio.module.css';

const PERIODS = CHART_PERIODS.filter((p) => p.value !== '1D');

// Reconstructs total portfolio value day-by-day by summing each holding's price × quantity
function buildPortfolioHistory(portfolio, days) {
  if (portfolio.length === 0) return [];

  const enriched = portfolio.map((h) => ({
    quantity: h.quantity,
    history:  getStockBySymbol(h.symbol)?.history ?? [],
  }));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const dates = enriched[0].history
    .map((d) => d.date)
    .filter((d) => new Date(d) >= cutoff);

  return dates.map((date) => ({
    date,
    value: enriched.reduce((sum, stock) => {
      const point = stock.history.find((h) => h.date === date);
      return sum + (point ? point.price * stock.quantity : 0);
    }, 0),
  }));
}

export default function Portfolio() {
  const { portfolio, addToPortfolio, removeFromPortfolio, updatePortfolioQty } = useApp();
  const navigate = useNavigate();

  const [period,        setPeriod]        = useState('1M');
  const [sellingSymbol, setSellingSymbol] = useState(null);
  const [sellQty,       setSellQty]       = useState('');
  const [buyingSymbol,  setBuyingSymbol]  = useState(null);
  const [buyQty,        setBuyQty]        = useState('');
  const [hoveredIdx,    setHoveredIdx]    = useState(null);

  const totalValue   = portfolio.reduce((sum, h) => sum + h.price * h.quantity, 0);
  const totalCost    = portfolio.reduce((sum, h) => sum + h.buyPrice * h.quantity, 0);
  const totalGain    = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const periodDays = PERIODS.find((p) => p.value === period)?.days ?? 30;
  const chartData  = buildPortfolioHistory(portfolio, periodDays);
  const chartStart = chartData[0]?.value ?? totalValue;
  const chartUp    = totalValue >= chartStart;
  const chartColor = chartUp ? 'var(--color-up)' : 'var(--color-down)';

  const allocationData = portfolio.map((h, i) => ({
    value: h.price * h.quantity,
    fill:  PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length],
  }));

  function handleSellConfirm(holding) {
    const qty = parseInt(sellQty, 10);
    if (!qty || qty < 1) return;
    if (qty >= holding.quantity) {
      removeFromPortfolio(holding.symbol);
    } else {
      updatePortfolioQty(holding.symbol, holding.quantity - qty);
    }
    setSellingSymbol(null);
    setSellQty('');
  }

  function handleBuyConfirm(holding) {
    const qty = parseInt(buyQty, 10);
    if (!qty || qty < 1) return;
    const ask = holding.price * ASK_MULTIPLIER;
    addToPortfolio({ symbol: holding.symbol, name: holding.name, price: holding.price, changePercent: holding.changePercent, quantity: qty, buyPrice: ask });
    setBuyingSymbol(null);
    setBuyQty('');
  }

  if (portfolio.length === 0) {
    return (
      <div className="empty-state">
        <TrendingUp size={48} className="empty-state__icon" />
        <h2 className="empty-state__title">Your portfolio is empty</h2>
        <p className="empty-state__text">
          Open a stock's detail page and add shares to start tracking your holdings.
        </p>
        <button className="btn-lg" onClick={() => navigate('/')}>Browse stocks</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Page title ──────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Portfolio</h1>
        <span className="page-subtitle">
          {portfolio.length} holding{portfolio.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Top row: value chart + allocation wheel ───────────────────── */}
      <div className={styles.topRow}>

        {/* Column headers */}
        <p className={`section-label ${styles.topLabel}`}>Portfolio Value</p>
        <p className={`section-label ${styles.topLabel}`}>Allocation</p>

        {/* Portfolio Value */}
        <div className={styles.valueSection}>
          <div className={styles.valueRow}>
            <span className={styles.totalValue}>{formatCurrency(totalValue)}</span>
            <Badge value={totalGainPct} />
          </div>
          <p className={styles.valueSubtitle}>
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} all time
          </p>

          <div className={styles.chartArea}>
            <div className={styles.periodBar}>
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  className={`${styles.periodBtn} ${period === p.value ? styles.periodActive : ''}`}
                  onClick={() => setPeriod(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border:          '1px solid var(--color-border)',
                    borderRadius:    'var(--radius-sm)',
                    fontSize:        13,
                    color:           'var(--color-text)',
                  }}
                  formatter={(v) => [formatCurrency(v), 'Value']}
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation wheel */}
        <div className={styles.profitsSection}>
          <div className={styles.wheelWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="80%"
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={90 + 360}
                  isAnimationActive={false}
                  stroke="none"
                >
                  {allocationData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.fill}
                      opacity={hoveredIdx !== null && hoveredIdx !== i ? 0.35 : 1}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.wheelCenter}>
              <span className={styles.wheelAmount}>{portfolio.length}</span>
              <span className={styles.wheelCaption}>positions</span>
            </div>
          </div>
          <div className={styles.distLegend}>
            {portfolio.map((h, i) => {
              const pct = (h.price * h.quantity / totalValue) * 100;
              return (
                <div
                  key={h.symbol}
                  className={styles.distItem}
                  style={{ opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.35 : 1 }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <span className={styles.distDot} style={{ backgroundColor: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length] }} />
                  <span className={styles.distSymbol}>{h.symbol}</span>
                  <span className={styles.distPct}>{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Holdings table ───────────────────────────────────────────── */}
      <div className={styles.assetsSection}>
        <p className="section-label">All Assets</p>
        <div className={`table-wrapper ${styles.tableWrapper}`}>
          <table className={`data-table ${styles.table}`}>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th className="col-right">Qty</th>
                <th className="col-right">Avg Cost</th>
                <th className="col-right">Price</th>
                <th className="col-right">Value</th>
                <th className="col-right">Gain / Loss</th>
                <th className="col-right">Change</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {portfolio.map((holding) => {
                const value       = holding.price * holding.quantity;
                const gainLoss    = (holding.price - holding.buyPrice) * holding.quantity;
                const glPct       = ((holding.price - holding.buyPrice) / holding.buyPrice) * 100;
                const isSelling   = sellingSymbol === holding.symbol;
                const isBuying    = buyingSymbol  === holding.symbol;
                const sellQtyNum  = parseInt(sellQty, 10) || 0;
                const buyQtyNum   = parseInt(buyQty,  10) || 0;
                const ask         = holding.price * ASK_MULTIPLIER;
                const estProceeds = sellQtyNum * holding.price;
                const estCost     = buyQtyNum  * ask;
                const canConfirm  = sellQtyNum >= 1 && sellQtyNum <= holding.quantity;
                const canBuy      = buyQtyNum  >= 1;

                return (
                  <Fragment key={holding.symbol}>
                    <tr
                      className={`table-row ${isSelling ? styles.rowSelling : ''}`}
                      onClick={() => !isSelling && navigate(stockPath(holding.symbol))}
                    >
                      <td className={styles.symbol}>{holding.symbol}</td>
                      <td className={styles.name}>{holding.name}</td>
                      <td className="col-right">{holding.quantity}</td>
                      <td className="col-right">${holding.buyPrice.toFixed(2)}</td>
                      <td className={`col-right ${styles.price}`}>${holding.price.toFixed(2)}</td>
                      <td className={`col-right ${styles.price}`}>{formatCurrency(value)}</td>
                      <td className={`col-right ${gainLoss >= 0 ? 'up' : 'down'}`}>
                        {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                        <span className={styles.glPct}> ({glPct >= 0 ? '+' : ''}{glPct.toFixed(1)}%)</span>
                      </td>
                      <td className="col-right">
                        <Badge value={holding.changePercent} />
                      </td>
                      <td className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        {isSelling || isBuying ? (
                          <button
                            className={styles.cancelBtn}
                            onClick={() => { setSellingSymbol(null); setSellQty(''); setBuyingSymbol(null); setBuyQty(''); }}
                          >
                            Cancel
                          </button>
                        ) : (
                          <div className={styles.actionBtns}>
                            <button
                              className={styles.buyBtn}
                              onClick={() => { setBuyingSymbol(holding.symbol); setBuyQty(''); }}
                            >
                              Buy
                            </button>
                            <button
                              className={styles.sellBtn}
                              onClick={() => { setSellingSymbol(holding.symbol); setSellQty(''); }}
                            >
                              Sell
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isBuying && (
                      <tr className={styles.sellRow}>
                        <td colSpan={9} className={styles.sellCell}>
                          <div className={styles.sellPanel}>
                            <div className={styles.sellInfo}>
                              <span className={styles.sellInfoText}>
                                Buy <strong>{holding.symbol}</strong>
                              </span>
                              <span className={styles.sellInfoMuted}>
                                {holding.quantity} share{holding.quantity !== 1 ? 's' : ''} held
                                &ensp;·&ensp;ask {formatCurrency(ask)}
                              </span>
                            </div>
                            <div className={styles.sellControls}>
                              <div className={styles.sellField}>
                                <label className={styles.sellLabel}>Shares</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={buyQty}
                                  onChange={(e) => setBuyQty(e.target.value)}
                                  className={styles.sellInput}
                                  placeholder="0"
                                  autoFocus
                                />
                              </div>
                              <div className={styles.sellField}>
                                <span className={styles.sellLabel}>Est. cost</span>
                                <span className={styles.sellProceeds}>
                                  {buyQtyNum > 0 ? formatCurrency(estCost) : '—'}
                                </span>
                              </div>
                              <button
                                className={styles.buyConfirm}
                                disabled={!canBuy}
                                onClick={() => handleBuyConfirm(holding)}
                              >
                                Confirm purchase
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {isSelling && (
                      <tr className={styles.sellRow}>
                        <td colSpan={9} className={styles.sellCell}>
                          <div className={styles.sellPanel}>
                            <div className={styles.sellInfo}>
                              <span className={styles.sellInfoText}>
                                Sell <strong>{holding.symbol}</strong>
                              </span>
                              <span className={styles.sellInfoMuted}>
                                {holding.quantity} share{holding.quantity !== 1 ? 's' : ''} held
                                &ensp;·&ensp;bid {formatCurrency(holding.price * BID_MULTIPLIER)}
                              </span>
                            </div>
                            <div className={styles.sellControls}>
                              <div className={styles.sellField}>
                                <label className={styles.sellLabel}>Shares</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={holding.quantity}
                                  value={sellQty}
                                  onChange={(e) => setSellQty(e.target.value)}
                                  className={styles.sellInput}
                                  placeholder="0"
                                  autoFocus
                                />
                              </div>
                              <div className={styles.sellField}>
                                <span className={styles.sellLabel}>Est. proceeds</span>
                                <span className={styles.sellProceeds}>
                                  {sellQtyNum > 0 ? formatCurrency(estProceeds) : '—'}
                                </span>
                              </div>
                              <button
                                className={styles.sellConfirm}
                                disabled={!canConfirm}
                                onClick={() => handleSellConfirm(holding)}
                              >
                                Confirm sale
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
