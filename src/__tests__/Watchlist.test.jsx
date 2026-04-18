import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider, useApp } from '../context/AppContext';
import Watchlist from '../pages/Watchlist/Watchlist';

const AAPL = {
  symbol:        'AAPL',
  name:          'Apple Inc.',
  price:         189.84,
  change:        2.41,
  changePercent: 1.29,
  history:       [],
};

const TSLA = {
  symbol:        'TSLA',
  name:          'Tesla Inc.',
  price:         171.05,
  change:        -4.32,
  changePercent: -2.46,
  history:       [],
};

// Seeds the watchlist via context action creators, then renders the page.
function renderWatchlist(seedStocks = []) {
  let adder;

  function Seeder() {
    adder = useApp().addToWatchlist;
    return null;
  }

  render(
    <MemoryRouter>
      <AppProvider>
        <Seeder />
        <Watchlist />
      </AppProvider>
    </MemoryRouter>
  );

  if (seedStocks.length) {
    act(() => seedStocks.forEach((s) => adder(s)));
  }
}

beforeEach(() => {
  localStorage.clear();
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe('Watchlist page — empty state', () => {
  test('shows empty state message', () => {
    renderWatchlist();
    expect(screen.getByText(/your watchlist is empty/i)).toBeInTheDocument();
  });

  test('renders a Browse Stocks button', () => {
    renderWatchlist();
    expect(screen.getByRole('button', { name: /browse stocks/i })).toBeInTheDocument();
  });
});

// ── With stocks ───────────────────────────────────────────────────────────────

describe('Watchlist page — with stocks', () => {
  test('displays the stock symbol', () => {
    renderWatchlist([AAPL]);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  test('displays the company name', () => {
    renderWatchlist([AAPL]);
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  test('displays multiple stocks', () => {
    renderWatchlist([AAPL, TSLA]);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('TSLA')).toBeInTheDocument();
  });

  test('does not show empty state when stocks are present', () => {
    renderWatchlist([AAPL]);
    expect(screen.queryByText(/your watchlist is empty/i)).not.toBeInTheDocument();
  });

  test('displays the formatted price', () => {
    renderWatchlist([AAPL]);
    expect(screen.getByText('$189.84')).toBeInTheDocument();
  });

  test('shows positive change percent with + prefix', () => {
    renderWatchlist([AAPL]);
    expect(screen.getByText(/\+1\.29%/)).toBeInTheDocument();
  });

  test('shows negative change percent without + prefix', () => {
    renderWatchlist([TSLA]);
    expect(screen.getByText(/-2\.46%/)).toBeInTheDocument();
  });
});

// ── Remove flow ───────────────────────────────────────────────────────────────

describe('Watchlist page — remove flow', () => {
  test('removing the only stock shows empty state', () => {
    renderWatchlist([AAPL]);
    const removeBtn = screen.getByLabelText(/remove from watchlist|unwatch/i);
    fireEvent.click(removeBtn);
    expect(screen.getByText(/your watchlist is empty/i)).toBeInTheDocument();
  });

  test('removing one of two stocks leaves the other', () => {
    renderWatchlist([AAPL, TSLA]);
    const removeBtns = screen.getAllByLabelText(/remove from watchlist|unwatch/i);
    fireEvent.click(removeBtns[0]);
    // One symbol should be gone, the other remains
    const symbols = ['AAPL', 'TSLA'];
    const remaining = symbols.filter((s) => screen.queryByText(s));
    expect(remaining).toHaveLength(1);
  });
});
