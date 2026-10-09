import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { classifyMissedOpportunity } from '../src/lib/missedOpportunity.js'

const root = new URL('../', import.meta.url), sources = new Map()
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); sources.set(path, hash(bytes)); return JSON.parse(bytes)
}
const openingBook = createOpeningBook((await input('src/data/openingPositions.json')).positions)
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const source of lock.sources) {
  const actual = hash(await readFile(new URL(source.path, root)))
  if (actual !== source.sha256) throw Error(`Frozen dependency changed: ${source.path}`)
  sources.set(source.path, actual)
}
for (const path of ['src/lib/moveOpportunities.js', 'src/lib/gameAnalysis.js', 'scripts/audit-move-opportunities.js']) {
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
    || cache.threads !== 1 || cache.hashMb !== 16 || cache.hashPolicy !== 'ucinewgame + Clear Hash before every search') {
    throw Error('Incompatible cache')
  }
  let before = 0, after = 0
  const entries = await analyzeGame({ openingBook, baseFen: cache.entries[0].fenBefore,
    moves: cache.entries.map(entry => entry.san),
    analyzePosition: async fen => {
      const entry = cache.entries[before++]; if (entry.fenBefore !== fen) throw Error('Before FEN mismatch'); return entry.engine
    },
    analyzePlayedPosition: async fen => {
      const entry = cache.entries[after++]; if (entry.fenAfter !== fen) throw Error('After FEN mismatch'); return entry.playedEngine
    } })
  const oldEntries = []
  for (const entry of entries) oldEntries.push(classifyMissedOpportunity(entry, oldEntries.at(-1)))
  for (const [index, entry] of entries.entries()) {
    const annotation = fixture.annotations.find(annotation => annotation.ply === entry.ply)
    if (!annotation || annotation.san !== entry.playedMove) throw Error('Reference mismatch')
    rows.push({ id, ply: entry.ply, san: entry.playedMove, expected: annotation.category,
      before: oldEntries[index].classification, after: entry.classification,
      reasonBefore: oldEntries[index].missedOpportunityReason, reasonAfter: entry.missedOpportunityReason,
      opportunity: entry.missedOpportunity, baseClassification: entry.baseClassification,
      bestEval: entry.bestEval, bestMate: entry.bestMate, playedEval: entry.playedEval, playedMate: entry.playedMate })
  }
}
function metrics(field) {
  const predicted = rows.filter(row => row[field] === 'missed'), expected = rows.filter(row => row.expected === 'Mossa mancata')
  const tp = predicted.filter(row => row.expected === 'Mossa mancata').length
  return { tp, fp: predicted.length - tp, fn: expected.length - tp, predicted: predicted.length, expected: expected.length }
}
for (const [path, expected] of sources) if (hash(await readFile(new URL(path, root))) !== expected) throw Error(`Input changed: ${path}`)
const changed = rows.filter(row => row.before !== row.after)
const summary = { plies: rows.length, before: metrics('before'), after: metrics('after'), changed: changed.length,
  sourceHashesUnchanged: true, searchesExecuted: 0, independentValidation: false }
const directory = new URL(`agent-output/move-opportunities-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, changed, rows,
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(new URL('report.md', directory), ['# Mossa mancata: confronto su cache esistenti', '',
  'Campione di sviluppo già studiato. Il criterio aggiunto verifica la rinuncia a un matto con PV completa legalmente ripercorribile; non modifica la politica precedente dell’occasione vincente.', '',
  ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
  '| Partita / ply | Giocata | Riferimento | Prima | Dopo | Motivo |', '|---|---|---|---|---|---|',
  ...rows.filter(row => row.expected === 'Mossa mancata' || row.after === 'missed').map(row =>
    `| ${row.id}/${row.ply} | ${row.san} | ${row.expected} | ${row.before} | ${row.after} | ${row.reasonAfter} |`), '',
  'Zero nuove ricerche, hash invariati, nessuna lettura .env o partite 7–10, nessuna riscrittura di cache/baseline/report storici. I sette riferimenti ancora mancanti non vengono recuperati abbassando le soglie. Grande/Geniale restano sperimentali.', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
