export const APP_NAME = 'Consensus';

export const STORAGE_KEYS = {
  WATCHLIST: 'consensus_watchlist',
  PORTFOLIO: 'consensus_portfolio',
  THEME:     'consensus_theme',
  CHAT_ROOMS: 'consensus_chat_rooms',
};

export const SENTIMENT = {
  UP:      'up',
  DOWN:    'down',
  NEUTRAL: 'neutral',
};

export const CHART_PERIODS = [
  { label: '1D', value: '1D', days: 1   },
  { label: '1W', value: '1W', days: 7   },
  { label: '1M', value: '1M', days: 30  },
  { label: '3M', value: '3M', days: 90  },
  { label: '1Y', value: '1Y', days: 365 },
];

export const API_BASE_URL = 'https://www.alphavantage.co/query';

export const SEARCH_RESULTS_LIMIT = 6;

export const BLUR_DELAY_MS = 150;

export const PORTFOLIO_COLORS = [
  '#ffb300', '#16a34a', '#3b82f6', '#8b5cf6',
  '#f97316', '#ec4899', '#14b8a6', '#f43f5e',
];

export const BREAKING_NEWS_AGE_HOURS = 3;
