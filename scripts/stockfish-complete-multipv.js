const uciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/

export function completeMultiPv(rawLines, count = 5) {
  if (!Number.isSafeInteger(count) || count < 1) throw new TypeError('Invalid MultiPV count')
  let working = null, completed = null, actualNodes = 0, bestmove = null, completeBlocks = 0
  const latest = new Map()
  for (const raw of rawLines) {
    if (raw.startsWith('bestmove ')) bestmove = raw.split(/\s+/)[1]
    if (!raw.startsWith('info ')) continue
    actualNodes = Math.max(actualNodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
    const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (!score) continue
    if (/\b(?:lowerbound|upperbound)\b/.test(raw)) { working = null; continue }
    const line = { multipv: Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1),
      depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
      evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null,
      pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [],
      nodesAtScore: Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0), raw }
    latest.set(line.multipv, line)
    if (line.depth < 1 || !uciPattern.test(line.pv[0] ?? '')) { working = null; continue }
    if (line.multipv === 1) working = []
    if (!working || line.multipv !== working.length + 1 || line.multipv > count
      || working.length && line.depth !== working[0].depth
      || working.some(l => l.pv[0] === line.pv[0])) { working = null; continue }
    working.push(line)
    if (working.length === count) {
      completed = working
      completeBlocks++
      working = null
    }
  }
  return { lines: completed ?? [], completedDepth: completed?.[0].depth ?? null,
    nodesAtSnapshot: completed ? Math.max(...completed.map(l => l.nodesAtScore)) : null,
    latestLines: [...latest.values()].sort((a, b) => a.multipv - b.multipv),
    actualNodes, bestmove, completeBlocks,
    bestmoveMatchesSnapshot: Boolean(completed && bestmove === completed[0].pv[0]) }
}
