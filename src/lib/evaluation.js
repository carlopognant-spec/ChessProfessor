function normalizeScore(score, side = 'white') {
  if (score == null || Number.isNaN(score)) return null
  return side === 'black' ? -score : score
}

export function normalizeEvalToWhite(evalCp, side = 'white') {
  return normalizeScore(evalCp, side)
}

export function calculateWinProbability(evalCp, side = 'white') {
  const value = normalizeEvalToWhite(evalCp, side)

  if (value == null) return 0.5

  const clamped = Math.max(-1000, Math.min(1000, value))
  const x = clamped / 400
  const probability = 1 / (1 + Math.exp(-x))

  return Math.min(0.99, Math.max(0.01, probability))
}

export function moverWinProb({
  evalCp = null,
  mate = null,
} = {}) {
  if (mate != null && !Number.isNaN(mate)) {
    if (mate === 0) return 0.99
    return mate > 0 ? 0.99 : 0.01
  }

  if (evalCp == null || Number.isNaN(evalCp)) return 0.5

  const clamped = Math.max(-1000, Math.min(1000, evalCp))
  const x = clamped / 400
  const probability = 1 / (1 + Math.exp(-x))

  return Math.min(0.99, Math.max(0.01, probability))
}

export function formatMateLabel(mate) {
  const absolute = Math.abs(mate ?? 0)
  return `M${absolute}`
}
