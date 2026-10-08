import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifyMissedOpportunity } from '../src/lib/missedOpportunity.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { classifySimpleSpecial } from './stockfish-specials-simple.js'
import { filterPredictedContinuation, CONTINUATION_POLICY } from './stockfish-specials-continuation.js'

const root = new URL('../', import.meta.url), sources = [], rows = []
const base = 'tests/fixtures/qa/', folder = base + 'analysis-cache-large-200k/2026-10-07T09-51-26-999Z/'
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const labels = { book: 'Libro', brilliant: 'Geniale', great: 'Grande', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root))
  sources.push({ path, sha256: hash(bytes) })
  return JSON.parse(bytes)
}
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
for (const id of ids) {
  const fixture = await input(base + id + '.json'), cache = await input(folder + id + '.json')
  if (fixture.pgn !== cache.pgn || cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000
    || cache.multiPv !== 5 || cache.scorePerspective !== 'side-to-move at each FEN') throw Error('Incompatible cache')
  const full = new Chess(); full.loadPgn(fixture.pgn)
  const moves = full.history(), game = new Chess(), history = []
  if (moves.length !== cache.entries.length) throw Error('Incomplete cache')
  let previous = null, bookActive = true
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.ply !== index + 1 || entry.fenBefore !== game.fen() || entry.san !== moves[index]) throw Error('Cache chain mismatch')
    const move = game.move(entry.san), playedUci = `${move.from}${move.to}${move.promotion ?? ''}`
    if (entry.fenAfter !== game.fen() || entry.uci !== playedUci) throw Error('Cache move mismatch')
    const deliveredMate = game.isCheckmate(), isBookMove = bookActive && !deliveredMate && book.hasPosition(entry.fenAfter)
    if (!isBookMove) bookActive = false
    const numerical = classifyAnalysisEntries([{ ...entry, isBookMove,
      ...moveEvaluationFields(entry.engine, entry.playedEngine, playedUci, { isCheckmate: deliveredMate }) }])[0]
    const common = classifyMissedOpportunity(numerical, previous)
    const candidate = classifySimpleSpecial(common, previous)
    history.push({ numerical, candidate })
    const filtered = filterPredictedContinuation(history)
    const expected = fixture.annotations.find(a => a.ply === entry.ply)
    if (!expected || expected.san !== entry.san) throw Error('Invalid annotation')
    rows.push({ gameId: id, group: id.startsWith('personal') ? 'development' : 'historical', ply: entry.ply, san: entry.san,
      expected: expected.category, base: labels[common.classification], v1: labels[candidate.classification], v2: labels[filtered.classification],
      v1Reason: candidate.specialReason, v2Reason: filtered.specialReason, continuation: filtered.continuation,
      excluded: expected.category === 'Forzata' || deliveredMate })
    previous = numerical
  }
}
// Verify the recomputed v1 against its original result, without using it in either detector.
const prior = await input('agent-output/stockfish-specials-simple-2026-10-07T19-25-40-871Z/results.json')
if (prior.rows.length !== rows.length) throw Error('Original baseline length mismatch')
for (const [index, row] of rows.entries()) {
  const old = prior.rows[index]
  if (row.gameId !== old.gameId || row.ply !== old.ply || row.v1 !== old.predicted || row.expected !== old.expected || row.base !== old.base) throw Error('Original v1 did not reproduce')
}
function metrics(group, version) {
  const own = rows.filter(r => !r.excluded && (group === 'all' || r.group === group))
  return { group, version, included: own.length, matches: own.filter(r => r[version] === r.expected).length,
    categories: ['Grande', 'Geniale'].map(category => {
      const assigned = own.filter(r => r[version] === category), expected = own.filter(r => r.expected === category)
      const tp = assigned.filter(r => r.expected === category).length
      return { category, expected: expected.length, assigned: assigned.length, tp, fp: assigned.length - tp, fn: expected.length - tp,
        precision: assigned.length ? tp / assigned.length : null, recall: expected.length ? tp / expected.length : null }
    }) }
}
for (const source of sources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source modified')
const changes = rows.filter(r => r.v1 !== r.v2)
const summary = { policy: CONTINUATION_POLICY, searchesExecuted: 0, sourceHashesUnchanged: true, originalV1Reproduced: true,
  appIntegration: false, independentValidation: false, plies: rows.length, changes: changes.length,
  correctedFalsePositives: changes.filter(r => r.v1 !== r.expected && r.v2 === r.expected).length,
  lostTruePositives: changes.filter(r => r.v1 === r.expected && r.v2 !== r.expected).length,
  metrics: ['development', 'historical', 'all'].flatMap(group => ['v1', 'v2'].map(version => metrics(group, version))) }
const directory = new URL(`agent-output/stockfish-specials-continuation-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, changes, rows, sources }, null, 2) + '\n', { flag: 'wx' })
const report = ['# Esperimento sul completamento di tattiche', '',
  'Protocollo: ../stockfish-specials-continuation-v1-protocol.md. Soglie v1 invariate, zero nuove ricerche motore. V1 riprodotta esattamente prima del confronto.', '',
  '| Gruppo | Versione | Categoria | TP | FP | FN |', '|---|---|---|---:|---:|---:|',
  ...summary.metrics.flatMap(g => g.categories.map(c => `| ${g.group} | ${g.version} | ${c.category} | ${c.tp} | ${c.fp} | ${c.fn} |`)), '',
  `Cambiamenti: ${changes.length}; falsi positivi corretti: ${summary.correctedFalsePositives}; veri positivi persi: ${summary.lostTruePositives}.`, '',
  '## Tutti i cambiamenti', '', '| Partita | Ply | SAN | Atteso | V1 | V2 | Punto iniziale | Prefisso previsto |', '|---|---:|---|---|---|---|---|---|',
  ...changes.map(r => `| ${r.gameId} | ${r.ply} | ${r.san} | ${r.expected} | ${r.v1} | ${r.v2} | ${r.continuation.previousPly}: ${r.continuation.previousMove} | ${r.continuation.prefix.join(' ')} |`), '',
  'Nessuna validazione indipendente. Cache, app e file precedenti invariati. .env e partite 7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun nuovo commit/push.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, changes }, null, 2))
