import { createContext, useContext, useEffect, useReducer } from 'react';
import { STORAGE_KEYS } from '../constants/app';
import { MOCK_ROOMS } from '../data/mockChat';

// ── Initial state ────────────────────────────────────────────────────────────

const initialState = {
  watchlist:  JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCHLIST)  || '[]'),
  portfolio:  JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIO)  || '[]'),
  chatRooms:  JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_ROOMS) || 'null') || MOCK_ROOMS,
  theme:      localStorage.getItem(STORAGE_KEYS.THEME) || 'light',
};

// ── Action types ─────────────────────────────────────────────────────────────

export const ACTIONS = {
  ADD_TO_WATCHLIST:      'ADD_TO_WATCHLIST',
  REMOVE_FROM_WATCHLIST: 'REMOVE_FROM_WATCHLIST',

  ADD_TO_PORTFOLIO:      'ADD_TO_PORTFOLIO',
  REMOVE_FROM_PORTFOLIO: 'REMOVE_FROM_PORTFOLIO',
  UPDATE_PORTFOLIO_QTY:  'UPDATE_PORTFOLIO_QTY',

  CREATE_CHAT_ROOM:      'CREATE_CHAT_ROOM',

  TOGGLE_THEME:          'TOGGLE_THEME',
};

// ── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state, action) {
  switch (action.type) {

    case ACTIONS.ADD_TO_WATCHLIST: {
      const alreadyAdded = state.watchlist.some(
        (s) => s.symbol === action.payload.symbol
      );
      if (alreadyAdded) return state;
      return { ...state, watchlist: [...state.watchlist, action.payload] };
    }

    case ACTIONS.REMOVE_FROM_WATCHLIST:
      return {
        ...state,
        watchlist: state.watchlist.filter((s) => s.symbol !== action.payload),
      };

    case ACTIONS.ADD_TO_PORTFOLIO: {
      const existing = state.portfolio.find(
        (h) => h.symbol === action.payload.symbol
      );
      if (existing) {
        // Increase quantity if already held
        return {
          ...state,
          portfolio: state.portfolio.map((h) =>
            h.symbol === action.payload.symbol
              ? { ...h, quantity: h.quantity + action.payload.quantity }
              : h
          ),
        };
      }
      return { ...state, portfolio: [...state.portfolio, action.payload] };
    }

    case ACTIONS.REMOVE_FROM_PORTFOLIO:
      return {
        ...state,
        portfolio: state.portfolio.filter((h) => h.symbol !== action.payload),
      };

    case ACTIONS.UPDATE_PORTFOLIO_QTY:
      return {
        ...state,
        portfolio: state.portfolio.map((h) =>
          h.symbol === action.payload.symbol
            ? { ...h, quantity: action.payload.quantity }
            : h
        ),
      };

    case ACTIONS.CREATE_CHAT_ROOM: {
      const exists = state.chatRooms.some((r) => r.id === action.payload.id);
      if (exists) return state;
      return { ...state, chatRooms: [...state.chatRooms, action.payload] };
    }

    case ACTIONS.TOGGLE_THEME:
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };

    default:
      return state;
  }
}

// ── Context & Provider ────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persist watchlist and portfolio to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(state.watchlist));
  }, [state.watchlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(state.portfolio));
  }, [state.portfolio]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT_ROOMS, JSON.stringify(state.chatRooms));
  }, [state.chatRooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Apply saved theme on first load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, []);

  // ── Convenience action creators ──────────────────────────────────────────

  const addToWatchlist      = (stock)          => dispatch({ type: ACTIONS.ADD_TO_WATCHLIST,      payload: stock });
  const removeFromWatchlist = (symbol)         => dispatch({ type: ACTIONS.REMOVE_FROM_WATCHLIST, payload: symbol });

  const addToPortfolio      = (holding)        => dispatch({ type: ACTIONS.ADD_TO_PORTFOLIO,      payload: holding });
  const removeFromPortfolio = (symbol)         => dispatch({ type: ACTIONS.REMOVE_FROM_PORTFOLIO, payload: symbol });
  const updatePortfolioQty  = (symbol, quantity) => dispatch({ type: ACTIONS.UPDATE_PORTFOLIO_QTY, payload: { symbol, quantity } });

  const createChatRoom      = (room)           => dispatch({ type: ACTIONS.CREATE_CHAT_ROOM,      payload: room });

  const toggleTheme         = ()               => dispatch({ type: ACTIONS.TOGGLE_THEME });

  const isInWatchlist = (symbol) => state.watchlist.some((s) => s.symbol === symbol);
  const isInPortfolio = (symbol) => state.portfolio.some((h) => h.symbol === symbol);

  return (
    <AppContext.Provider value={{
      ...state,
      addToWatchlist,
      removeFromWatchlist,
      addToPortfolio,
      removeFromPortfolio,
      updatePortfolioQty,
      createChatRoom,
      toggleTheme,
      isInWatchlist,
      isInPortfolio,
    }}>
      {children}
    </AppContext.Provider>
  );
}

/** Hook — throws if used outside AppProvider */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
