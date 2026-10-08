import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { classifySameOfferBrilliant } from './brilliant-same-offer-v4.js'

const root = new URL('../', import.meta.url), sources = [], rows = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); sources.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const prior = await input('agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json')
if (prior.summary.failure != null || prior.summary.searchesExecuted !== 30 || prior.summary.completedEstimates !== 30
  || prior.summary.sourceHashesUnchanged !== true) throw Error('Incomplete supplemental evidence')
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
for (const id of ids) {
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  if (cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000 || cache.multiPv !== 5
    || cache.threads !== 1 || cache.hashMb !== 16 || cache.scorePerspective !== 'side-to-move at each FEN') throw Error('Incompatible cache')
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.ply !== index + 1 || index && cache.entries[index - 1].fenAfter !== entry.fenBefore) throw Error('Invalid chain')
    const baseline = prior.rows.find(r => r.id === id && r.ply === entry.ply)
    if (!baseline || baseline.san !== entry.san) throw Error('Invalid baseline')
    const result = classifySameOfferBrilliant(entry, baseline.base, cache.entries[index - 2], cache.entries[index - 1], prior.searches)
    // Copy expected labels only after evidence-only classification.
    rows.push({ id, group: baseline.group, ply: entry.ply, san: entry.san, base: baseline.base,
      expected: baseline.expected, excluded: baseline.excluded, v3: baseline.after, v4: result.brilliant,
      beforeReason: baseline.reason, reason: result.reason, status: result.status,
      comparison: result.comparison, newOffers: result.newOffers ?? [] })
  }
}
if (rows.length !== 592) throw Error('Incomplete replay')
for (const source of sources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source changed')
const metrics = (group, version) => {
  const own = rows.filter(r => !r.excluded && (group === 'all' || r.group === group))
  const assigned = own.filter(r => r[version]), positives = own.filter(r => r.expected === 'Geniale')
  const tp = assigned.filter(r => r.expected === 'Geniale').length
  return { group, version, tp, fp: assigned.length - tp, fn: positives.length - tp,
    precision: assigned.length ? tp / assigned.length : null, recall: positives.length ? tp / positives.length : null }
}
const changes = rows.filter(r => r.v3 !== r.v4), auditedMatches = rows.filter(r => r.comparison.matches.length)
const summary = { plies: rows.length, searchesExecuted: 0, sourceHashesUnchanged: true, independentValidation: false,
  hypothesisDerivedFromObservedError: true, appIntegration: false, changedRows: changes.length,
  lostTruePositives: changes.filter(r => r.v3 && r.expected === 'Geniale').length,
  sameOfferWinningAlternativeMoves: auditedMatches.length,
  sameOfferWinningAlternativeLines: auditedMatches.reduce((n,r) => n + r.comparison.matches.length, 0),
  abstentions: rows.filter(r => r.status === 'insufficient').length,
  metrics: ['development', 'historical', 'all'].flatMap(g => ['v3', 'v4'].map(v => metrics(g,v))) }
const directory = new URL(`agent-output/brilliant-same-offer-v4-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, changes, auditedMatches, rows, sources }, null, 2) + '\n', { flag: 'wx' })
const cases = rows.filter(r => r.expected === 'Geniale' || r.v3 || r.v4)
const report = ['# Geniale v4 — alternative dalla stessa posizione', '',
  'Protocollo: ../brilliant-same-offer-v4-protocol.md. Ipotesi nata da Rac1 già osservata; nessuna validazione indipendente.', '',
  '| Gruppo | Versione | TP | FP | FN | Precisione | Richiamo |', '|---|---|---:|---:|---:|---:|---:|',
  ...summary.metrics.map(m => `| ${m.group} | ${m.version} | ${m.tp} | ${m.fp} | ${m.fn} | ${m.precision ?? 'n/d'} | ${m.recall ?? 'n/d'} |`), '',
  '## Casi di riferimento e assegnazioni', '', ...cases.map(r => `- ${r.id} ply ${r.ply}, ${r.san}, riferimento ${r.expected}: v3 ${r.v3}, v4 ${r.v4}; ${r.reason}; alternative con stessa offerta: ${r.comparison.matches.map(m => `${m.san} (${m.sameOffers.map(s=>s.type+'@'+s.square).join(',')})`).join('; ') || 'nessuna comparabile'}.`), '',
  `Audit: ${summary.sameOfferWinningAlternativeMoves} mosse con ${summary.sameOfferWinningAlternativeLines} righe comparabili vincenti e stessa offerta. Una sola modifica alle assegnazioni non implica che l'audit riguardi una sola posizione.`, '',
  '## Tutti i confronti positivi', '', ...auditedMatches.map(r => `- ${r.id} ${r.ply} ${r.san} (${r.expected}, base ${r.base}): ${JSON.stringify(r.comparison.matches)}.`), '',
  'Confronti a budget limitato: non prove di vittoria contro ogni difesa. Differenze di depth/bound/radici duplicate non diventano score comparabili. Soglie, Grande e app/cache invariati. Nessuna nuova ricerca o commit/push. Suite app/build/browser NON ESEGUITI.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary,
  cases: cases.map(({ comparison, ...r }) => ({ ...r, alternatives: comparison.matches.map(m => m.san) })) }, null, 2))
