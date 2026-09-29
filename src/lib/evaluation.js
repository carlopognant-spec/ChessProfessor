function normalizeScore(score, side = 'white') {
  if (score == null || Number.isNaN(score)) return null
  return side === 'black' ? -score : score
}

export function normalizeEvalToWhite(evalCp, side = 'white') {
  return normalizeScore(evalCp, side)
}

export function normalizeMateScore(mate, side = 'white') {
  return normalizeScore(mate, side)
}

export function calculateWinProbability(evalCp, side = 'white') {
  const value = normalizeEvalToWhite(evalCp, side)

  if (value == null) return 0.5

  const clamped = Math.max(-1000, Math.min(1000, value))
  const x = clamped / 400
  const probability = 1 / (1 + Math.exp(-x))

  return Math.min(0.99, Math.max(0.01, probability))
}

export function formatMateLabel(mate) {
  const absolute = Math.abs(mate ?? 0)
  return `M${absolute}`
}
