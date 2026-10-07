export const GRANDE_POLICY = Object.freeze({ guardCp: 50, maxOscillationCp: 50, minimumPlayedCp: 0, maximumAlternativeCp: -200, minimumGapCp: 200 })
export function rootFailure(score, role) {
  if (!score || score.mate != null || score.bound || !Number.isFinite(score.evalCp)) return 'insufficient-score'
  if (role === 'played' && score.evalCp - 50 < 0) return 'played-below-guard'
  if (role === 'alternative' && score.evalCp + 50 > -200) return 'alternative-above-guard'
  return null
}
export function pairFailure(a, b, role) {
  const first = rootFailure(a, role) ?? rootFailure(b, role)
  if (first) return first
  return Math.abs(a.evalCp - b.evalCp) > 50 ? 'unstable-score' : null
}
export function completeDecision(played, alternatives, legalCount) {
  if (legalCount < 2 || alternatives.length !== legalCount - 1) return { verified: false, reason: 'incomplete-coverage' }
  const ownFailure = pairFailure(...played, 'played')
  if (ownFailure) return { verified: false, reason: ownFailure }
  for (const pair of alternatives) {
    const failure = pairFailure(...pair, 'alternative')
    if (failure) return { verified: false, reason: failure }
  }
  const low = Math.min(...played.map(s => s.evalCp)) - 50
  const highest = Math.max(...alternatives.map(p => Math.max(...p.map(s => s.evalCp)) + 50))
  return { verified: low - highest >= 200, reason: low - highest >= 200 ? 'verified-under-experimental-policy' : 'insufficient-gap', lowerPlayedCp: low, upperBestAlternativeCp: highest, guardedGapCp: low - highest }
}
