// Bounded development diagnosis. New packets remain separate from app archives.
import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'

const area = 'agent-output/grande-comparison-probe-v1'
const mode = process.argv[2]
assert(['--prepare', '--run', '--replay'].includes(mode), 'Use --prepare, --run once, or --replay')
const sha = b => createHash('sha256').update(b).digest('hex')
const parse = async p => JSON.parse(await readFile(p, 'utf8'))
const save = (name, value) => writeFile(`${area}/${name}`, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const definitions = [
  ['refined', '185262315732', 37, 'false-positive'],
  ['refined', '184316820266', 21, 'false-positive'],
  ['refined', '184316820266', 34, 'missing-capture'],
  ['refined', '185230271130', 16, 'missing-capture'],
  ['refined', '185230271130', 39, 'missing-capture'],
  ['old', 'personal-06', 31, 'incomplete-evidence'],
  ['old', 'game-1-chigorin-steinitz-1892', 43, 'incomplete-evidence'],
  ['old', 'game-2-saintamant-staunton-1843', 80, 'incomplete-evidence'],
]
const cohortsPath = 'agent-output/special-evidence-dossier-v1/cohorts.json'
const baselinePath = 'agent-output/rule-precedence-audit-v1/verification.json'
const { cases } = await parse(cohortsPath)
const baseline = await parse(baselinePath)
assert(baseline.passed && baseline.version === 'counterfactual-v15')
const targets = definitions.map(([cohort, game, ply, question], target) => {
  const c = cases.find(c => c.cohort === cohort && c.id === game)
  const entry = c?.entries.find(e => e.ply === ply)
  assert(entry && entry.ply === ply)
  return { target, cohort, game, ply, question, san: entry.playedMove, uci: entry.playedUci,
    before: entry.fenBefore, after: entry.fenAfter }
})
const schedule = targets.flatMap(t => ['before', 'after'].map(side => ({
  search: t.target * 2 + Number(side === 'after'), target: t.target, side, fen: t[side],
  nodes: 1000000, multiPv: 5, scope: 'full-position',
})))
assert.equal(schedule.length, 16)
assert.equal(new Set(schedule.map(t => t.fen)).size, 16)
const cap = 16080000
if (mode === '--prepare') {
  await mkdir(area)
  const sources = []
  const watch = async path => sources.push({ path, sha256: sha(await readFile(path)) })
  async function tree(path) {
    for (const e of await readdir(path, { withFileTypes: true })) {
      if (e.isDirectory()) await tree(`${path}/${e.name}`)
      else if (e.isFile()) await watch(`${path}/${e.name}`)
    }
  }
  await tree('src')
  for (const path of [cohortsPath, baselinePath, 'scripts/probe-grande-comparisons.mjs',
    'scripts/qa/captured-node-search.js', 'scripts/qa/native-engine.js', 'scripts/qa/wasm-engine.cjs',
    'node_modules/stockfish/package.json', 'node_modules/stockfish/bin/stockfish-19-single.js',
    'node_modules/stockfish/bin/stockfish-19-single.wasm', 'node_modules/chess.js/dist/cjs/chess.js']) await watch(path)
  const frozen = await parse('agent-output/specials-frozen-candidate-v1.json')
  for (const s of frozen.sources) {
    assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
    if (!sources.some(p => p.path === s.path)) sources.push(s)
  }
  for (const s of baseline.sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
  await save('protocol.json', { date: '2026-10-15', version: 'counterfactual-v15', developmentOnly: true,
    independentValidation: false, engine: 'Stockfish 19 WASM large-single', threads: 1, hashMb: 16,
    clearHashPerSearch: true, targets, schedule, nominalNodes: 16000000, cap,
    retries: 0, extraSearches: 0, sources,
    questions: [
      'Do new complete snapshots preserve the best move, alternatives and false promotions?',
      'Do missing captures still require a new rule after equal-budget evidence?',
      'Do coherent snapshots alone resolve legacy cases or expose a rule limitation?',
    ],
    interpretation: 'Evidence-only diagnostic. No production change or threshold search. No overall accuracy claim from selected positions. Full comparison records corrections and regressions, including adjacent history effects.',
  })
  console.log(JSON.stringify({ prepared: true, targets: targets.length, searches: 16, cap }))
  process.exit(0)
}
const protocol = await parse(`${area}/protocol.json`)
assert.deepEqual(targets, protocol.targets)
assert.deepEqual(schedule, protocol.schedule)
const verify = async () => { for (const s of protocol.sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path) }
await verify()
let engine, actualNodes = 0
const packets = []
if (mode === '--run') {
  try { await access(`${area}/started.json`); throw Error('Run already started; no retry') }
  catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { started: new Date().toISOString(), searches: 16, cap })
  try {
    const { NativeEngine } = await import('./qa/native-engine.js')
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('./qa/wasm-engine.cjs', import.meta.url)),
      fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url))])
    await engine.init()
    assert.equal(engine.version, 'Stockfish 19 WASM')
    for (const task of schedule) {
      assert(actualNodes + task.nodes + 5000 <= cap)
      const packet = { ...task, ...await capturedNodeSearch(engine, task.fen, task.nodes, task.multiPv) }
      assert(packet.actualNodes > 0 && packet.actualNodes <= task.nodes + 5000)
      actualNodes += packet.actualNodes
      await save(`search-${task.search}.json`, packet)
      packets.push(packet)
      console.log(JSON.stringify({ completed: packets.length, total: 16, actualNodes }))
    }
  } finally { engine?.close() }
} else {
  for (const task of schedule) {
    const packet = await parse(`${area}/search-${task.search}.json`)
    for (const field of ['fen', 'nodes', 'multiPv', 'side', 'scope', 'search', 'target']) assert.equal(packet[field], task[field])
    const evidence = createMultiPvEvidence(Math.min(task.multiPv, new Chess(task.fen).moves().length))
    for (const line of packet.rawLines) evidence.accept(line)
    assert.deepEqual(evidence.finish(packet.bestmove), packet.engine.specialLines)
    assert(packet.actualNodes > 0 && packet.actualNodes <= task.nodes + 5000)
    actualNodes += packet.actualNodes
    packets.push(packet)
  }
}
assert(actualNodes <= cap)
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const base = new Map(baseline.rows.map(r => [`${r.cohort}:${r.game}:${r.ply}`, r]))
const original = JSON.stringify(cases), projected = [], targetResults = []
const line = (fen, raw) => {
  const board = new Chess(fen), side = board.turn(), values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
  const material = () => board.board().flat().filter(Boolean).reduce((n, p) => n + (p.color === side ? 1 : -1) * values[p.type], 0)
  const initial = material(), san = [], events = []
  for (const uci of raw.pv) {
    assert.match(uci, /^[a-h][1-8][a-h][1-8][qrbn]?$/)
    const m = board.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    san.push(m.san); events.push({ san: m.san, captured: m.captured ?? null, delta: material() - initial })
  }
  return { ...raw, san, events, finalFen: board.fen(), finalMaterialDelta: material() - initial,
    index: raw.mate == null ? calculateWinProbability(raw.evalCp) : Number(raw.mate > 0) }
}
for (const c of cases) {
  const replacements = targets.filter(t => t.cohort === c.cohort && t.game === c.id)
  const modified = c.entries.map(e => {
    const t = replacements.find(t => t.ply === e.ply)
    if (!t) return e
    const [root, child] = packets.filter(p => p.target === t.target)
    assert(root.side === 'before' && child.side === 'after')
    return { ...e, engine: root.engine, playedEngine: child.engine }
  })
  const reviewed = reclassifyReviewedMoves(modified)
  for (const [i, e] of reviewed.entries()) {
    const before = base.get(`${c.cohort}:${c.id}:${e.ply}`)
    assert(before && before.expected === c.expected[i])
    projected.push({ cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove, expected: c.expected[i], before: before.after,
      after: labels[e.classification], targeted: replacements.some(t => t.ply === e.ply) })
    const target = replacements.find(t => t.ply === e.ply)
    if (target) targetResults.push({ ...target, expected: c.expected[i], before: before.after, after: labels[e.classification],
      numerical: e.numericalClassification, evaluation: e.evaluationEvidence, grande: e.specialAssessment?.grande,
      brilliant: e.specialAssessment?.brilliant, context: e.specialAssessment?.context,
      roots: (e.engine.specialLines ?? []).map(l => line(e.fenBefore, l)),
      child: (e.playedEngine.specialLines ?? []).map(l => line(e.fenAfter, l)),
    })
  }
}
assert.equal(projected.length, 1116)
assert.equal(JSON.stringify(cases), original)
const changes = projected.filter(r => r.before !== r.after)
const summaries = ['initial', 'refined', 'old'].map(cohort => {
  const rows = projected.filter(r => r.cohort === cohort), cc = changes.filter(r => r.cohort === cohort)
  return { cohort, before: rows.filter(r => r.before === r.expected).length, after: rows.filter(r => r.after === r.expected).length,
    corrected: cc.filter(r => r.after === r.expected).length, regressed: cc.filter(r => r.before === r.expected).length,
    other: cc.filter(r => r.before !== r.expected && r.after !== r.expected).length }
})
const result = { developmentOnly: true, applicationChanged: false, newSearches: 16, actualNodes, cap,
  independentValidation: false, summaries, changes, targets: targetResults }
await verify()
if (mode === '--replay') {
  assert.deepEqual(result, await parse(`${area}/results.json`))
  await save('replay-check.json', { passed: true, engineStarted: false, packets: 16, actualNodes, classifications: 1116 })
} else await save('results.json', result)
console.log(JSON.stringify({ mode, actualNodes, summaries, targets: targetResults.map(t => ({ game: t.game, ply: t.ply, move: t.san, before: t.before,
  after: t.after, expected: t.expected, reason: t.grande?.reason })) }))
