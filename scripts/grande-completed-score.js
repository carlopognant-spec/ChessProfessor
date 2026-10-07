// A bound from an unfinished iteration never overwrites a completed score.
// "Completed" means UCI score without a bound; it is still an engine estimate.
export function completedRootScore(rawLines, expectedUci) {
  let completed = null, latest = null
  for (const raw of rawLines) {
    if (!raw.startsWith('info ')) continue
    const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (!score) continue
    const pv = raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? []
    const value = {
      evalCp: score[1] === 'cp' ? Number(score[2]) : null,
      mate: score[1] === 'mate' ? Number(score[2]) : null,
      bound: /\b(?:lowerbound|upperbound)\b/.test(raw),
      depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
      nodesAtScore: Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0), pv, raw,
    }
    latest = value
    const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
    if (!value.bound && multipv === 1 && pv[0] === expectedUci && value.depth > 0) completed = value
  }
  return { completed, latest }
}
