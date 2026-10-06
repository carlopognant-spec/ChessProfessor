export const ENGINE_CONFIG = {
  defaultDepth: 12,
  fallbackDepth: 8,
  multiPv: 5,
  // Retained Explorer setting; Libro now uses the local opening repertoire.
  explorerMinGames: 20,
  explorerThreshold: 15,
  maxAnalysisEntries: 250,
  classification: {
    // Maximum loss in percentage points; initial policy, not fitted to fixtures.
    best: 1,
    excellent: 3,
    good: 5,
    inaccuracy: 10,
    mistake: 20,
  },
}
