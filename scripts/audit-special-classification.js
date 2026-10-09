import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { classifyMoveOpportunity } from '../src/lib/moveOpportunities.js'
import { SPECIAL_POLICY } from '../src/lib/specialClassification.js'

const root = new URL('../', import.meta.url), sources = new Map()
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); sources.set(path, hash(bytes)); return JSON.parse(bytes)
}
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const source of lock.sources) {
  const actual = hash(await readFile(new URL(source.path, root)))
  if (actual !== source.sha256) throw Error(`Frozen source mismatch: ${source.path}`)
  sources.set(source.path, actual)
}
for (const path of ['src/lib/specialClassification.js', 'src/lib/sacrificeEvidence.js', 'src/lib/materialRealization.js', 'src/lib/multiPvEvidence.js', 'src/lib/stockfish.js',
  'src/lib/gameAnalysis.js', 'src/lib/moveOpportunities.js', 'src/lib/reviewEvaluation.js', 'src/lib/reviewMoves.js', 'scripts/audit-special-classification.js']) {
  sources.set(path, hash(await readFile(new URL(path, root))))
}
const ids = [...Array.from({ length: 6 }, (_, index) => `personal-0${index + 1}`),
  'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const rows = []
for (const id of ids) {
  const fixture = await input(`tests/fixtures/qa/${id}.json`)
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  if (cache.packageVersion !== '19.0.0' || cache.engineBuild !== 'stockfish-19-single'
    || cache.searchLimit?.kind !== 'nodes' || cache.searchLimit.value !== 200000 || cache.multiPv !== 5
    || cache.hashPolicy !== 'ucinewgame + Clear Hash before every search') throw Error('Unexpected cache')
  let before = 0, after = 0
  const entries = await analyzeGame({ openingBook: book, baseFen: cache.entries[0].fenBefore,
    moves: cache.entries.map(entry => entry.san),
    analyzePosition: async fen => { const entry = cache.entries[before++]; if (entry.fenBefore !== fen) throw Error('Before FEN mismatch'); return entry.engine },
    analyzePlayedPosition: async fen => { const entry = cache.entries[after++]; if (entry.fenAfter !== fen) throw Error('After FEN mismatch'); return entry.playedEngine } })
  const old = []
  for (const entry of entries) old.push(classifyMoveOpportunity({ ...entry, classification: entry.baseClassification }, old.at(-1)))
  // Reference labels are joined only after the engine-based classifications.
  for (const [index, entry] of entries.entries()) {
    const annotation = fixture.annotations.find(annotation => annotation.ply === entry.ply)
    if (!annotation || annotation.san !== entry.playedMove) throw Error('Reference mismatch')
    rows.push({ id, ply: entry.ply, san: entry.playedMove, expected: annotation.category,
      before: old[index].classification, after: entry.classification, assessment: entry.specialAssessment,
      numericalClassification: entry.numericalClassification, moveFacts: entry.moveFacts, evaluationEvidence: entry.evaluationEvidence,
      missedReason: entry.missedOpportunityReason })
  }
}
const labels = { great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata' }
const metrics = Object.entries(labels).map(([category, label]) => {
  const assigned = rows.filter(row => row.after === category), expected = rows.filter(row => row.expected === label)
  const tp = assigned.filter(row => row.expected === label).length
  return { category, tp, fp: assigned.length - tp, fn: expected.length - tp, assigned: assigned.length,
    precision: assigned.length ? tp / assigned.length : null, recall: expected.length ? tp / expected.length : null }
})
const changed = rows.filter(row => row.before !== row.after)
const reasons = {}
for (const row of rows) for (const category of ['grande', 'brilliant']) {
  const evidence = row.assessment[category], key = `${category}:${evidence.status}:${evidence.reason}`
  reasons[key] = (reasons[key] ?? 0) + 1
}
for (const [path, expected] of sources) if (hash(await readFile(new URL(path, root))) !== expected) throw Error(`Input changed: ${path}`)
const summary = { version: SPECIAL_POLICY.version, plies: rows.length, metrics, changed: changed.length,
  sourceHashesUnchanged: true, independentValidation: false, newSearches: 0, reasons }
const directory = new URL(`agent-output/special-classification-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, rows, changed,
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(new URL('report.md', directory), ['# Categorie speciali: audit della prima implementazione', '',
  'Confronto su dati già studiati, senza nuove ricerche o fitting. Le vecchie cache non contengono gli snapshot MultiPV completi ora raccolti dal worker: i confronti usano solo linee distinte alla stessa profondità.', '',
  ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
  '| Partita / ply | Giocata | Riferimento | Prima | Dopo |', '|---|---|---|---|---|',
  ...changed.map(row => `| ${row.id}/${row.ply} | ${row.san} | ${row.expected} | ${row.before} | ${row.after} |`), '',
  'Grande è una decisione critica rispetto alle alternative confrontabili, con copertura dichiarata. Geniale richiede offerta nuova, compensazione nelle accettazioni legali coperte, niente recupero immediato irrisolto e confronto con alternative vincenti senza nuova offerta. Dati insufficienti mantengono la categoria numerica. Questi risultati non dimostrano equivalenza con Chess.com.', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
