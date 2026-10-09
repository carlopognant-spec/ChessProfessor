import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { auditLegalFork } from './grande-fork-legal.js'

const root = new URL('../', import.meta.url), sources = new Map()
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root))
  sources.set(path, hash(bytes))
  return JSON.parse(bytes)
}
for (const path of ['scripts/grande-fork-legal.js', 'scripts/grande-fork-legal-audit.js',
  'agent-output/grande-fork-legal-v1-protocol.md']) sources.set(path, hash(await readFile(new URL(path, root))))
const manifest = await input('agent-output/grande-fork-audit-candidates-v1.json')
if (manifest.selectionUsesExpectedLabels !== false || manifest.engineSearchesPlanned !== 0
  || manifest.cases.length !== 10) throw Error('Unexpected selection')
const allowed = new Set([...Array.from({ length: 6 }, (_, index) => `personal-0${index + 1}`),
  'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843'])
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const source of lock.sources) {
  const actual = hash(await readFile(new URL(source.path, root)))
  if (actual !== source.sha256) throw Error(`Frozen dependency mismatch: ${source.path}`)
  sources.set(source.path, actual)
}
const seen = new Set(), caches = new Map(), rows = []
let enumerationMs = 0
for (const candidate of manifest.cases) {
  const cachePath = `tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${candidate.id}.json`
  if (!allowed.has(candidate.id) || candidate.cache !== cachePath) throw Error('Case outside whitelist')
  const key = `${candidate.id}:${candidate.ply}`
  if (seen.has(key)) throw Error('Duplicate candidate')
  seen.add(key)
  if (!caches.has(cachePath)) caches.set(cachePath, await input(cachePath))
  const cache = caches.get(cachePath)
  if (cache.packageVersion !== '19.0.0' || cache.engineBuild !== 'stockfish-19-single'
    || cache.searchLimit?.kind !== 'nodes' || cache.searchLimit.value !== 200000
    || cache.scorePerspective !== 'side-to-move at each FEN'
    || cache.multiPv !== 5 || cache.threads !== 1 || cache.hashMb !== 16
    || cache.hashPolicy !== 'ucinewgame + Clear Hash before every search') throw Error('Incompatible cache')
  const entry = cache.entries.find(entry => entry.ply === candidate.ply)
  if (!entry || entry.san !== candidate.san) throw Error('Candidate not found')
  const started = performance.now()
  const audit = auditLegalFork(entry)
  enumerationMs += performance.now() - started
  if (JSON.stringify(audit.targets.map(({ square, type }) => ({ square, type }))) !== JSON.stringify(candidate.targets)) {
    throw Error('Candidate targets changed')
  }
  rows.push({ id: candidate.id, ply: candidate.ply, san: candidate.san, ...audit })
}
// Join references only after all legal features have been extracted.
const reference = await input(manifest.source.path)
if (sources.get(manifest.source.path) !== manifest.source.sha256) throw Error('Reference source changed')
for (const row of rows) {
  const ref = reference.rows.find(ref => ref.id === row.id && ref.ply === row.ply)
  if (!ref || ref.san !== row.san) throw Error('Reference row mismatch')
  row.expected = ref.expected
  row.base = ref.base
}
for (const [path, expected] of sources) {
  if (hash(await readFile(new URL(path, root))) !== expected) throw Error(`Input changed: ${path}`)
}
const summary = { cases: rows.length, legalReplies: rows.reduce((sum, row) => sum + row.summary.legalReplies, 0),
  capturesEnumerated: rows.reduce((sum, row) => sum + row.summary.capturesEnumerated, 0),
  recaptureMovesEnumerated: rows.reduce((sum, row) => sum + row.summary.recaptureMovesEnumerated, 0),
  enumerationMs: Math.round(enumerationMs), engineSearches: 0, sourceHashesUnchanged: true,
  independentValidation: false, classificationChanged: false,
  groups: ['Grande', 'other'].map(group => {
    const cases = rows.filter(row => group === 'Grande' ? row.expected === 'Grande' : row.expected !== 'Grande')
    return { group, cases: cases.length,
      everyReplyAllowsCapture: cases.filter(row => row.summary.legalReplies > 0 && !row.summary.noCaptureReplies.length).length,
      everyReplyAllowsPositiveImmediateIncrement: cases.filter(row => row.summary.everyReplyAllowsPositiveImmediateIncrement).length }
  }) }
const directory = new URL(`agent-output/grande-fork-legal-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ protocol: 'grande-fork-legal-v1', summary, rows,
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
const report = ['# Audit legale dei dieci doppi attacchi', '',
  'Protocollo: [v1](../grande-fork-legal-v1-protocol.md). Dati già studiati; nessuna nuova ricerca o modifica alle categorie.', '',
  ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
  '| Partita / ply | Mossa | Riferimento | Risposte legali | Cattura sempre disponibile | Incremento positivo sempre disponibile dopo ricattura | Minimo incremento |',
  '|---|---|---|---:|---|---|---:|',
  ...rows.map(row => `| ${row.id} / ${row.ply} | ${row.san} | ${row.expected ?? 'assente'} | ${row.summary.legalReplies} | ${!row.summary.noCaptureReplies.length} | ${row.summary.everyReplyAllowsPositiveImmediateIncrement} | ${row.summary.minimumBestIncrementalDelta ?? 'non applicabile'} |`), '',
  '## Difese che impediscono un incremento materiale immediato positivo', '',
  ...rows.map(row => `- ${row.id}/${row.ply} ${row.san}: ${row.summary.noPositiveIncrementReplies.join(', ') || 'nessuna a questo orizzonte'}.`), '',
  '## Limiti', '',
  'Il saldo include la candidata, la risposta, la cattura di un bersaglio e l’eventuale ricattura immediata. L’incremento sottrae il guadagno già ottenuto dalla candidata. Il minimo non prova guadagno forzato a lungo termine: altre difese e mosse quiete successive non sono esplorate. Difensori geometrici e ricatture legali sono registrati separatamente. Le PV salvate non coprono tutte le risposte e non provano unicità o valore rispetto alle alternative.', '',
  'Hash invariati, nessuna lettura .env/partite 7–10, nessun nuovo score, nessuna attivazione Grande/Geniale, nessun commit/push.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
