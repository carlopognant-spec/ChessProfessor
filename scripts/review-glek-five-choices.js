import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Chess } from 'chess.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

const dir = 'agent-output/glek-five-choices-v1'
const original = JSON.parse(await readFile(`${dir}/results.json`, 'utf8'))
const hash = b => createHash('sha256').update(b).digest('hex')
for (const s of original.sources) if (hash(await readFile(s.path)) !== s.sha256) throw Error(`Source changed: ${s.path}`)
const records = await Promise.all(Array.from({ length: 13 }, (_, i) => readFile(`${dir}/search-${String(i).padStart(2, '0')}.json`, 'utf8').then(JSON.parse)))
const reconstructed = records.map(r => {
  const evidence = createMultiPvEvidence(5)
  let matching = []
  for (const raw of r.rawLines) {
    evidence.accept(raw)
    const completed = evidence.finish(r.bestmove)
    if (completed.length) matching = completed
  }
  return { ...r, engine: { ...r.engine, specialLines: matching } }
})
const engines = Object.fromEntries(reconstructed.map(r => [r.key, r.engine]))
const game = new Chess(), fens = [game.fen()]
for (const m of ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'g3', 'Nxe4', 'Nxe4', 'd5', 'Nc3', 'd4']) { game.move(m); fens.push(game.fen()) }
const rows = []
for (const san of ['Qe2', 'd3', 'Bd3', 'Bb5', 'Bg2']) {
  const g = new Chess(game.fen()), move = g.move(san), after = g.fen(); g.move('dxc3')
  const accepted = g.fen(), variants = {}
  for (const scope of ['standard', 'targeted']) {
    const own = { ply: 11, playedMove: 'Nc3', playedUci: 'e4c3', fenBefore: fens[10], fenAfter: fens[11], classification: 'unclassified' }
    const previous = classifyReviewedMove({ ply: 12, playedMove: 'd4', playedUci: 'd5d4', fenBefore: fens[11], fenAfter: fens[12],
      engine: engines.history, playedEngine: engines.standard, isBookMove: false })
    const entry = { ply: 13, playedMove: san, playedUci: `${move.from}${move.to}`, fenBefore: fens[12], fenAfter: after,
      engine: engines[scope], playedEngine: engines[`after-${san}`], isBookMove: false }
    const next = { ply: 14, playedMove: 'dxc3', playedUci: 'd4c3', fenBefore: after, fenAfter: accepted,
      engine: engines[`after-${san}`], playedEngine: engines[`accepted-${san}`], isBookMove: false }
    const target = reclassifyReviewedMoves([own, previous, entry, next])[2]
    variants[scope] = { classification: target.classification, numerical: target.numericalClassification,
      bestEval: target.bestEval, playedEval: target.playedEval, dropPct: target.dropPct,
      evidence: target.evaluationEvidence, brilliant: target.specialAssessment.brilliant }
  }
  rows.push({ san, expected: san === 'Bg2' ? 'best' : 'brilliant', ...variants })
}
const summary = { newSearches: 0, productionChanged: false,
  standardExact: rows.filter(r => r.standard.classification === r.expected).length,
  targetedExact: rows.filter(r => r.targeted.classification === r.expected).length,
  snapshots: reconstructed.map(r => ({ key: r.key, original: r.engine === records[r.i].engine,
    originalDepth: records[r.i].engine.specialLines[0]?.depth ?? null, matchingDepth: r.engine.specialLines[0]?.depth ?? null })) }
await writeFile(`${dir}/offline-review.json`, JSON.stringify({ summary, rows }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ summary, rows: rows.map(r => ({ san: r.san, standard: r.standard.classification,
  targeted: r.targeted.classification, reason: r.targeted.brilliant.reason, base: r.targeted.numerical, drop: r.targeted.dropPct })) }, null, 2))
