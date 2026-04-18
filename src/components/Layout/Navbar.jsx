import { NavLink } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useApp } from '../../context/AppContext';
import SearchBar from '../SearchBar/SearchBar';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { to: ROUTES.HOME,      label: 'Home' },
  { to: ROUTES.WATCHLIST, label: 'Watchlist' },
  { to: ROUTES.PORTFOLIO, label: 'Portfolio' },
  { to: ROUTES.CHAT,      label: 'Chat' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useApp();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to={ROUTES.HOME} className={styles.logo}>
          <img src="/img/Consensus-logo.svg" alt="Consensus logo" className={styles.logoImg} />
        </NavLink>

        <nav className={styles.nav}>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.HOME}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.search}>
          <SearchBar placeholder="Search…" />
        </div>

        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}
