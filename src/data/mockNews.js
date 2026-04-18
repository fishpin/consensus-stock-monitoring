/**
 * Mock financial news articles.
 * Each article optionally has a `relatedSymbols` array so the stock detail
 * page can filter relevant news.
 */
export const MOCK_NEWS = [
  {
    id: 'n1',
    headline: 'Apple surges on strong iPhone 16 demand in China',
    source: 'Reuters',
    publishedAt: '2026-04-16T09:30:00Z',
    summary: 'Apple shares climbed more than 1% after analysts raised shipment estimates for the iPhone 16 following better-than-expected sell-through data from China.',
    url: '#',
    imageUrl: 'https://placehold.co/600x300/1e293b/ffb300?text=AAPL+News',
    relatedSymbols: ['AAPL'],
    isBreaking: true,
  },
  {
    id: 'n2',
    headline: 'NVIDIA announces next-gen Blackwell Ultra GPUs for AI workloads',
    source: 'Bloomberg',
    publishedAt: '2026-04-16T08:15:00Z',
    summary: 'NVIDIA unveiled its Blackwell Ultra architecture, promising a 3× performance uplift for large language model training compared to the current Hopper generation.',
    url: '#',
    imageUrl: 'https://placehold.co/600x300/1e293b/ffb300?text=NVDA+News',
    relatedSymbols: ['NVDA'],
    isBreaking: true,
  },
  {
    id: 'n3',
    headline: 'Fed signals two rate cuts in 2026 as inflation cools',
    source: 'CNBC',
    publishedAt: '2026-04-16T07:00:00Z',
    summary: 'Federal Reserve officials indicated they expect two 25-basis-point rate reductions this year, boosting equities across the board and sending the S&P 500 to a record high.',
    url: '#',
    imageUrl: 'https://placehold.co/600x300/1e293b/ffb300?text=Market+News',
    relatedSymbols: ['SPY', 'JPM', 'V'],
    isBreaking: true,
  },
  {
    id: 'n4',
    headline: 'Tesla delivers record-breaking Q1 2026 numbers',
    source: 'Wall Street Journal',
    publishedAt: '2026-04-15T18:45:00Z',
    summary: 'Tesla reported Q1 2026 deliveries of 501,000 vehicles, surpassing Wall Street consensus of 478,000 and marking the company\'s highest quarterly delivery total.',
    url: '#',
    imageUrl: 'https://placehold.co/600x300/1e293b/ffb300?text=TSLA+News',
    relatedSymbols: ['TSLA'],
    isBreaking: false,
  },
  {
    id: 'n5',
    headline: 'Microsoft Azure revenue jumps 33% on AI cloud demand',
    source: 'Financial Times',
    publishedAt: '2026-04-15T16:30:00Z',
    summary: 'Microsoft\'s cloud division posted 33% year-over-year revenue growth, driven by enterprise adoption of Azure OpenAI services and Copilot integrations.',
    url: '#',
    imageUrl: 'https://placehold.co/600x300/1e293b/ffb300?text=MSFT+News',
    relatedSymbols: ['MSFT'],
    isBreaking: false,
  },
  {
    id: 'n6',
    headline: 'Alphabet beats earnings with Search and YouTube ad recovery',
    source: 'MarketWatch',
    publishedAt: '2026-04-15T14:00:00Z',
    summary: 'Alphabet reported Q1 EPS of $2.81, beating consensus of $2.59, with Google Search revenue growing 14% and YouTube ads up 21% year-over-year.',
    url: '#',
    imageUrl: 'https://placehold.co/600x300/1e293b/ffb300?text=GOOGL+News',
    relatedSymbols: ['GOOGL'],
    isBreaking: false,
  },
  {
    id: 'n7',
    headline: 'Amazon Web Services margin expands to record 38%',
    source: 'Barron\'s',
    publishedAt: '2026-04-15T11:30:00Z',
    summary: 'AWS operating margin reached 38% in Q1, its highest ever, as infrastructure cost efficiencies and custom silicon chips lowered compute costs.',
    url: '#',
    imageUrl: 'https://placehold.co/600x300/1e293b/ffb300?text=AMZN+News',
    relatedSymbols: ['AMZN'],
    isBreaking: false,
  },
  {
    id: 'n8',
    headline: 'Meta\'s Ray-Ban AI glasses sell 2 million units in Q1',
    source: 'TechCrunch',
    publishedAt: '2026-04-14T20:00:00Z',
    summary: 'Meta reported strong hardware momentum with its Ray-Ban smart glasses line surpassing two million quarterly unit sales for the first time.',
    url: '#',
    imageUrl: 'https://placehold.co/600x300/1e293b/ffb300?text=META+News',
    relatedSymbols: ['META'],
    isBreaking: false,
  },
];

/** Filter news relevant to a specific stock symbol */
export const getNewsBySymbol = (symbol) =>
  MOCK_NEWS.filter((n) => n.relatedSymbols.includes(symbol.toUpperCase()));

/** Get only breaking news items */
export const getBreakingNews = () => MOCK_NEWS.filter((n) => n.isBreaking);
