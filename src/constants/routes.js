export const ROUTES = {
  HOME:      '/',
  STOCK:     '/stock/:symbol',
  WATCHLIST: '/watchlist',
  PORTFOLIO: '/portfolio',
  CHAT:      '/chat',
};

/** Build a concrete stock URL from a symbol */
export const stockPath = (symbol) => `/stock/${symbol}`;
