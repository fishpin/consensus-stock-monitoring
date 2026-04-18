import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import StockDetail from '../pages/StockDetail/StockDetail';

jest.mock('../services/stockAPI', () => ({
  fetchQuote:    jest.fn(() => Promise.resolve(null)),
  fetchHistory:  jest.fn(() => Promise.resolve([])),
  fetchOverview: jest.fn(() => Promise.resolve(null)),
  fetchAnalyst:  jest.fn(() => Promise.resolve(null)),
  fetchNews:     jest.fn(() => Promise.resolve([])),
}));

function renderStock(symbol = 'AAPL') {
  return render(
    <MemoryRouter initialEntries={[`/stock/${symbol}`]}>
      <AppProvider>
        <Routes>
          <Route path="/stock/:symbol" element={<StockDetail />} />
        </Routes>
      </AppProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

// ── Rendering ──────────────────────────────────────────────────────────────────

describe('StockDetail — rendering', () => {
  test('displays the stock symbol in the heading', () => {
    renderStock('AAPL');
    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeInTheDocument();
  });

  test('displays the stock price', () => {
    renderStock('AAPL');
    // Exact match avoids parent-element multi-match; AAPL mock price is 189.84
    expect(screen.getByText('$189.84')).toBeInTheDocument();
  });

  test('displays the company name', () => {
    renderStock('AAPL');
    expect(screen.getAllByText('Apple Inc.').length).toBeGreaterThan(0);
  });

  test('renders price chart period buttons', () => {
    renderStock('AAPL');
    expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument();
  });

  test('shows a not-found message for an unknown symbol', () => {
    renderStock('FAKEXYZ');
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  test('shows fundamental stats', () => {
    renderStock('AAPL');
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  test('displays the Related News section label', () => {
    renderStock('AAPL');
    expect(screen.getByText(/related news/i)).toBeInTheDocument();
  });
});

// ── Watchlist ──────────────────────────────────────────────────────────────────

describe('StockDetail — watchlist', () => {
  test('renders the Watch button when not watching', () => {
    renderStock('AAPL');
    expect(screen.getByRole('button', { name: /add to watchlist/i })).toBeInTheDocument();
  });

  test('clicking Watch changes label to Watching', () => {
    renderStock('AAPL');
    fireEvent.click(screen.getByRole('button', { name: /add to watchlist/i }));
    expect(screen.getByRole('button', { name: /remove from watchlist/i })).toBeInTheDocument();
  });

  test('clicking Watching reverts label to Watch', () => {
    renderStock('AAPL');
    fireEvent.click(screen.getByRole('button', { name: /add to watchlist/i }));
    fireEvent.click(screen.getByRole('button', { name: /remove from watchlist/i }));
    expect(screen.getByRole('button', { name: /add to watchlist/i })).toBeInTheDocument();
  });
});

// ── Trade panel — buy flow ─────────────────────────────────────────────────────

describe('StockDetail — buy flow', () => {
  test('Buy and Sell segmented buttons are present', () => {
    renderStock('AAPL');
    expect(screen.getByRole('button', { name: /^Buy$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sell$/ })).toBeInTheDocument();
  });

  test('Sell button is disabled before the stock is in the portfolio', () => {
    renderStock('AAPL');
    expect(screen.getByRole('button', { name: /^Sell$/ })).toBeDisabled();
  });

  test('Review order button is disabled with no quantity entered', () => {
    renderStock('AAPL');
    expect(screen.getByRole('button', { name: /review order/i })).toBeDisabled();
  });

  test('Review order becomes enabled after entering a valid quantity', () => {
    renderStock('AAPL');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
    expect(screen.getByRole('button', { name: /review order/i })).not.toBeDisabled();
  });

  test('submitting the entry form advances to the confirmation screen', () => {
    renderStock('AAPL');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /review order/i }));
    expect(screen.getByRole('button', { name: /submit order/i })).toBeInTheDocument();
  });

  test('Back button returns to the entry screen', () => {
    renderStock('AAPL');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /review order/i }));
    // Page has two "Back" buttons (nav-back + confirm-back); click the confirm one
    fireEvent.click(screen.getAllByRole('button', { name: /back/i })[1]);
    expect(screen.queryByRole('button', { name: /submit order/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review order/i })).toBeInTheDocument();
  });

  test('confirming a buy shows a notification', () => {
    renderStock('AAPL');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /review order/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));
    expect(screen.getByText(/bought/i)).toBeInTheDocument();
  });
});

// ── Trade panel — sell flow ────────────────────────────────────────────────────

describe('StockDetail — sell flow', () => {
  test('Sell button is enabled after buying shares', () => {
    renderStock('AAPL');
    // Buy first
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /review order/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));
    // Now sell tab should be enabled
    expect(screen.getByRole('button', { name: /^Sell$/ })).not.toBeDisabled();
  });
});
