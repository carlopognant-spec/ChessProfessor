import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifyMissedOpportunity } from '../src/lib/missedOpportunity.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { classifySimpleSpecial, SIMPLE_SPECIALS_POLICY } from './stockfish-specials-simple.js'
import { selectRootSnapshot } from './stockfish-specials-root-reuse.js'

const root = new URL('../', import.meta.url)
const fixtureDirectory = 'tests/fixtures/qa/'
const cacheDirectory = fixtureDirectory + 'analysis-cache-large-200k/2026-10-07T09-51-26-999Z/'
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const sources = [], rows = []
const hash = data => createHash('sha256').update(data).digest('hex')
async function input(path) {
  const data = await readFile(new URL(path, root))
  sources.push({ path, sha256: hash(data) })
  return JSON.parse(data)
}
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
const labels = { book: 'Libro', brilliant: 'Geniale', great: 'Grande', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
for (const id of ids) {
  const fixture = await input(fixtureDirectory + id + '.json')
  const cache = await input(cacheDirectory + id + '.json')
  if (cache.pgn !== fixture.pgn || cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000
    || cache.multiPv !== 5 || cache.scorePerspective !== 'side-to-move at each FEN') throw Error('Incompatible source cache')
  const loaded = new Chess(); loaded.loadPgn(fixture.pgn)
  const moves = loaded.history(), game = new Chess()
  if (moves.length !== cache.entries.length) throw Error('Incomplete cache')
  let previous = null, previousCached = null, bookActive = true
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.ply !== index + 1 || entry.fenBefore !== game.fen() || entry.san !== moves[index]) throw Error('Invalid cache chain')
    const move = game.move(entry.san)
    const playedUci = `${move.from}${move.to}${move.promotion ?? ''}`
    if (entry.fenAfter !== game.fen() || playedUci !== entry.uci) throw Error('Invalid cached move')
    const deliveredMate = game.isCheckmate()
    const isBookMove = bookActive && !deliveredMate && book.hasPosition(entry.fenAfter)
    if (!isBookMove) bookActive = false
    const selected = selectRootSnapshot(entry, previousCached)
    const selectedEntry = { ...entry, engine: selected.engine }
    const numerical = classifyAnalysisEntries([{ ...selectedEntry, isBookMove,
      ...moveEvaluationFields(selected.engine, entry.playedEngine, playedUci, { isCheckmate: deliveredMate }) }])[0]
    const common = classifyMissedOpportunity(numerical, previous)
    const result = classifySimpleSpecial(common, previous)
    // Expected annotations are read only after the detector has returned.
    const expected = fixture.annotations.find(a => a.ply === entry.ply)
    if (!expected || expected.san !== entry.san) throw Error('Invalid reference annotation')
    rows.push({ gameId: id, group: id.startsWith('personal') ? 'development' : 'historical', ply: entry.ply, san: entry.san,
      expected: expected.category, base: labels[common.classification], predicted: labels[result.classification],
      rootSource: selected.source, rootChanged: selected.changed, special: result.special, status: result.specialStatus, reason: result.specialReason, evidence: result.specialEvidence,
      isBookMove, deliveredMate, excluded: expected.category === 'Forzata' || deliveredMate })
    previous = numerical
    previousCached = entry
  }
}
const original = await input('agent-output/stockfish-specials-simple-2026-10-07T19-25-40-871Z/results.json')
if (original.rows.length !== rows.length) throw Error('Original result length mismatch')
for (const [index, row] of rows.entries()) {
  const old = original.rows[index]
  if (row.gameId !== old.gameId || row.ply !== old.ply || row.expected !== old.expected) throw Error('Reference identity mismatch')
  row.originalBase = old.base
  row.originalPredicted = old.predicted
  row.originalReason = old.reason
}
function metrics(group) {
  const own = rows.filter(r => group === 'all' || r.group === group)
  const eligible = own.filter(r => !r.excluded)
  const categories = ['Grande', 'Geniale'].map(category => {
    const assigned = eligible.filter(r => r.predicted === category)
    const positives = eligible.filter(r => r.expected === category)
    const tp = assigned.filter(r => r.expected === category).length
    const fp = assigned.length - tp, fn = positives.length - tp
    return { category, expected: positives.length, assigned: assigned.length, tp, fp, fn,
      precision: assigned.length ? tp / assigned.length : null, recall: positives.length ? tp / positives.length : null,
      expectedOutsideFilter: positives.filter(r => r.reason === 'protected-or-not-best').length,
      expectedInsufficient: positives.filter(r => r.status === 'insufficient').length }
  })
  const reasonCounts = Object.fromEntries([...new Set(own.map(r => r.reason))].sort().map(reason => [reason, own.filter(r => r.reason === reason).length]))
  return { group, plies: own.length, included: eligible.length, excluded: own.length - eligible.length,
    originalMatches: eligible.filter(r => r.originalPredicted === r.expected).length,
    commonClassificationChanges: eligible.filter(r => r.originalBase !== r.base).length,
    beforeMatches: eligible.filter(r => r.base === r.expected).length,
    afterMatches: eligible.filter(r => r.predicted === r.expected).length,
    categories, reasonCounts }
}
for (const source of sources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source modified')
const summary = { policy: SIMPLE_SPECIALS_POLICY, experiment: 'same-fen-root-reuse-v1', searchesExecuted: 0, sourceHashesUnchanged: true,
  rootReplacements: rows.filter(r => r.rootChanged).length, changes: rows.filter(r => r.originalPredicted !== r.predicted).length,
  corrected: rows.filter(r => r.originalPredicted !== r.expected && r.predicted === r.expected).length,
  lostMatches: rows.filter(r => r.originalPredicted === r.expected && r.predicted !== r.expected).length,
  appIntegration: false, independentValidation: false, groups: ['development', 'historical', 'all'].map(metrics) }
const directory = new URL(`agent-output/stockfish-specials-root-reuse-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, rows, sources }, null, 2) + '\n', { flag: 'wx' })
const percent = value => value == null ? 'n/d' : `${(100 * value).toFixed(1)}%`
const report = ['# Classificatore semplice Stockfish — primo risultato', '',
  'Protocollo: ../stockfish-specials-root-reuse-v1-protocol.md. Zero nuove ricerche; dati di sviluppo, nessuna validazione indipendente. Categorie dell’app non modificate.', '',
  '| Gruppo | Categoria | Attesi | Assegnati | TP | FP | FN | Precisione | Richiamo |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|',
  ...summary.groups.flatMap(g => g.categories.map(c => `| ${g.group} | ${c.category} | ${c.expected} | ${c.assigned} | ${c.tp} | ${c.fp} | ${c.fn} | ${percent(c.precision)} | ${percent(c.recall)} |`)), '',
  '## Concordanza globale', '',
  ...summary.groups.map(g => `- ${g.group}: v1 originale ${g.originalMatches}/${g.included}; nuova categoria comune ${g.beforeMatches}/${g.included}; dopo ${g.afterMatches}/${g.included}. Esclusi ${g.excluded} (Forzata e matto dato).`), '',
  `Root sostituiti: ${summary.rootReplacements}; cambiamenti: ${summary.changes}; correzioni: ${summary.corrected}; concordanze perse: ${summary.lostMatches}.`, '',
  '## Tutte le assegnazioni, gli attesi non riconosciuti e i cambiamenti', '',
  '| Partita | Ply | Mossa | Atteso | V1 | Base nuova | Prototipo | Fonte | Motivo |', '|---|---:|---|---|---|---|---|---|---|',
  ...rows.filter(r => r.special || ['Grande', 'Geniale'].includes(r.expected) || r.originalPredicted !== r.predicted).map(r => `| ${r.gameId} | ${r.ply} | ${r.san} | ${r.expected} | ${r.originalPredicted} | ${r.base} | ${r.predicted} | ${r.rootSource} | ${r.reason} |`), '',
  'MultiPV e PV sono stime, non prove di tutte le alternative. Un solo positivo Geniale limita fortemente qualsiasi conclusione. Le soglie di questa esecuzione non sono state modificate dopo il confronto.', '',
  'Verifiche: replay delle partite e delle PV candidate; hash di 18 sorgenti invariati. .env e partite 7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun push.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
