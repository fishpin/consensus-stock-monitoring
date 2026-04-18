# Consensus

A social stock monitoring platform built with React and Vite. Consensus combines real-time market data with community discussion — letting users track stocks, manage a portfolio, and chat with other investors in live rooms.

**Live demo:** [consensus-stock-monitoring-4sstmb9l8-fishpins-projects.vercel.app](consensus-stock-monitoring-4sstmb9l8-fishpins-projects.vercel.app)

---

## Features

- **Market overview** — live ticker with breaking news, top movers table, and sentiment indicators
- **Watchlist** — add and remove stocks, track performance at a glance
- **Stock detail** — price history chart, fundamentals, analyst ratings, and community sentiment
- **Portfolio** — track holdings with buy/sell panels, P&L per position, and allocation breakdown
- **Chat** — real-time room-based messaging powered by CometChat, with room creation and message history

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 + CSS Modules |
| Charts | Recharts |
| HTTP | Axios |
| Stock data | Alpha Vantage API |
| Chat | CometChat SDK v4 |
| Testing | Jest + React Testing Library |

---

## Getting started

### Prerequisites

- Node.js 18+
- A free [Alpha Vantage](https://www.alphavantage.co/support/#api-key) API key
- A free [CometChat](https://app.cometchat.com) account with an app created

### Install

```bash
git clone https://github.com/your-username/consensus.git
cd consensus
npm install
```

### Configure environment variables

Create a `.env` file in the project root:

```
VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key

VITE_COMETCHAT_APP_ID=your_cometchat_app_id
VITE_COMETCHAT_REGION=your_cometchat_region
VITE_COMETCHAT_AUTH_KEY=your_cometchat_auth_key
```

> **Alpha Vantage**: if the key is omitted or set to `demo`, the app automatically falls back to built-in mock data. All pages remain fully functional.
>
> **CometChat**: find your App ID, Region, and Auth Key in the CometChat dashboard under **API & Auth Keys**. The app automatically falls back to built-in mock data.

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project structure

```
src/
├── components/        # Shared UI components (StockCard, NewsCard, …)
├── constants/         # App-wide constants (routes, analyst ratings, trading)
├── context/           # AppContext — global state (watchlist, portfolio, rooms)
├── data/              # Mock data (stocks, news, chat, sentiment, analysts)
├── pages/
│   ├── Landing/       # Market overview + breaking news
│   ├── Watchlist/     # Saved stocks
│   ├── StockDetail/   # Chart, fundamentals, analyst ratings
│   ├── Portfolio/     # Holdings, buy/sell, performance
│   └── Chat/          # Real-time rooms
├── services/
│   ├── stockAPI.js    # Alpha Vantage wrapper with mock fallback
│   └── chatAPI.js     # CometChat wrapper (init, auth, groups, messages)
├── utils/
│   └── formatters.js  # Shared formatting helpers
└── index.css          # Design tokens + global utility classes
```

---

## Testing

```bash
npm test
```

Tests cover core components and flows (routing, context, search, stock cards, watchlist, portfolio, chat, and page rendering) using Jest and React Testing Library.

---

## Design notes

The UI follows a flat editorial aesthetic inspired by the finance section of newspapers. Layout uses a consistent grid with Tailwind spacing tokens. Global utility classes (`.data-table`, `.section-label`, `.btn-icon`, etc.) are defined at zero specificity using `:where()` so CSS Modules can override them without `!important`.
