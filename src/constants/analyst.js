export const ANALYST_THRESHOLDS = {
  STRONG_BUY: 65,
  BUY:        45,
  SELL:       45,
};

export function getConsensusLabel(buyPct, sellPct) {
  if (buyPct >= ANALYST_THRESHOLDS.STRONG_BUY) return 'Strong Buy';
  if (buyPct >= ANALYST_THRESHOLDS.BUY)        return 'Buy';
  if (sellPct >= ANALYST_THRESHOLDS.SELL)      return 'Sell';
  return 'Hold';
}
