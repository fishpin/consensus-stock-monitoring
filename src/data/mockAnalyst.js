/**
 * Mock analyst rating data — placeholder for Alpha Vantage OVERVIEW responses.
 *
 * Replace getAnalystBySymbol with a call to:
 *   GET https://www.alphavantage.co/query
 *     ?function=OVERVIEW&symbol={symbol}&apikey={key}
 *
 * Then map the response fields:
 *   data.AnalystTargetPrice      → targetPrice
 *   data.AnalystRatingStrongBuy  → strongBuy
 *   data.AnalystRatingBuy        → buy
 *   data.AnalystRatingHold       → hold
 *   data.AnalystRatingSell       → sell
 *   data.AnalystRatingStrongSell → strongSell
 */

const MOCK_ANALYST = [
  { symbol: 'AAPL',  targetPrice: 215, strongBuy: 10, buy: 12, hold:  5, sell: 1, strongSell: 0 },
  { symbol: 'MSFT',  targetPrice: 420, strongBuy: 18, buy: 12, hold:  4, sell: 1, strongSell: 0 },
  { symbol: 'GOOGL', targetPrice: 195, strongBuy: 14, buy: 10, hold:  5, sell: 1, strongSell: 0 },
  { symbol: 'AMZN',  targetPrice: 230, strongBuy: 20, buy: 14, hold:  3, sell: 1, strongSell: 0 },
  { symbol: 'TSLA',  targetPrice: 210, strongBuy:  8, buy:  7, hold:  9, sell: 5, strongSell: 3 },
  { symbol: 'NVDA',  targetPrice: 165, strongBuy: 25, buy: 12, hold:  2, sell: 1, strongSell: 0 },
  { symbol: 'META',  targetPrice: 620, strongBuy: 18, buy: 11, hold:  4, sell: 1, strongSell: 0 },
  { symbol: 'JPM',   targetPrice: 240, strongBuy:  9, buy: 10, hold:  5, sell: 1, strongSell: 0 },
  { symbol: 'JNJ',   targetPrice: 165, strongBuy:  5, buy:  8, hold:  6, sell: 1, strongSell: 0 },
  { symbol: 'XOM',   targetPrice: 115, strongBuy:  6, buy:  8, hold:  6, sell: 2, strongSell: 0 },
];

export const getAnalystBySymbol = (symbol) =>
  MOCK_ANALYST.find((a) => a.symbol === symbol.toUpperCase()) ?? null;
