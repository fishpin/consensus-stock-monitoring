/**
 * Mock sentiment data — placeholder for Alpha Vantage NEWS_SENTIMENT responses.
 *
 * Replace getSentimentBySymbol with a real call to:
 *   GET https://www.alphavantage.co/query
 *     ?function=NEWS_SENTIMENT&tickers={symbol}&apikey={key}
 *
 * Aggregate the response feed array using each article's ticker_sentiment:
 *   - label "Bullish" or "Somewhat-Bullish"   → count toward bullishPct
 *   - label "Bearish" or "Somewhat-Bearish"   → count toward bearishPct
 *   - label "Neutral"                         → count toward neutralPct
 *   - mean ticker_sentiment_score             → avgScore  (AV range: -1 to 1)
 *   - dominant bucket label                   → label
 */

const MOCK_SENTIMENT = [
  { symbol: 'AAPL',  bullishPct: 58, neutralPct: 30, bearishPct: 12, avgScore:  0.28, label: 'Somewhat-Bullish', articleCount: 42 },
  { symbol: 'MSFT',  bullishPct: 64, neutralPct: 28, bearishPct:  8, avgScore:  0.41, label: 'Bullish',           articleCount: 38 },
  { symbol: 'GOOGL', bullishPct: 52, neutralPct: 30, bearishPct: 18, avgScore:  0.21, label: 'Somewhat-Bullish', articleCount: 31 },
  { symbol: 'AMZN',  bullishPct: 55, neutralPct: 30, bearishPct: 15, avgScore:  0.24, label: 'Somewhat-Bullish', articleCount: 35 },
  { symbol: 'TSLA',  bullishPct: 38, neutralPct: 27, bearishPct: 35, avgScore:  0.04, label: 'Neutral',           articleCount: 67 },
  { symbol: 'NVDA',  bullishPct: 74, neutralPct: 19, bearishPct:  7, avgScore:  0.52, label: 'Bullish',           articleCount: 58 },
  { symbol: 'META',  bullishPct: 61, neutralPct: 25, bearishPct: 14, avgScore:  0.35, label: 'Bullish',           articleCount: 29 },
  { symbol: 'JPM',   bullishPct: 49, neutralPct: 30, bearishPct: 21, avgScore:  0.09, label: 'Neutral',           articleCount: 22 },
  { symbol: 'JNJ',   bullishPct: 44, neutralPct: 37, bearishPct: 19, avgScore:  0.06, label: 'Neutral',           articleCount: 18 },
  { symbol: 'XOM',   bullishPct: 41, neutralPct: 31, bearishPct: 28, avgScore:  0.03, label: 'Neutral',           articleCount: 25 },
];

export const getSentimentBySymbol = (symbol) =>
  MOCK_SENTIMENT.find((s) => s.symbol === symbol.toUpperCase()) ?? null;
