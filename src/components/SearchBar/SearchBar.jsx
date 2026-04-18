import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { MOCK_STOCKS } from '../../data/mockStocks';
import { stockPath } from '../../constants/routes';
import { SEARCH_RESULTS_LIMIT, BLUR_DELAY_MS } from '../../constants/app';
import styles from './SearchBar.module.css';

/**
 * Autocomplete search bar.
 * Filters the stock list by symbol or name and navigates to the detail page.
 */
export default function SearchBar({ placeholder = 'Search stocks by name or symbol…' }) {
  const [query, setQuery]         = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const lower = value.toLowerCase();
    const matches = MOCK_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(lower) ||
        s.name.toLowerCase().includes(lower)
    ).slice(0, SEARCH_RESULTS_LIMIT);

    setSuggestions(matches);
  }

  function handleSelect(symbol) {
    setQuery('');
    setSuggestions([]);
    navigate(stockPath(symbol));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelect(suggestions[0].symbol);
    }
  }

  function handleBlur() {
    // Small delay so click on suggestion registers first
    setTimeout(() => setSuggestions([]), BLUR_DELAY_MS);
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit} role="search">
        <Search size={14} className={styles.icon} aria-hidden="true" />
        <input
          className={styles.input}
          type="search"
          value={query}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label="Search stocks"
          autoComplete="off"
        />
      </form>

      {suggestions.length > 0 && (
        <ul className={styles.dropdown} role="listbox" aria-label="Search suggestions">
          {suggestions.map((stock) => (
            <li key={stock.symbol}>
              <button
                className={styles.suggestion}
                onMouseDown={() => handleSelect(stock.symbol)}
                role="option"
              >
                <span className={styles.suggSymbol}>{stock.symbol}</span>
                <span className={styles.suggName}>{stock.name}</span>
                <span className={styles.suggPrice}>${stock.price.toFixed(2)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
