import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StockCard from '../components/StockCard/StockCard';

const mockStock = {
  symbol:        'AAPL',
  name:          'Apple Inc.',
  price:         189.84,
  change:        2.41,
  changePercent: 1.29,
  history:       [],
};

const negativeStock = {
  symbol:        'TSLA',
  name:          'Tesla Inc.',
  price:         171.05,
  change:        -4.32,
  changePercent: -2.46,
  history:       [],
};

function renderCard(stock = mockStock) {
  return render(
    <MemoryRouter>
      <table><tbody>
        <StockCard stock={stock} onExpand={() => {}} onWatchToggle={() => {}} />
      </tbody></table>
    </MemoryRouter>
  );
}

// Also used by interaction tests
function renderCardWith({ stock = mockStock, expanded = false, onExpand = () => {}, onWatchToggle = () => {}, isWatched = false } = {}) {
  return render(
    <MemoryRouter>
      <table><tbody>
        <StockCard stock={stock} expanded={expanded} onExpand={onExpand} onWatchToggle={onWatchToggle} isWatched={isWatched} />
      </tbody></table>
    </MemoryRouter>
  );
}

describe('StockCard', () => {
  test('displays the stock symbol', () => {
    renderCard();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  test('displays the stock name', () => {
    renderCard();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  test('displays the formatted price', () => {
    renderCard();
    expect(screen.getByText('$189.84')).toBeInTheDocument();
  });

  test('shows a positive change percentage with a + prefix', () => {
    renderCard();
    expect(screen.getByText(/\+1\.29/)).toBeInTheDocument();
  });

  test('shows a negative change percentage without a + prefix', () => {
    renderCard(negativeStock);
    expect(screen.getByText(/-2\.46/)).toBeInTheDocument();
  });

  test('is a button for keyboard accessibility', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /add to watchlist/i })).toBeInTheDocument();
  });
});

// ── Interactions ──────────────────────────────────────────────────────────────

describe('StockCard — interactions', () => {
  test('clicking the row calls onExpand with the stock symbol', () => {
    const onExpand = jest.fn();
    renderCardWith({ onExpand });
    fireEvent.click(screen.getByRole('button', { name: /click to expand/i }));
    expect(onExpand).toHaveBeenCalledWith('AAPL');
  });

  test('clicking an expanded row calls onExpand with null', () => {
    const onExpand = jest.fn();
    renderCardWith({ expanded: true, onExpand });
    fireEvent.click(screen.getByRole('button', { name: /click to collapse/i }));
    expect(onExpand).toHaveBeenCalledWith(null);
  });

  test('clicking the watch button calls onWatchToggle', () => {
    const onWatchToggle = jest.fn();
    renderCardWith({ onWatchToggle });
    fireEvent.click(screen.getByRole('button', { name: /add to watchlist/i }));
    expect(onWatchToggle).toHaveBeenCalled();
  });

  test('shows Remove from watchlist label when isWatched is true', () => {
    renderCardWith({ isWatched: true });
    expect(screen.getByRole('button', { name: /remove from watchlist/i })).toBeInTheDocument();
  });

  test('shows loading state in expanded row when no overview provided', () => {
    renderCardWith({ expanded: true, overview: null });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
