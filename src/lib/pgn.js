export function parsePgnMoves(pgn = '') {
  if (typeof pgn !== 'string') return []

  let cleaned = pgn
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/;.*$/gm, ' ')
    .replace(/\d+\s*\.(?:\.)?/g, ' ')
    .replace(/\$\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return []

  const tokens = cleaned.match(/[A-Za-z0-9+#!=?:\-]+/g) ?? []
  return tokens.filter((token) => !/^\d+$/.test(token))
}
