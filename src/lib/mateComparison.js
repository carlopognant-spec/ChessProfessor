// Signed mate scores are from the mover's perspective. Independent child
// scores have already been inverted by evaluationFields. A winning child
// score needs one extra move to count from the pre-move root (SF UCI rounding).
export function compareMateDistance({ bestMate, playedMate, evaluationSource } = {}) {
  if (playedMate === 0) return { outcome: 'delivered', change: null, bestMoves: null, playedMoves: 0, source: 'checkmate' }
  if (![bestMate, playedMate].every(value => Number.isInteger(value) && value !== 0)) return null
  if (Math.sign(bestMate) !== Math.sign(playedMate)) return null
  if (!['root-pv', 'independent-position'].includes(evaluationSource)) return null
  const bestMoves = Math.abs(bestMate)
  const playedMoves = Math.abs(playedMate) + (evaluationSource === 'independent-position' && playedMate > 0 ? 1 : 0)
  const change = playedMoves === bestMoves ? 'unchanged' : playedMoves < bestMoves ? 'accelerated' : 'delayed'
  return { outcome: bestMate > 0 ? 'winning' : 'losing', change, bestMoves, playedMoves, source: evaluationSource }
}

export function formatMateComparison(comparison) {
  if (!comparison) return ''
  if (comparison.outcome === 'delivered') return 'Matto dato.'
  const outcome = comparison.outcome === 'winning' ? 'Matto vincente' : 'Matto subito'
  const change = { unchanged: 'distanza invariata', accelerated: 'anticipato', delayed: 'rallentato' }[comparison.change]
  const source = comparison.source === 'independent-position' ? ' Stime da analisi separate.' : ''
  return `${outcome}: ${comparison.bestMoves} → ${comparison.playedMoves} mosse (${change}).${source}`
}

export function formatAnalysisScore(evalCp, mate, { delivered = false } = {}) {
  if (delivered) return 'Matto dato'
  if (Number.isInteger(mate) && mate !== 0) return `${mate > 0 ? 'Matto vincente' : 'Matto subito'} in ${Math.abs(mate)}`
  return Number.isFinite(evalCp) ? `Eval ${(evalCp / 100).toFixed(2)}` : 'Eval n/d'
}
