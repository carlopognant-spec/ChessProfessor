// Shared raw UCI verifier, extracted unchanged from holdout runner; no searches.
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { createMultiPvEvidence } from '../../src/lib/multiPvEvidence.js'
import { createAnalysisMetadata, analysisMetadataKey } from '../../src/lib/analysisMetadata.js'
const reserve = 5000
export const capturedSearchKey = (fen, nodes, multiPv, searchMoves) => fen + '|' + analysisMetadataKey({ ...createAnalysisMetadata({ nodes, multiPv }), ...(searchMoves ? { searchMoves } : {}) })

export function verifyCapturedSearch(packet) {
  const { fen, nodes, multiPv, searchMoves, engine, rawLines, bestmove, actualNodes } = packet
  assert.ok(Number.isSafeInteger(actualNodes) && actualNodes > 0 && actualNodes <= nodes + reserve)
  assert.equal(engine.fen, fen); assert.equal(engine.bestmove, bestmove); assert.equal(engine.actualNodes, actualNodes)
  assert.equal(engine.analysisMetadata.engine.actualEngineId, 'Stockfish 19 WASM')
  assert.equal(capturedSearchKey(fen, nodes, multiPv, searchMoves), `${fen}|${analysisMetadataKey(engine.analysisMetadata)}`)
  const board = new Chess(fen), legal = board.moves({ verbose: true }).map(m => m.from + m.to + (m.promotion ?? ''))
  assert.ok(legal.includes(bestmove)); if (searchMoves) { assert.equal(searchMoves.length, 1); assert.equal(bestmove, searchMoves[0]) }
  const snapshot = createMultiPvEvidence(Math.min(multiPv, searchMoves?.length ?? legal.length)), latest = new Map()
  let rawNodes = 0, rawBest
  for (const raw of rawLines) {
    snapshot.accept(raw); rawNodes = Math.max(rawNodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
    const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (raw.startsWith('info ') && score && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
      const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
      latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
        evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null,
        pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
    }
    if (raw.startsWith('bestmove ')) rawBest = raw.split(/\s+/)[1]
  }
  assert.equal(rawNodes, actualNodes); assert.equal(rawBest, bestmove)
  assert.deepEqual([...latest.values()].sort((a, b) => a.multipv - b.multipv), engine.lines)
  assert.deepEqual(snapshot.finish(bestmove), engine.specialLines)
  assert.ok(engine.lines.length)
  for (const line of [...engine.lines, ...engine.specialLines]) {
    assert.ok(Number.isFinite(line.evalCp) || Number.isInteger(line.mate)); assert.ok(line.pv.length)
    if (searchMoves) assert.ok(searchMoves.includes(line.pv[0]))
    const replay = new Chess(fen)
    for (const u of line.pv) { assert.match(u, /^[a-h][1-8][a-h][1-8][qrbn]?$/); replay.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }) }
  }
}
