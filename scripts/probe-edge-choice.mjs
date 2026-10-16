import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { edgeChoicePotential } from './qa/edge-choice.mjs'
import { nativeAlternativeFen } from '../src/lib/nativeEvidence.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { verifyCapturedSearch } from './qa/verify-captured-search.mjs'
const area = 'agent-output/native-edge-study-v1', mode = process.argv[2]
assert(['--prepare', '--run', '--replay'].includes(mode))
const hash = b => createHash('sha256').update(b).digest('hex'), sources = new Map()
const read = async p => { const b = await readFile(p); sources.set(p, hash(b)); return b }
const json = async p => JSON.parse(await read(p))
const save = (name, data) => writeFile(`${area}/${name}`, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
if (mode === '--prepare') {
  await mkdir(area)
  const baseline = await json('agent-output/legal-major-integration-v1/classifier-verification.json')
  assert(baseline.result.passed && !baseline.candidate)
  for (const s of baseline.sources) assert.equal(hash(await read(s.path)), s.sha256, s.path)
  const v22 = await json('agent-output/native-winning-integration-v1/verification.json')
  const actual = new Map(v22.rows.map(r => [`${r.cohort}:${r.game}:${r.ply}`, r.actual]))
  for (const r of [...baseline.result.improvements, ...baseline.result.regressions, ...baseline.result.otherChanges]) actual.set(`${r.cohort}:${r.game}:${r.ply}`, r.actual)
  const { cases } = await json('agent-output/review-automation/prepared.json'), selected = [], schedule = new Map()
  let inspected = 0, potentialCount = 0
  for (const c of cases) for (const [i, entry] of c.entries.entries()) {
    inspected++
    const potential = edgeChoicePotential(entry, c.entries[i - 1], c.entries[i - 2])
    if (!potential) continue
    potentialCount++
    // Current classifications select *new* work. Expected labels do not select searches.
    if (actual.get(`${c.cohort}:${c.id}:${entry.ply}`) !== 'Migliore') continue
    const alternatives = potential.root.specialLines.slice(1).map(l => ({ uci: l.pv[0], fen: nativeAlternativeFen(entry, l.pv[0]) }))
    selected.push({ game: c.id, cohort: c.cohort, ply: entry.ply, alternatives })
    for (const a of alternatives) if (!schedule.has(a.fen)) schedule.set(a.fen, { ...a, index: schedule.size, nodes: 1000000, multiPv: 5 })
  }
  for (const p of ['scripts/probe-edge-choice.mjs', 'scripts/qa/edge-choice.mjs', 'scripts/qa/captured-node-search.js', 'scripts/qa/verify-captured-search.mjs', 'scripts/qa/native-engine.js', 'scripts/qa/wasm-engine.cjs', 'node_modules/stockfish/bin/stockfish-19-single.js', 'node_modules/stockfish/bin/stockfish-19-single.wasm']) await read(p)
  await save('protocol.json', { developmentOnly: true, independentValidation: false, productionChanged: false,
    hypothesis: 'A new forcing decision is the only top-five choice maintaining an expected-score advantage, strictly across the symmetric half boundary, with independently corroborated alternative children. Existing material-realization exclusions apply. No new fitted score bands.',
    referenceLabelsUsedForSelection: false, inspected, potentialCount, selected, schedule: [...schedule.values()],
    nodes: 1000000, searches: schedule.size, cap: schedule.size * 1005000, retries: 0, threads: 1, hashMb: 16, clearHashPerSearch: true,
    sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) })
  console.log(JSON.stringify({ inspected, potentialCount, selected, searches: schedule.size, cap: schedule.size * 1005000 }))
  process.exit(0)
}
const protocol = await json(`${area}/protocol.json`)
const check = async () => { for (const s of protocol.sources) assert.equal(hash(await readFile(s.path)), s.sha256, s.path) }
await check()
let engine, actualNodes = 0
const records = []
if (mode === '--run') {
  try { await access(`${area}/started.json`); throw Error('Already started; no retry') } catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { started: new Date().toISOString(), cap: protocol.cap })
  try {
    const { NativeEngine } = await import('./qa/native-engine.js')
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('./qa/wasm-engine.cjs', import.meta.url)), fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url))])
    await engine.init(); assert.equal(engine.version, 'Stockfish 19 WASM')
    for (const t of protocol.schedule) {
      assert(actualNodes + t.nodes + 5000 <= protocol.cap)
      const packet = await capturedNodeSearch(engine, t.fen, t.nodes, 5); verifyCapturedSearch(packet)
      actualNodes += packet.actualNodes
      const path = `${area}/search-${t.index}.json`
      await writeFile(path, JSON.stringify(packet, null, 2) + '\n', { flag: 'wx' })
      records.push({ index: t.index, path, sha256: hash(await readFile(path)) })
      console.log(JSON.stringify({ completed: records.length, total: protocol.searches, actualNodes }))
    }
  } finally { engine?.close() }
  await check(); assert(actualNodes <= protocol.cap)
  await save('collection.json', { complete: true, records, actualNodes, cap: protocol.cap })
} else {
  const collection = await json(`${area}/collection.json`)
  assert(collection.complete && collection.records.length === protocol.searches)
  for (const r of collection.records) {
    const b = await readFile(r.path); assert.equal(hash(b), r.sha256)
    const p = JSON.parse(b); verifyCapturedSearch(p); actualNodes += p.actualNodes
  }
  assert.equal(actualNodes, collection.actualNodes); await check()
  await save('replay-check.json', { passed: true, positions: collection.records.length, actualNodes, newEngineSearches: 0 })
}
console.log(JSON.stringify({ passed: true, mode, actualNodes }))
