import { Chess } from 'chess.js'
import { createMultiPvEvidence } from '../../src/lib/multiPvEvidence.js'
import { createAnalysisMetadata } from '../../src/lib/analysisMetadata.js'

// Caller must fix and enforce the run budget before invoking this helper.
export async function capturedNodeSearch(engine, fen, nodes, multiPv = 5) {
  const count = Math.min(multiPv, new Chess(fen).moves().length)
  if (!count || !Number.isSafeInteger(nodes) || nodes < 1) throw Error('Invalid captured search')
  await engine.request(['ucinewgame', 'setoption name Clear Hash', `setoption name MultiPV value ${multiPv}`, 'isready'],
    line => line === 'readyok' ? true : undefined)
  const evidence = createMultiPvEvidence(count), latest = new Map(), rawLines = []
  let actualNodes = 0
  const bestmove = await engine.request([`position fen ${fen}`, `go nodes ${nodes}`], raw => {
    rawLines.push(raw); evidence.accept(raw)
    actualNodes = Math.max(actualNodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
    const match = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (raw.startsWith('info ') && match && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
      const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
      latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
        evalCp: match[1] === 'cp' ? Number(match[2]) : null, mate: match[1] === 'mate' ? Number(match[2]) : null,
        pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
    }
    if (raw.startsWith('bestmove ')) return raw.split(/\s+/)[1]
  })
  const lines = [...latest.values()].sort((a, b) => a.multipv - b.multipv)
  return { fen, nodes, multiPv, rawLines, actualNodes, bestmove,
    engine: { ...lines[0], lines, specialLines: evidence.finish(bestmove), bestmove, fen, actualNodes,
      analysisMetadata: createAnalysisMetadata({ nodes, multiPv, actualEngineId: engine.version }) } }
}
