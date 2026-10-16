// Replay recorded searches through the fixed application; never start an engine.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView } from '../src/lib/analysisRefinement.js'
import { createAnalysisMetadata, analysisMetadataKey } from '../src/lib/analysisMetadata.js'

const prior = 'agent-output/new-refinement-measurement-v1'
const area = 'agent-output/confirmation-reuse-fix-v1'
const watched = new Map(), sha = b => createHash('sha256').update(b).digest('hex')
async function input(path) { const bytes = await readFile(path); watched.set(path, sha(bytes)); return JSON.parse(bytes) }
const changedModules = new Set(['src/lib/analysisRefinement.js', 'src/lib/sacrificeSearches.js', 'src/lib/gameArchive.js'])
const manifest = await input(`${prior}/manifest.json`)
for (const s of manifest.sources) {
  const bytes = await readFile(s.path)
  if (!changedModules.has(s.path)) assert.equal(sha(bytes), s.sha256, s.path)
  watched.set(s.path, sha(bytes))
}
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
const collection = await input(`${prior}/collection.json`), previous = await input(`${prior}/results.json`)
assert.equal(collection.complete, true)
const pool = new Map(), requests = [], missing = []
const key = (fen, metadata) => `${fen}|${analysisMetadataKey(metadata)}`
for (const p of collection.packets) {
  const path = `${prior}/${p.file}`, bytes = await readFile(path)
  assert.equal(sha(bytes), p.sha256, path)
  const packet = await input(path)
  pool.set(key(packet.fen, packet.engine.analysisMetadata), packet.engine)
}
for (let i = 0; i < 7; i++) {
  const p = await input(`agent-output/targeted-special-evidence-v1/search-${i}.json`)
  const engine = p.scope === 'forced-root-move' ? { ...p.engine,
    analysisMetadata: { ...p.engine.analysisMetadata, searchMoves: [p.uci] } } : p.engine
  pool.set(key(p.fen, engine.analysisMetadata), engine)
}
async function analyzePosition(fen, nodes, multiPv, options = {}) {
  const metadata = { ...createAnalysisMetadata({ nodes, multiPv }),
    ...(options.searchMoves ? { searchMoves: options.searchMoves } : {}) }
  const engine = pool.get(key(fen, metadata))
  if (!engine) { missing.push({ fen, nodes, multiPv, options }); throw Error('Required evidence not captured; no engine fallback') }
  requests.push({ fen, nodes, multiPv, options })
  return engine
}
const games = []
for (const game of previous.perGame) {
  const original = await input(`agent-output/new-references-200k-v1/game-${game.id}.json`)
  const entries = reclassifyReviewedMoves(original.liveEntries)
  games.push({ id: game.id, initial: entries, entries, rounds: [] })
}
const initialSnapshots = games.map(g => JSON.stringify(g.initial))
for (let round = 1; round <= previous.maxRounds; round++) for (const game of games) {
  const plan = buildRefinementPlan(game.entries)
  if (!plan.selectedPlies.length) continue
  const result = await refineGameEntries({ entries: game.entries, plan, analyzePosition })
  game.entries = result.entries
  game.rounds.push({ round, entries: game.entries, view: selectRefinementView(game.entries, true) })
  console.log(JSON.stringify({ game: game.id, round, replayedCalls: requests.length }))
}
const label = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale',
  missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const rows = [], proofChanges = []
for (const [i, game] of games.entries()) {
  assert.equal(JSON.stringify(game.initial), initialSnapshots[i])
  const current = selectRefinementView(game.entries, true)
  const old = await input(`${prior}/game-${game.id}-round-${game.rounds.length}.json`)
  const reopened = selectRefinementView(old.entries, true)
  assert.deepEqual(current.map(e => e.classification), reopened.map(e => e.classification), 'Existing archives must agree with fresh replay')
  for (const [index, entry] of current.entries()) {
    const before = previous.rows.find(r => r.game === game.id && r.ply === entry.ply)
    rows.push({ game: game.id, ply: entry.ply, san: entry.playedMove, expected: before.expected,
      initial: before.initial, before: before.final, after: label[entry.classification] })
    for (const proof of entry.sacrificeSearches ?? []) {
      const oldProof = old.entries[index].refinement?.sacrifices?.find(p => p.captureUci === proof.captureUci)
      const beforeNodes = oldProof?.confirmation?.analysisMetadata.budget.value
      const afterNodes = proof.confirmation?.analysisMetadata.budget.value
      if (beforeNodes !== afterNodes) proofChanges.push({ game: game.id, ply: entry.ply, san: entry.playedMove,
        captureUci: proof.captureUci, beforeNodes, afterNodes,
        beforeDepth: oldProof?.confirmation?.depth, afterDepth: proof.confirmation?.depth })
    }
  }
}
const summary = { total: rows.length, exactBefore: rows.filter(r => r.before === r.expected).length,
  exactAfter: rows.filter(r => r.after === r.expected).length,
  positiveChanges: rows.filter(r => r.before !== r.expected && r.after === r.expected).length,
  negativeChanges: rows.filter(r => r.before === r.expected && r.after !== r.expected).length,
  otherChanges: rows.filter(r => r.before !== r.after && r.before !== r.expected && r.after !== r.expected).length,
  cumulativePositive: rows.filter(r => r.initial !== r.expected && r.after === r.expected).length,
  cumulativeNegative: rows.filter(r => r.initial === r.expected && r.after !== r.expected).length }
assert.equal(rows.length, 262); assert.equal(missing.length, 0)
const target = rows.find(r => r.game === '184316820266' && r.ply === 41)
assert.equal(target.after, 'Geniale')
assert.ok(proofChanges.some(p => p.game === target.game && p.ply === target.ply && p.beforeNodes === 200000 && p.afterNodes === 1000000))
for (const [path, expected] of watched) assert.equal(sha(await readFile(path)), expected, path)
await mkdir(area, { recursive: true })
await writeFile(`${area}/results.json`, JSON.stringify({ newSearches: 0, reusedApplicationCalls: requests.length,
  frozenSources: lock.sources.length, summary, proofChanges, rows,
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(`${area}/report.md`, ['# Correzione del riuso delle conferme', '',
  `Nuove ricerche: zero. Callback applicative riprodotte dai raw già registrati: ${requests.length}.`,
  `Concordanza: ${summary.exactBefore}/${summary.total} prima, ${summary.exactAfter}/${summary.total} dopo.`,
  `Cambi positivi: ${summary.positiveChanges}; negativi: ${summary.negativeChanges}; altri cambi: ${summary.otherChanges}.`,
  `Rispetto all'analisi iniziale: ${summary.cumulativePositive} correzioni e ${summary.cumulativeNegative} regressioni.`, '',
  ...proofChanges.map(p => `- ${p.game}, ${p.san}: conferma ${p.beforeNodes} → ${p.afterNodes} nodi, profondità ${p.beforeDepth} → ${p.afterDepth}.`), '',
  'Verificati sia il flusso delle due richieste sia la riapertura delle analisi raccolte prima della correzione.',
  'I risultati originali restano immutati. Riferimenti usati solo per misurare, non per scegliere le prove.', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ summary, proofChanges, newSearches: 0 }, null, 2))
