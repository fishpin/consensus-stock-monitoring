import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider, useApp } from '../context/AppContext';
import Landing from '../pages/Landing/Landing';

jest.mock('../services/stockAPI', () => ({
  fetchOverview: jest.fn(() => Promise.resolve(null)),
  fetchNews:     jest.fn(() => Promise.resolve([])),
}));

function renderLanding(seedWatchlist = []) {
  let adder;

  function Seeder() {
    adder = useApp().addToWatchlist;
    return null;
  }

  render(
    <MemoryRouter>
      <AppProvider>
        <Seeder />
        <Landing />
      </AppProvider>
    </MemoryRouter>
  );

  if (seedWatchlist.length) {
    act(() => seedWatchlist.forEach((s) => adder(s)));
  }
}

beforeEach(() => localStorage.clear());

// ── Masthead ──────────────────────────────────────────────────────────────────

describe('Landing — masthead', () => {
  test('displays the application name', () => {
    renderLanding();
    expect(screen.getByRole('heading', { name: /consensus/i })).toBeInTheDocument();
  });

  test('displays today\'s date', () => {
    renderLanding();
    const year = new Date().getFullYear().toString();
    expect(screen.getAllByText(new RegExp(year)).length).toBeGreaterThan(0);
  });
});

// ── Stock tabs ────────────────────────────────────────────────────────────────

describe('Landing — stock tabs', () => {
  test('renders all four tab buttons', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: 'Popular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Watched'  })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gainers'  })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Losers'   })).toBeInTheDocument();
  });

  test('Popular tab is active by default and shows stocks', () => {
    renderLanding();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  test('Gainers tab shows stocks when clicked', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: 'Gainers' }));
    // StockCard rows have role="button" — check for expandable stock rows
    expect(screen.getAllByRole('button', { name: /click to expand/i }).length).toBeGreaterThan(0);
  });

  test('Losers tab shows stocks when clicked', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: 'Losers' }));
    expect(screen.getAllByRole('button', { name: /click to expand/i }).length).toBeGreaterThan(0);
  });

  test('Watched tab shows empty message when watchlist is empty', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: 'Watched' }));
    expect(screen.getByText(/no stocks in your watchlist/i)).toBeInTheDocument();
  });

  test('Watched tab shows a stock that has been added to the watchlist', () => {
    renderLanding([{ symbol: 'AAPL', name: 'Apple Inc.', price: 189, change: 1, changePercent: 1 }]);
    fireEvent.click(screen.getByRole('button', { name: 'Watched' }));
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });
});

// ── News section ──────────────────────────────────────────────────────────────

describe('Landing — news section', () => {
  test('renders the Latest news section heading', () => {
    renderLanding();
    expect(screen.getByText(/latest/i)).toBeInTheDocument();
  });
});
