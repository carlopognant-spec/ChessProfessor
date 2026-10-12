// Keep the latest complete iteration for each first choice. A partial final
// iteration can return an earlier choice after another move briefly led.
// Never splice scores from different iterations or select a snapshot by score.
export function createMultiPvEvidence(count) {
  if (!Number.isSafeInteger(count) || count < 1) throw new RangeError('Invalid MultiPV count')
  let working = null
  const completed = new Map()
  return {
    accept(raw) {
      if (!raw.startsWith('info ')) return
      const match = raw.match(/\bscore (cp|mate) (-?\d+)/)
      if (!match) return
      if (/\b(?:upperbound|lowerbound)\b/.test(raw)) { working = null; return }
      const line = { multipv: Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1),
        depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
        evalCp: match[1] === 'cp' ? Number(match[2]) : null,
        mate: match[1] === 'mate' ? Number(match[2]) : null,
        pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw }
      if (line.multipv === 1) working = []
      if (!working || line.depth < 1 || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(line.pv[0] ?? '')
        || line.multipv !== working.length + 1 || line.multipv > count
        || working.length && working[0].depth !== line.depth
        || working.some(other => other.pv[0] === line.pv[0])) { working = null; return }
      working.push(line)
      if (working.length === count) {
        const first = working[0].pv[0]
        completed.delete(first)
        completed.set(first, working)
        if (completed.size > 256) completed.delete(completed.keys().next().value)
        working = null
      }
    },
    finish(bestmove) {
      return completed.get(bestmove) ?? []
    },
  }
}
