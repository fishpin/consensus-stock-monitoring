import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider, useApp } from '../context/AppContext';
import Portfolio from '../pages/Portfolio/Portfolio';

const HOLDING = {
  symbol:        'AAPL',
  name:          'Apple Inc.',
  price:         189.84,
  changePercent: 1.29,
  quantity:      10,
  buyPrice:      175.00,
};

const HOLDING_2 = {
  symbol:        'TSLA',
  name:          'Tesla Inc.',
  price:         171.05,
  changePercent: -2.46,
  quantity:      5,
  buyPrice:      200.00,
};

// Seeds the portfolio via context action creators, then renders the page.
function renderPortfolio(seedHoldings = []) {
  let adder;

  function Seeder() {
    adder = useApp().addToPortfolio;
    return null;
  }

  render(
    <MemoryRouter>
      <AppProvider>
        <Seeder />
        <Portfolio />
      </AppProvider>
    </MemoryRouter>
  );

  if (seedHoldings.length) {
    act(() => seedHoldings.forEach((h) => adder(h)));
  }
}

beforeEach(() => {
  localStorage.clear();
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe('Portfolio page — empty state', () => {
  test('shows empty state message', () => {
    renderPortfolio();
    expect(screen.getByText(/your portfolio is empty/i)).toBeInTheDocument();
  });

  test('renders a Browse Stocks button', () => {
    renderPortfolio();
    expect(screen.getByRole('button', { name: /browse stocks/i })).toBeInTheDocument();
  });
});

// ── With holdings ─────────────────────────────────────────────────────────────

describe('Portfolio page — with holdings', () => {
  test('displays the holding symbol', () => {
    renderPortfolio([HOLDING]);
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0);
  });

  test('displays the company name', () => {
    renderPortfolio([HOLDING]);
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  test('displays the quantity', () => {
    renderPortfolio([HOLDING]);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('displays multiple holdings', () => {
    renderPortfolio([HOLDING, HOLDING_2]);
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TSLA').length).toBeGreaterThan(0);
  });

  test('does not show empty state when holdings exist', () => {
    renderPortfolio([HOLDING]);
    expect(screen.queryByText(/your portfolio is empty/i)).not.toBeInTheDocument();
  });
});

// ── Sell flow ─────────────────────────────────────────────────────────────────

describe('Portfolio page — sell flow', () => {
  test('sell panel opens when Sell button is clicked', () => {
    renderPortfolio([HOLDING]);
    fireEvent.click(screen.getByRole('button', { name: /sell/i }));
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  test('sell panel closes when Cancel is clicked', () => {
    renderPortfolio([HOLDING]);
    fireEvent.click(screen.getByRole('button', { name: /sell/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
  });

  test('selling all shares removes the holding', () => {
    renderPortfolio([HOLDING]);
    fireEvent.click(screen.getByRole('button', { name: /sell/i }));

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(screen.getByText(/your portfolio is empty/i)).toBeInTheDocument();
  });

  test('partial sell reduces the quantity', () => {
    renderPortfolio([HOLDING]);
    fireEvent.click(screen.getByRole('button', { name: /sell/i }));

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    // 10 - 3 = 7 remaining
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});

// ── Buy flow ──────────────────────────────────────────────────────────────────

describe('Portfolio page — buy flow', () => {
  test('buy panel opens when Buy button is clicked', () => {
    renderPortfolio([HOLDING]);
    fireEvent.click(screen.getByRole('button', { name: /^buy$/i }));
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  test('buying more shares increases the quantity', () => {
    renderPortfolio([HOLDING]);
    fireEvent.click(screen.getByRole('button', { name: /^buy$/i }));

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    // 10 + 5 = 15
    expect(screen.getByText('15')).toBeInTheDocument();
  });
});
