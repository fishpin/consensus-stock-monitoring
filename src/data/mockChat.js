/**
 * Mock chat rooms and seed messages.
 * Each room is tied to a stock symbol or a general market topic.
 */

export const MOCK_ROOMS = [
  { id: 'room-AAPL',   symbol: 'AAPL',  name: 'AAPL — Apple Inc.',    topic: 'Discuss Apple stock, earnings, and product news.' },
  { id: 'room-MSFT',   symbol: 'MSFT',  name: 'MSFT — Microsoft',     topic: 'Microsoft earnings, Azure cloud, AI strategy.' },
  { id: 'room-GOOGL',  symbol: 'GOOGL', name: 'GOOGL — Alphabet',     topic: 'Google Search, YouTube, and cloud discussion.' },
  { id: 'room-TSLA',   symbol: 'TSLA',  name: 'TSLA — Tesla Inc.',    topic: 'Tesla deliveries, Cybertruck, and EV market.' },
  { id: 'room-NVDA',   symbol: 'NVDA',  name: 'NVDA — NVIDIA',        topic: 'AI chips, Blackwell, data center trends.' },
  { id: 'room-market', symbol: null,    name: 'General Market',        topic: 'Macro economics, Fed policy, market outlook.' },
  { id: 'room-crypto', symbol: null,    name: 'Crypto & Web3',         topic: 'Bitcoin, Ethereum, and digital asset discussion.' },
];

const SEED_USERS = ['Alex_T', 'Maria_K', 'DaveInvests', 'QuietBull', 'TechWatcher', 'ValueHunter'];

function seedMessage(roomId, user, text, minutesAgo, imageUrl = null) {
  return {
    id:        `${roomId}-${minutesAgo}`,
    roomId,
    user,
    text,
    imageUrl,
    timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    likes:     Math.floor(Math.random() * 20),
  };
}

export const MOCK_MESSAGES = [
  seedMessage('room-AAPL',   SEED_USERS[0], 'China demand numbers look really strong. I think we retest $200 this month.', 45),
  seedMessage('room-AAPL',   SEED_USERS[1], 'Agreed — services revenue is the real story. 20%+ growth YoY is insane.', 38),
  seedMessage('room-AAPL',   SEED_USERS[2], 'Anyone playing the earnings call with options?', 30),
  seedMessage('room-AAPL',   SEED_USERS[3], 'Long shares, no options for me. Too much theta decay with VIX elevated.', 22),

  seedMessage('room-NVDA',   SEED_USERS[4], 'Blackwell Ultra is a monster upgrade. Data center backlog is insane.', 60),
  seedMessage('room-NVDA',   SEED_USERS[0], 'Margins are the question — will we see compression as competition heats up?', 50),
  seedMessage('room-NVDA',   SEED_USERS[5], 'AMD is years behind. NVDA has a moat with CUDA that won\'t disappear overnight.', 35),

  seedMessage('room-TSLA',   SEED_USERS[1], '501k deliveries is strong but the stock already priced it in.', 90),
  seedMessage('room-TSLA',   SEED_USERS[2], 'FSD revenue recognition is the real catalyst to watch in Q2.', 75),
  seedMessage('room-TSLA',   SEED_USERS[3], 'Energy division is underrated — PowerWall demand is exploding.', 60),

  seedMessage('room-market', SEED_USERS[4], 'Two rate cuts priced in — risk-on mode activated', 120),
  seedMessage('room-market', SEED_USERS[5], 'Careful with the euphoria. PCE is still above target.', 100),
  seedMessage('room-market', SEED_USERS[0], 'Small caps should benefit the most from rate cuts. Looking at IWM.', 80),
  seedMessage('room-market', SEED_USERS[1], 'Rotation from growth to value? Or does AI keep driving mega-cap outperformance?', 55),
];

/** Get messages for a specific room, sorted oldest-first */
export const getMessagesByRoom = (roomId) =>
  MOCK_MESSAGES
    .filter((m) => m.roomId === roomId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
