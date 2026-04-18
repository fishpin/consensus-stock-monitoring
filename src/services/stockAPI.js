/**
 * Stock data service.
 * Tries Alpha Vantage first; falls back to mock data if the key is "demo"
 * or if the API call fails.
 */

import axios from 'axios';
import { API_BASE_URL, SEARCH_RESULTS_LIMIT, BREAKING_NEWS_AGE_HOURS } from '../constants/app';
import { getStockBySymbol, MOCK_STOCKS, POPULAR_SYMBOLS } from '../data/mockStocks';
import { getAnalystBySymbol } from '../data/mockAnalyst';
import { MOCK_NEWS, getNewsBySymbol } from '../data/mockNews';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY ?? 'demo';
const USE_MOCK = API_KEY === 'demo' || API_KEY === '';

/** Fetch the current quote for a symbol */
export async function fetchQuote(symbol) {
  if (USE_MOCK) return getMockQuote(symbol);

  try {
    const { data } = await axios.get(API_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: API_KEY,
      },
    });

    const q = data['Global Quote'];
    if (!q || !q['05. price']) throw new Error('No data returned');

    return {
      symbol,
      price:         parseFloat(q['05. price']),
      change:        parseFloat(q['09. change']),
      changePercent: parseFloat(q['10. change percent'].replace('%', '')),
      volume:        formatVolume(parseInt(q['06. volume'], 10)),
      high52w:       parseFloat(q['03. high']),
      low52w:        parseFloat(q['04. low']),
    };
  } catch {
    return getMockQuote(symbol);
  }
}

/** Fetch daily price history for charting */
export async function fetchHistory(symbol) {
  if (USE_MOCK) return getMockHistory(symbol);

  try {
    const { data } = await axios.get(API_BASE_URL, {
      params: {
        function:    'TIME_SERIES_DAILY',
        symbol,
        outputsize: 'compact',
        apikey:     API_KEY,
      },
    });

    const series = data['Time Series (Daily)'];
    if (!series) throw new Error('No series data');

    return Object.entries(series)
      .map(([date, values]) => ({
        date,
        price:  parseFloat(values['4. close']),
        open:   parseFloat(values['1. open']),
        high:   parseFloat(values['2. high']),
        low:    parseFloat(values['3. low']),
        volume: parseInt(values['5. volume'], 10),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch {
    return getMockHistory(symbol);
  }
}

/** Search stocks by keyword */
export async function searchStocks(query) {
  if (USE_MOCK) return getMockSearch(query);

  try {
    const { data } = await axios.get(API_BASE_URL, {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey:   API_KEY,
      },
    });

    const matches = data['bestMatches'] ?? [];
    return matches.slice(0, SEARCH_RESULTS_LIMIT).map((m) => ({
      symbol: m['1. symbol'],
      name:   m['2. name'],
    }));
  } catch {
    return getMockSearch(query);
  }
}

/** Fetch company overview / fundamentals */
export async function fetchOverview(symbol) {
  if (USE_MOCK) return getMockOverview(symbol);

  try {
    const { data } = await axios.get(API_BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol,
        apikey: API_KEY,
      },
    });

    if (!data.Symbol) throw new Error('No overview data');

    return {
      symbol,
      marketCap:     formatMarketCap(parseInt(data.MarketCapitalization, 10)),
      peRatio:       parseFloat(data.PERatio) || null,
      eps:           parseFloat(data.EPS) || null,
      beta:          parseFloat(data.Beta) || null,
      high52w:       parseFloat(data['52WeekHigh']) || null,
      low52w:        parseFloat(data['52WeekLow']) || null,
      analystTarget: parseFloat(data.AnalystTargetPrice) || null,
      dividendYield: parseFloat(data.DividendYield)
        ? `${(parseFloat(data.DividendYield) * 100).toFixed(2)}%`
        : null,
      sector:      data.Sector,
      description: data.Description,
    };
  } catch {
    return getMockOverview(symbol);
  }
}

/** Fetch analyst ratings and price target */
export async function fetchAnalyst(symbol) {
  if (USE_MOCK) return getMockAnalyst(symbol);

  try {
    const { data } = await axios.get(API_BASE_URL, {
      params: { function: 'OVERVIEW', symbol, apikey: API_KEY },
    });

    if (!data.Symbol) throw new Error('No overview data');

    return {
      symbol,
      targetPrice: parseFloat(data.AnalystTargetPrice)       || null,
      strongBuy:   parseInt(data.AnalystRatingStrongBuy, 10) || 0,
      buy:         parseInt(data.AnalystRatingBuy, 10)        || 0,
      hold:        parseInt(data.AnalystRatingHold, 10)       || 0,
      sell:        parseInt(data.AnalystRatingSell, 10)       || 0,
      strongSell:  parseInt(data.AnalystRatingStrongSell, 10) || 0,
    };
  } catch {
    return getMockAnalyst(symbol);
  }
}

/** Fetch news articles, optionally filtered by stock symbol */
export async function fetchNews(symbol = null) {
  if (USE_MOCK) return symbol ? getNewsBySymbol(symbol) : MOCK_NEWS.slice(0, 8);

  try {
    const params = {
      function: 'NEWS_SENTIMENT',
      limit:    50,
      apikey:   API_KEY,
    };
    if (symbol) params.tickers = symbol;

    const { data } = await axios.get(API_BASE_URL, { params });
    const feed = data?.feed;
    if (!Array.isArray(feed) || feed.length === 0) throw new Error('No news data');

    const cutoff = Date.now() - BREAKING_NEWS_AGE_HOURS * 3_600_000;

    return feed.slice(0, symbol ? 20 : 8).map((item, i) => {
      const publishedAt = parseAvTime(item.time_published);
      const relatedSymbols = (item.ticker_sentiment ?? []).map((t) => t.ticker);
      return {
        id:             `av-${i}-${item.time_published}`,
        headline:       item.title,
        source:         item.source,
        publishedAt,
        summary:        item.summary,
        url:            item.url,
        imageUrl:       item.banner_image ?? null,
        relatedSymbols,
        isBreaking:     new Date(publishedAt).getTime() >= cutoff,
      };
    });
  } catch {
    return symbol ? getNewsBySymbol(symbol) : MOCK_NEWS.slice(0, 8);
  }
}

/** Parse Alpha Vantage time format `20241015T093000` → ISO string */
function parseAvTime(s) {
  if (!s || s.length < 15) return new Date().toISOString();
  return new Date(
    `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`
  ).toISOString();
}

/** Fetch top gainers, losers, and most actively traded stocks */
export async function fetchMarketMovers() {
  if (USE_MOCK) return getMockMarketMovers();

  try {
    const { data } = await axios.get(API_BASE_URL, {
      params: { function: 'TOP_GAINERS_LOSERS', apikey: API_KEY },
    });

    return {
      popular: (data.most_actively_traded ?? []).slice(0, 8).map(mapMover),
      gainers: (data.top_gainers          ?? []).slice(0, 8).map(mapMover),
      losers:  (data.top_losers           ?? []).slice(0, 8).map(mapMover),
    };
  } catch {
    return getMockMarketMovers();
  }
}

// ── Mock helpers ──────────────────────────────────────────────────

function getMockQuote(symbol) {
  const stock = getStockBySymbol(symbol);
  if (!stock) return null;
  return {
    symbol:        stock.symbol,
    price:         stock.price,
    change:        stock.change,
    changePercent: stock.changePercent,
    volume:        stock.volume,
    high52w:       stock.high52w,
    low52w:        stock.low52w,
  };
}

function getMockHistory(symbol) {
  const stock = getStockBySymbol(symbol);
  return stock ? stock.history : [];
}

function getMockSearch(query) {
  const lower = query.toLowerCase();
  return MOCK_STOCKS
    .filter(
      (s) =>
        s.symbol.toLowerCase().includes(lower) ||
        s.name.toLowerCase().includes(lower)
    )
    .slice(0, SEARCH_RESULTS_LIMIT)
    .map((s) => ({ symbol: s.symbol, name: s.name }));
}

function getMockOverview(symbol) {
  const stock = getStockBySymbol(symbol);
  if (!stock) return null;
  return {
    symbol:        stock.symbol,
    marketCap:     stock.marketCap,
    peRatio:       stock.peRatio,
    eps:           stock.eps ?? null,
    beta:          stock.beta ?? null,
    high52w:       stock.high52w,
    low52w:        stock.low52w,
    analystTarget: stock.analystTarget ?? null,
    dividendYield: stock.dividendYield ?? null,
    sector:        stock.sector,
    description:   stock.description,
  };
}

function getMockAnalyst(symbol) {
  return getAnalystBySymbol(symbol);
}

function getMockMarketMovers() {
  const popular = POPULAR_SYMBOLS
    .map((sym) => MOCK_STOCKS.find((s) => s.symbol === sym))
    .filter(Boolean);
  const gainers = [...MOCK_STOCKS].sort((a, b) => b.changePercent - a.changePercent).slice(0, 8);
  const losers  = [...MOCK_STOCKS].sort((a, b) => a.changePercent - b.changePercent).slice(0, 8);
  return { popular, gainers, losers };
}

function mapMover(m) {
  const known = getStockBySymbol(m.ticker);
  return {
    symbol:        m.ticker,
    name:          known?.name    ?? m.ticker,
    price:         parseFloat(m.price),
    change:        parseFloat(m.change_amount),
    changePercent: parseFloat(m.change_percentage.replace('%', '')),
    volume:        formatVolume(parseInt(m.volume, 10)),
    history:       known?.history ?? [],
  };
}

function formatMarketCap(n) {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000)     return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)         return `${(n / 1_000_000).toFixed(1)}M`;
  return String(n);
}

function formatVolume(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
