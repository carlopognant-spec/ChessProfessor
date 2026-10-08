import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { classifyAttributedBrilliant } from './brilliant-offer-attribution-v3.js'

const root = new URL('../', import.meta.url), sources = [], rows = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); sources.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const v2 = await input('agent-output/brilliant-offer-v2-2026-10-08T02-16-04-769Z/results.json')
// Supplementary evidence changed no v2 outcome. Reproduce without it and verify every row.
if (v2.summary.supplementaryOutcomeChanges !== 0 || v2.summary.plies !== 592) throw Error('Incompatible baseline')
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
for (const id of ids) {
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  if (cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000 || cache.multiPv !== 5
    || cache.threads !== 1 || cache.hashMb !== 16 || cache.scorePerspective !== 'side-to-move at each FEN') throw Error('Incompatible cache')
  for (const [index, entry] of cache.entries.entries()) {
    const baseline = v2.rows.find(r => r.id === id && r.ply === entry.ply)
    if (!baseline || baseline.san !== entry.san || index + 1 !== entry.ply) throw Error('Invalid chain/reference')
    const result = classifyAttributedBrilliant(entry, baseline.base, cache.entries[index - 2], cache.entries[index - 1])
    if (baseline.v2 !== Boolean(result.evidence.qualifyingAcceptances?.length)) throw Error('V2 evidence changed')
    rows.push({ id, group: baseline.group, ply: entry.ply, san: entry.san, base: baseline.base,
      expected: baseline.expected, excluded: baseline.excluded, v1: baseline.v1, v2: baseline.v2,
      v3: result.brilliant, reason: result.reason, status: result.status, attributions: result.attributions })
  }
}
if (rows.length !== 592) throw Error('Missing rows')
for (const source of sources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source changed')
const metrics = (group, version) => {
  const own = rows.filter(r => !r.excluded && (group === 'all' || r.group === group))
  const assigned = own.filter(r => r[version]), positives = own.filter(r => r.expected === 'Geniale')
  const tp = assigned.filter(r => r.expected === 'Geniale').length
  return { group, version, tp, fp: assigned.length - tp, fn: positives.length - tp,
    precision: assigned.length ? tp / assigned.length : null, recall: positives.length ? tp / positives.length : null }
}
const changes = rows.filter(r => r.v2 !== r.v3)
const summary = { plies: rows.length, searchesExecuted: 0, sourceHashesUnchanged: true, appIntegration: false,
  independentValidation: false, hypothesisDerivedFromObservedErrors: true,
  abstentions: rows.filter(r => r.status === 'insufficient').length,
  changedRows: changes.length, lostTruePositives: changes.filter(r => r.v2 && r.expected === 'Geniale').length,
  metrics: ['development', 'historical', 'all'].flatMap(g => ['v1', 'v2', 'v3'].map(v => metrics(g, v))) }
const directory = new URL(`agent-output/brilliant-offer-attribution-v3-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, changes, rows, sources }, null, 2) + '\n', { flag: 'wx' })
const report = ['# Geniale v3 — attribuzione dell’offerta', '',
  'Ipotesi ricavata da errori già osservati: risultato di sviluppo, nessuna validazione indipendente. Protocollo: ../brilliant-offer-attribution-v3-protocol.md.', '',
  '| Gruppo | Versione | TP | FP | FN | Precisione | Richiamo |', '|---|---|---:|---:|---:|---:|---:|',
  ...summary.metrics.map(m => `| ${m.group} | ${m.version} | ${m.tp} | ${m.fp} | ${m.fn} | ${m.precision ?? 'n/d'} | ${m.recall ?? 'n/d'} |`), '',
  '## Variazioni complete', '', ...changes.map(r => `- ${r.id}, ply ${r.ply}, ${r.san}: ${r.v2} → ${r.v3}; riferimento ${r.expected}; ${r.reason}; ${JSON.stringify(r.attributions)}.`), '',
  '## Riferimenti Geniale', '', ...rows.filter(r => r.expected === 'Geniale').map(r => `- ${r.id}, ply ${r.ply}, ${r.san}: ${r.v3}; ${r.reason}.`), '',
  `Astensioni: ${summary.abstentions}. Positivi veri persi: ${summary.lostTruePositives}. Nessuna nuova ricerca, commit/push o modifica ad app/Grande/cache. Suite app/build/browser NON ESEGUITI.`, ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, changes, positives: rows.filter(r => r.expected === 'Geniale') }, null, 2))
