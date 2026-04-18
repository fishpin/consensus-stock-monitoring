/**
 * Unit tests for the AppContext reducer.
 * Pure function — no rendering needed.
 */
import { ACTIONS } from '../context/AppContext';

// Import the reducer directly for isolated unit testing
// We re-implement it here to keep the test self-contained,
// or we can just test through the context. Instead, let's
// test via the exported ACTIONS + a manual reducer import.
// Because the reducer isn't exported we'll test it indirectly
// via a thin wrapper component that exposes state.

import { render, act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';

const AAPL = { symbol: 'AAPL', name: 'Apple Inc.', price: 189, changePercent: 1.2 };
const TSLA = { symbol: 'TSLA', name: 'Tesla Inc.', price: 171, changePercent: -2.4 };

const HOLDING_AAPL = { ...AAPL, quantity: 5, buyPrice: 180 };
const HOLDING_TSLA = { ...TSLA, quantity: 3, buyPrice: 160 };

// Helper: renders AppProvider and exposes the context value via a ref
function getContext() {
  let ctx;
  function Capture() {
    ctx = useApp();
    return null;
  }
  render(
    <AppProvider>
      <Capture />
    </AppProvider>
  );
  return () => ctx;
}

beforeEach(() => {
  localStorage.clear();
});

// ── Watchlist ────────────────────────────────────────────────────────────────

describe('AppContext — watchlist', () => {
  test('starts empty', () => {
    const ctx = getContext();
    expect(ctx().watchlist).toHaveLength(0);
  });

  test('addToWatchlist adds a stock', () => {
    const ctx = getContext();
    act(() => ctx().addToWatchlist(AAPL));
    expect(ctx().watchlist).toHaveLength(1);
    expect(ctx().watchlist[0].symbol).toBe('AAPL');
  });

  test('addToWatchlist ignores duplicate symbols', () => {
    const ctx = getContext();
    act(() => ctx().addToWatchlist(AAPL));
    act(() => ctx().addToWatchlist(AAPL));
    expect(ctx().watchlist).toHaveLength(1);
  });

  test('addToWatchlist can hold multiple different stocks', () => {
    const ctx = getContext();
    act(() => ctx().addToWatchlist(AAPL));
    act(() => ctx().addToWatchlist(TSLA));
    expect(ctx().watchlist).toHaveLength(2);
  });

  test('removeFromWatchlist removes by symbol', () => {
    const ctx = getContext();
    act(() => ctx().addToWatchlist(AAPL));
    act(() => ctx().addToWatchlist(TSLA));
    act(() => ctx().removeFromWatchlist('AAPL'));
    expect(ctx().watchlist).toHaveLength(1);
    expect(ctx().watchlist[0].symbol).toBe('TSLA');
  });

  test('removeFromWatchlist is a no-op for unknown symbol', () => {
    const ctx = getContext();
    act(() => ctx().addToWatchlist(AAPL));
    act(() => ctx().removeFromWatchlist('FAKE'));
    expect(ctx().watchlist).toHaveLength(1);
  });

  test('isInWatchlist returns true for added stock', () => {
    const ctx = getContext();
    act(() => ctx().addToWatchlist(AAPL));
    expect(ctx().isInWatchlist('AAPL')).toBe(true);
  });

  test('isInWatchlist returns false after removal', () => {
    const ctx = getContext();
    act(() => ctx().addToWatchlist(AAPL));
    act(() => ctx().removeFromWatchlist('AAPL'));
    expect(ctx().isInWatchlist('AAPL')).toBe(false);
  });
});

// ── Portfolio ────────────────────────────────────────────────────────────────

describe('AppContext — portfolio', () => {
  test('starts empty', () => {
    const ctx = getContext();
    expect(ctx().portfolio).toHaveLength(0);
  });

  test('addToPortfolio adds a new holding', () => {
    const ctx = getContext();
    act(() => ctx().addToPortfolio(HOLDING_AAPL));
    expect(ctx().portfolio).toHaveLength(1);
    expect(ctx().portfolio[0].symbol).toBe('AAPL');
  });

  test('addToPortfolio merges quantity for an existing holding', () => {
    const ctx = getContext();
    act(() => ctx().addToPortfolio(HOLDING_AAPL));
    act(() => ctx().addToPortfolio({ ...HOLDING_AAPL, quantity: 3 }));
    expect(ctx().portfolio).toHaveLength(1);
    expect(ctx().portfolio[0].quantity).toBe(8);
  });

  test('addToPortfolio adds a second different stock', () => {
    const ctx = getContext();
    act(() => ctx().addToPortfolio(HOLDING_AAPL));
    act(() => ctx().addToPortfolio(HOLDING_TSLA));
    expect(ctx().portfolio).toHaveLength(2);
  });

  test('removeFromPortfolio removes by symbol', () => {
    const ctx = getContext();
    act(() => ctx().addToPortfolio(HOLDING_AAPL));
    act(() => ctx().addToPortfolio(HOLDING_TSLA));
    act(() => ctx().removeFromPortfolio('AAPL'));
    expect(ctx().portfolio).toHaveLength(1);
    expect(ctx().portfolio[0].symbol).toBe('TSLA');
  });

  test('updatePortfolioQty changes the quantity', () => {
    const ctx = getContext();
    act(() => ctx().addToPortfolio(HOLDING_AAPL));
    act(() => ctx().updatePortfolioQty('AAPL', 20));
    expect(ctx().portfolio[0].quantity).toBe(20);
  });

  test('isInPortfolio returns true for a held stock', () => {
    const ctx = getContext();
    act(() => ctx().addToPortfolio(HOLDING_AAPL));
    expect(ctx().isInPortfolio('AAPL')).toBe(true);
  });

  test('isInPortfolio returns false after removal', () => {
    const ctx = getContext();
    act(() => ctx().addToPortfolio(HOLDING_AAPL));
    act(() => ctx().removeFromPortfolio('AAPL'));
    expect(ctx().isInPortfolio('AAPL')).toBe(false);
  });
});

// ── Chat rooms ───────────────────────────────────────────────────────────────

describe('AppContext — chat rooms', () => {
  test('createChatRoom adds a new room', () => {
    const ctx = getContext();
    const before = ctx().chatRooms.length;
    act(() => ctx().createChatRoom({ id: 'room-test', name: 'Test Room', topic: '' }));
    expect(ctx().chatRooms).toHaveLength(before + 1);
  });

  test('createChatRoom ignores duplicate room ids', () => {
    const ctx = getContext();
    act(() => ctx().createChatRoom({ id: 'room-dup', name: 'Dup', topic: '' }));
    const after = ctx().chatRooms.length;
    act(() => ctx().createChatRoom({ id: 'room-dup', name: 'Dup', topic: '' }));
    expect(ctx().chatRooms).toHaveLength(after);
  });
});

// ── localStorage persistence ──────────────────────────────────────────────────

describe('AppContext — localStorage persistence', () => {
  test('watchlist is written to localStorage on change', () => {
    const ctx = getContext();
    act(() => ctx().addToWatchlist(AAPL));
    const stored = JSON.parse(localStorage.getItem('consensus_watchlist'));
    expect(stored).toHaveLength(1);
    expect(stored[0].symbol).toBe('AAPL');
  });

  test('portfolio is written to localStorage on change', () => {
    const ctx = getContext();
    act(() => ctx().addToPortfolio(HOLDING_AAPL));
    const stored = JSON.parse(localStorage.getItem('consensus_portfolio'));
    expect(stored).toHaveLength(1);
    expect(stored[0].symbol).toBe('AAPL');
  });
});
