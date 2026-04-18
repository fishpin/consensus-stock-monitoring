import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchBar from '../components/SearchBar/SearchBar';

function renderSearchBar() {
  return render(
    <MemoryRouter>
      <SearchBar />
    </MemoryRouter>
  );
}

describe('SearchBar', () => {
  test('renders input with placeholder', () => {
    renderSearchBar();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  test('shows suggestions when a matching query is typed', () => {
    renderSearchBar();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Apple' } });
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  test('shows no suggestions for unrecognised query', () => {
    renderSearchBar();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'ZZZZNOTREAL' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('clears suggestions when query is empty', () => {
    renderSearchBar();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('accepts a custom placeholder prop', () => {
    render(
      <MemoryRouter>
        <SearchBar placeholder="Find a ticker…" />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Find a ticker…')).toBeInTheDocument();
  });
});
