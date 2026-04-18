import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import Navbar  from './components/Layout/Navbar';
import Footer  from './components/Layout/Footer';
import './App.css';

const Landing     = lazy(() => import('./pages/Landing/Landing'));
const StockDetail = lazy(() => import('./pages/StockDetail/StockDetail'));
const Watchlist   = lazy(() => import('./pages/Watchlist/Watchlist'));
const Portfolio   = lazy(() => import('./pages/Portfolio/Portfolio'));
const Chat        = lazy(() => import('./pages/Chat/Chat'));

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Suspense fallback={<div className="page-loading" />}>
          <Routes>
            <Route path={ROUTES.HOME}      element={<Landing />} />
            <Route path={ROUTES.STOCK}     element={<StockDetail />} />
            <Route path={ROUTES.WATCHLIST} element={<Watchlist />} />
            <Route path={ROUTES.PORTFOLIO} element={<Portfolio />} />
            <Route path={ROUTES.CHAT}      element={<Chat />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
