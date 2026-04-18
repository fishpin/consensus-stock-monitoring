import { render, screen } from '@testing-library/react';

// stockAPI uses import.meta.env (Vite-only) — mock it for Jest
jest.mock('../services/stockAPI', () => ({
  fetchQuote:    jest.fn(() => Promise.resolve(null)),
  fetchHistory:  jest.fn(() => Promise.resolve([])),
  searchStocks:  jest.fn(() => Promise.resolve([])),
  fetchOverview: jest.fn(() => Promise.resolve(null)),
  fetchAnalyst:  jest.fn(() => Promise.resolve(null)),
  fetchNews:     jest.fn(() => Promise.resolve([])),
}));

// chatAPI uses CometChat — mock it for Jest
jest.mock('../services/chatAPI', () => ({
  USE_MOCK:               false,
  initChat:              jest.fn(() => Promise.resolve()),
  loginUser:             jest.fn(() => Promise.resolve({ uid: 'consensus_user' })),
  ensureGroup:           jest.fn(() => Promise.resolve()),
  joinGroup:             jest.fn(() => Promise.resolve()),
  fetchMessages:         jest.fn(() => Promise.resolve([])),
  sendMessage:           jest.fn(() => Promise.resolve({})),
  addMessageListener:    jest.fn(),
  removeMessageListener: jest.fn(),
  fetchOnlineCount:      jest.fn(() => Promise.resolve(0)),
  addPresenceListener:   jest.fn(),
  removePresenceListener: jest.fn(),
}));
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import Landing     from '../pages/Landing/Landing';
import Watchlist   from '../pages/Watchlist/Watchlist';
import Portfolio   from '../pages/Portfolio/Portfolio';
import Chat        from '../pages/Chat/Chat';
import StockDetail from '../pages/StockDetail/StockDetail';
import { ROUTES }  from '../constants/routes';

function renderRoute(path, initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry ?? path]}>
      <AppProvider>
        <Routes>
          <Route path={ROUTES.HOME}      element={<Landing />} />
          <Route path={ROUTES.WATCHLIST} element={<Watchlist />} />
          <Route path={ROUTES.PORTFOLIO} element={<Portfolio />} />
          <Route path={ROUTES.CHAT}      element={<Chat />} />
          <Route path={ROUTES.STOCK}     element={<StockDetail />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>
  );
}

describe('Routing', () => {
  test('/ renders the Landing page with stock tabs', () => {
    renderRoute(ROUTES.HOME);
    expect(screen.getByRole('button', { name: 'Popular' })).toBeInTheDocument();
  });

  test('/watchlist renders the Watchlist page', () => {
    renderRoute(ROUTES.WATCHLIST);
    expect(screen.getByRole('heading', { name: /your watchlist is empty/i })).toBeInTheDocument();
  });

  test('/portfolio renders the Portfolio page', () => {
    renderRoute(ROUTES.PORTFOLIO);
    expect(screen.getByText(/your portfolio is empty/i)).toBeInTheDocument();
  });

  test('/chat renders the Chat page', () => {
    renderRoute(ROUTES.CHAT);
    expect(screen.getByText('Rooms')).toBeInTheDocument();
  });

  test('/stock/:symbol renders the StockDetail page for a known symbol', () => {
    renderRoute(ROUTES.STOCK, '/stock/AAPL');
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  test('/stock/:symbol shows not-found for an unknown symbol', () => {
    renderRoute(ROUTES.STOCK, '/stock/FAKE');
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
