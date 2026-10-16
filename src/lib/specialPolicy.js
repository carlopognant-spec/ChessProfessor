// Fixed local score-index bands, shared by special and opportunity evidence.
// These are not calibrated human winning probabilities.
export const SPECIAL_POLICY = Object.freeze({ version: 'counterfactual-v24',
  good: 0.45, poor: 0.35, winning: 0.75, nonWinning: 0.60,
  gap: 0.20, consistency: 0.10, sacrificeLoss: 2 })
