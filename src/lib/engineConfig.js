export const ENGINE_CONFIG = {
  defaultDepth: 12,
  // Unused legacy setting: no consumer in src, scripts or tests applies a fallback depth.
  fallbackDepth: 8,
  multiPv: 5,
  // Unused legacy setting: Libro uses the local repertoire, not an Explorer game minimum.
  explorerMinGames: 20,
  // Active: stop Explorer requests below this total game count; does not classify Libro.
  explorerThreshold: 15,
  maxAnalysisEntries: 250,
  // Provisional local policy, not Chess.com's rating-dependent model.
  missedOpportunity: {
    winningProbability: 0.75,
    nonWinningProbability: 0.60,
  },
  classification: {
    // Maximum loss in percentage points; initial policy, not fitted to fixtures.
    best: 1,
    excellent: 3,
    good: 5,
    inaccuracy: 10,
    mistake: 20,
  },
}
