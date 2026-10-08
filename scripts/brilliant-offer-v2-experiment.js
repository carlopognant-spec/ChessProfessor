import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { classifyBrilliantOffer } from './brilliant-offer-v2.js'

const root = new URL('../', import.meta.url), sources = [], rows = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); sources.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const baseline = await input('agent-output/stockfish-specials-simple-2026-10-07T19-25-40-871Z/results.json')
const priorAudit = await input('agent-output/brilliant-sacrifice-audit-2026-10-08T01-48-41-355Z/results.json')
const supplement = await input('agent-output/brilliant-rb3-acceptance-2026-10-08T02-03-27-001Z/results.json')
const schedule = await input('agent-output/brilliant-rb3-acceptance-2026-10-08T02-03-27-001Z/schedule.json')
if (schedule.enginePackage !== '19.0.0' || schedule.build !== 'large-single' || schedule.multiPv !== 1
  || schedule.threads !== 1 || schedule.hashMb !== 16 || schedule.hashPolicy !== 'clear-per-search'
  || supplement.summary.failure != null || supplement.searches.some(s => s.fen !== schedule.fen
    || s.rootUci !== schedule.rootUci || !schedule.budgets.includes(s.budgetNodes))) throw Error('Incompatible supplementary configuration')
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
for (const id of ids) {
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  if (cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000 || cache.multiPv !== 5
    || cache.threads !== 1 || cache.hashMb !== 16 || cache.scorePerspective !== 'side-to-move at each FEN') throw Error('Incompatible cache')
  for (const entry of cache.entries) {
    const common = baseline.rows.find(r => r.gameId === id && r.ply === entry.ply)
    const audited = priorAudit.rows.find(r => r.id === id && r.ply === entry.ply)
    if (!common || !audited || entry.fenBefore !== audited.fenBefore || entry.fenAfter !== audited.fenAfter || entry.san !== common.san) throw Error('Source mismatch')
    const withoutSupplement = classifyBrilliantOffer(entry, common.base)
    const result = classifyBrilliantOffer(entry, common.base, supplement.searches)
    // Reference is used only after both evidence-only classifications return.
    rows.push({ id, group: common.group, ply: entry.ply, san: entry.san, expected: common.expected,
      excluded: common.excluded, base: common.base, v1: common.predicted === 'Geniale',
      v2: result.brilliant, withoutSupplement: withoutSupplement.brilliant,
      status: result.status, reason: result.reason, evidence: result.evidence,
      materialCandidate: audited.audit.offers.some(o => o.candidateMaterialLoss) })
  }
}
const metrics = (group, version) => {
  const own = rows.filter(r => !r.excluded && (group === 'all' || r.group === group))
  const assigned = own.filter(r => r[version]), positive = own.filter(r => r.expected === 'Geniale')
  const tp = assigned.filter(r => r.expected === 'Geniale').length
  return { group, version, tp, fp: assigned.length - tp, fn: positive.length - tp,
    precision: assigned.length ? tp / assigned.length : null, recall: positive.length ? tp / positive.length : null }
}
for (const source of sources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source changed')
const summary = { plies: rows.length, searchesExecuted: 0, sourceHashesUnchanged: true, appIntegration: false,
  independentValidation: false, supplementalSelection: 'reference-guided diagnostic; not independent',
  supplementaryOutcomeChanges: rows.filter(r => r.v2 !== r.withoutSupplement).length,
  abstentions: rows.filter(r => r.status === 'insufficient').length,
  reasonCounts: Object.fromEntries([...new Set(rows.map(r => r.reason))].sort().map(reason => [reason, rows.filter(r => r.reason === reason).length])),
  metrics: ['development', 'historical', 'all'].flatMap(g => ['v1', 'v2'].map(v => metrics(g, v))) }
const directory = new URL(`agent-output/brilliant-offer-v2-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, rows, sources }, null, 2) + '\n', { flag: 'wx' })
const cases = rows.filter(r => r.expected === 'Geniale' || r.v2)
const report = ['# Geniale v2 — confronto offline', '', 'Protocollo: ../brilliant-offer-v2-protocol.md. Dati già studiati, nessuna validazione indipendente.', '',
  '| Gruppo | Versione | TP | FP | FN | Precisione | Richiamo |', '|---|---|---:|---:|---:|---:|---:|',
  ...summary.metrics.map(m => `| ${m.group} | ${m.version} | ${m.tp} | ${m.fp} | ${m.fn} | ${m.precision ?? 'n/d'} | ${m.recall ?? 'n/d'} |`), '',
  `Astensioni: ${summary.abstentions}. Ricerche eseguite: 0. Esiti modificati dall'evidenza supplementare mirata: ${summary.supplementaryOutcomeChanges}.`, '',
  '| Partita | Ply | SAN | Riferimento | V2 | Motivo | Alternative vincenti senza sacrificio |', '|---|---:|---|---|---|---|---|',
  ...cases.map(r => `| ${r.id} | ${r.ply} | ${r.san} | ${r.expected} | ${r.v2} | ${r.reason} | ${r.evidence.winningNonSacrifices.map(a => a.uci).join(', ')} |`), '',
  '## Tutti i candidati materiali', '', '| Partita | Ply | SAN | Riferimento | Base | V2 | Motivo |', '|---|---:|---|---|---|---|---|',
  ...rows.filter(r => r.materialCandidate).map(r => `| ${r.id} | ${r.ply} | ${r.san} | ${r.expected} | ${r.base} | ${r.v2} | ${r.reason} |`), '',
  'Grande, app e cache invariati. Nessun commit/push. Suite app/build/browser NON ESEGUITI.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, cases: cases.map(({ evidence, ...r }) => ({ ...r, winningNonSacrifices: evidence.winningNonSacrifices })) }, null, 2))
