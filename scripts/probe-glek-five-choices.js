import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { SPECIAL_POLICY } from '../src/lib/specialClassification.js'

const root = new URL('../', import.meta.url), area = new URL('agent-output/glek-five-choices-v1/', root)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => readFile(new URL(path, root))
const save = (name, data) => writeFile(new URL(name, area), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'g3', 'Nxe4', 'Nxe4', 'd5', 'Nc3', 'd4']
const game = new Chess(), fens = [game.fen()]
for (const san of moves) { game.move(san); fens.push(game.fen()) }
const choices = ['Qe2', 'd3', 'Bd3', 'Bb5', 'Bg2'].map(san => {
  const g = new Chess(game.fen()), m = g.move(san), after = g.fen(); g.move('dxc3')
  return { san, uci: `${m.from}${m.to}`, after, accepted: g.fen() }
})
const tasks = [{ key: 'history', fen: fens[11] }, { key: 'standard', fen: fens[12] },
  { key: 'targeted', fen: fens[12], searchMoves: choices.map(c => c.uci) },
  ...choices.map(c => ({ key: `after-${c.san}`, fen: c.after })),
  ...choices.map(c => ({ key: `accepted-${c.san}`, fen: c.accepted }))]
  .map((t, i) => ({ ...t, i, nodes: 200000, multiPv: 5 }))
const lock = JSON.parse(await read('agent-output/specials-frozen-candidate-v1.json'))
const extra = ['scripts/probe-glek-five-choices.js', 'agent-output/glek-five-choices-v1/protocol.md',
  'src/lib/reviewEvaluation.js', 'src/lib/reviewMoves.js', 'src/lib/specialClassification.js',
  'src/lib/sacrificeEvidence.js', 'src/lib/materialRealization.js', 'src/lib/moveOpportunities.js',
  'src/lib/multiPvEvidence.js', 'src/lib/analysisMetadata.js', 'scripts/qa/native-engine.js',
  'scripts/qa/wasm-engine.cjs', 'node_modules/stockfish/package.json']
const sources = [...lock.sources, ...await Promise.all(extra.map(async path => ({ path, sha256: hash(await read(path)) })))]
async function verify(list = sources) {
  for (const s of list) if (hash(await read(s.path)) !== s.sha256) throw Error(`Source changed: ${s.path}`)
}
await verify()
if (process.argv[2] === '--prepare') {
  await mkdir(area, { recursive: true })
  await save('manifest.json', { date: '2026-10-12', policy: SPECIAL_POLICY.version, moves, tasks,
    packageVersion: '19.0.0', nominalNodes: 2600000, cap: 2665000, reserve: 5000, sources })
  console.log('Prepared: thirteen searches, nominal 2,600,000 nodes; no engine started.')
} else if (process.argv[2] === '--run') {
  const manifest = JSON.parse(await read('agent-output/glek-five-choices-v1/manifest.json'))
  if (JSON.stringify(manifest.tasks) !== JSON.stringify(tasks) || manifest.policy !== SPECIAL_POLICY.version
    || manifest.nominalNodes !== 2600000 || manifest.cap !== 2665000 || manifest.reserve !== 5000) throw Error('Manifest mismatch')
  await verify(manifest.sources)
  if (JSON.parse(await read('node_modules/stockfish/package.json')).version !== '19.0.0') throw Error('Engine package mismatch')
  try { await access(new URL('started.json', area)); throw Error('Already started: automatic rerun forbidden') }
  catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { startedAt: new Date().toISOString() })
  let engine, actualNodes = 0
  const records = []
  try {
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)),
      fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
    await engine.init()
    if (engine.version !== 'Stockfish 19 WASM') throw Error('Unexpected engine')
    for (const task of tasks) {
      if (actualNodes + task.nodes + manifest.reserve > manifest.cap) throw Error('Budget exhausted')
      await engine.request(['ucinewgame', 'setoption name Clear Hash', 'setoption name MultiPV value 5', 'isready'],
        line => line === 'readyok' ? true : undefined)
      const evidence = createMultiPvEvidence(5), latest = new Map(), rawLines = []
      let nodes = 0
      const bestmove = await engine.request([`position fen ${task.fen}`,
        `go nodes ${task.nodes}${task.searchMoves ? ` searchmoves ${task.searchMoves.join(' ')}` : ''}`], raw => {
        rawLines.push(raw); evidence.accept(raw)
        nodes = Math.max(nodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
        const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
        if (raw.startsWith('info ') && score && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
          const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
          latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
            evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null,
            pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
        }
        if (raw.startsWith('bestmove ')) return raw.split(/\s+/)[1]
      })
      const lines = [...latest.values()].sort((a, b) => a.multipv - b.multipv)
      const result = { ...lines[0], lines, fen: task.fen, bestmove, specialLines: evidence.finish(bestmove),
        analysisMetadata: createAnalysisMetadata(), ...(task.searchMoves ? { searchMoves: task.searchMoves } : {}) }
      const record = { ...task, actualNodes: nodes, bestmove, rawLines, engine: result }
      await save(`search-${String(task.i).padStart(2, '0')}.json`, record); records.push(record); actualNodes += nodes
      if (!nodes || actualNodes > manifest.cap || !lines.length) throw Error('Invalid telemetry')
      const legal = new Chess(task.fen).moves({ verbose: true }).map(m => `${m.from}${m.to}${m.promotion ?? ''}`)
      if (!legal.includes(bestmove) || task.searchMoves && !task.searchMoves.includes(bestmove)) throw Error('Invalid bestmove')
      console.log(JSON.stringify({ searched: task.i + 1, key: task.key, totalNodes: actualNodes }))
    }
    await verify()
    const engines = Object.fromEntries(records.map(r => [r.key, r.engine]))
    const sanPV = (fen, line) => {
      if (!line) return null
      const g = new Chess(fen)
      return { evalCp: line.evalCp, depth: line.depth, mate: line.mate,
        san: line.pv.map(u => g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san) }
    }
    const rows = []
    for (const choice of choices) {
      const own = { ply: 11, playedMove: 'Nc3', playedUci: 'e4c3', fenBefore: fens[10], fenAfter: fens[11], classification: 'unclassified' }
      const previous = classifyReviewedMove({ ply: 12, playedMove: 'd4', playedUci: 'd5d4', fenBefore: fens[11],
        fenAfter: fens[12], engine: engines.history, playedEngine: engines.standard, isBookMove: false })
      const next = { ply: 14, playedMove: 'dxc3', playedUci: 'd4c3', fenBefore: choice.after,
        fenAfter: choice.accepted, engine: engines[`after-${choice.san}`], playedEngine: engines[`accepted-${choice.san}`], isBookMove: false }
      const variants = {}
      for (const scope of ['standard', 'targeted']) {
        const entry = { ply: 13, playedMove: choice.san, playedUci: choice.uci, fenBefore: fens[12], fenAfter: choice.after,
          engine: engines[scope], playedEngine: engines[`after-${choice.san}`], isBookMove: false }
        const target = reclassifyReviewedMoves([own, previous, entry, next])[2]
        variants[scope] = { classification: target.classification, numerical: target.numericalClassification,
          bestUci: target.bestUci, bestEval: target.bestEval, playedEval: target.playedEval, dropPct: target.dropPct,
          evidence: target.evaluationEvidence, brilliant: target.specialAssessment.brilliant }
      }
      const after = engines[`after-${choice.san}`], acceptance = after.specialLines.find(l => l.pv[0] === 'd4c3')
        ?? after.lines.find(l => l.pv[0] === 'd4c3')
      rows.push({ san: choice.san, expected: choice.san === 'Bg2' ? 'best' : 'brilliant', ...variants,
        acceptance: sanPV(choice.after, acceptance), afterAcceptance: sanPV(choice.accepted, engines[`accepted-${choice.san}`].lines[0]) })
    }
    const summary = { policy: SPECIAL_POLICY.version, newSearches: records.length, actualNodes, nominalNodes: 2600000,
      sourceHashesUnchanged: true, appChanged: false, independentAccuracyValidation: false,
      standardBest: engines.standard.bestmove, targetedBest: engines.targeted.bestmove,
      standardExact: rows.filter(r => r.standard.classification === r.expected).length,
      targetedExact: rows.filter(r => r.targeted.classification === r.expected).length }
    await save('results.json', { summary, rows, rootStandard: engines.standard, rootTargeted: engines.targeted, sources })
    console.log(JSON.stringify({ summary, rows: rows.map(r => ({ san: r.san, expected: r.expected,
      standard: r.standard.classification, targeted: r.targeted.classification,
      reason: r.targeted.brilliant.reason, best: r.targeted.bestEval, played: r.targeted.playedEval,
      accepted: r.acceptance?.evalCp, acceptedPV: r.acceptance?.san.slice(0, 6) })) }, null, 2))
  } catch (e) {
    await save('failure.json', { message: e.message, actualNodes, savedSearches: records.length }); throw e
  } finally { engine?.close() }
} else throw Error('Use --prepare or --run')
