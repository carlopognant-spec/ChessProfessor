// Experimental branch A: same numeric boundaries, decision-relevant envelope.
export function branchA(roots, playedUci, legalCount) {
  if (legalCount < 2) return { status: 'rejected', reason: 'only-legal-move' }
  const own = roots.find(r => r.uci === playedUci)
  if (!own) return { status: 'incomplete', reason: 'missing-played-root' }
  const envelope = scores => ({ low: Math.min(...scores.map(s => s.evalCp)) - 50, high: Math.max(...scores.map(s => s.evalCp)) + 50 })
  let incomplete = roots.length !== legalCount
  const bounds = []
  for (const r of [own, ...roots.filter(r => r !== own)]) {
    const role = r === own ? 'played' : 'alternative'
    if (!r.scores.length) { incomplete = true; continue }
    if (r.scores.some(s => !s || s.mate != null || s.bound || !Number.isFinite(s.evalCp))) return { status: 'abstained', reason: 'insufficient-score', failedRoot: r.uci }
    const range = envelope(r.scores)
    if (role === 'played' && range.low < 0) return { status: 'rejected', reason: 'played-below-guard', failedRoot: r.uci, ...range }
    if (role === 'alternative' && range.high > -200) return { status: 'rejected', reason: 'alternative-above-guard', failedRoot: r.uci, ...range }
    if (r.scores.length !== 2) incomplete = true
    bounds.push({ role, uci: r.uci, ...range })
  }
  if (incomplete) return { status: 'incomplete', reason: 'missing-roots-or-second-budget', bounds }
  const low = bounds.find(r => r.role === 'played').low
  const high = Math.max(...bounds.filter(r => r.role === 'alternative').map(r => r.high))
  return { status: low-high >= 200 ? 'verified-experimental' : 'rejected', reason: low-high >= 200 ? 'verified-branch-a' : 'insufficient-gap', guardedGapCp: low-high, bounds }
}
