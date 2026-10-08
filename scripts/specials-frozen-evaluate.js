import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { resolveEvaluationInput } from './grande-frozen-input-path.js'
import { evaluateFrozenSpecials, validateSupplementalSearches, specialMetrics } from './specials-frozen-evaluation.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const root = fileURLToPath(new URL('../', import.meta.url)), options = {}, args = process.argv.slice(2)
for (let i = 0; i < args.length; i++) {
  const key = args[i]
  if (!['--development', '--fixture', '--cache', '--evidence', '--manifest'].includes(key) || key in options) throw Error('Unknown or duplicate argument')
  if (key === '--development') options[key] = true
  else { if (!args[i+1] || args[i+1].startsWith('--')) throw Error('Missing input path'); options[key] = args[++i] }
}
if (options['--development'] ? Object.keys(options).length !== 1 : !options['--fixture'] || !options['--cache']
  || Boolean(options['--evidence']) !== Boolean(options['--manifest'])) throw Error('Use --development OR --fixture <json> --cache <json> [--evidence <results.json> --manifest <manifest.json>]')
const watched = [], rows = [], games = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(filename, json = true) {
  const absolute = await resolveEvaluationInput(filename, root), bytes = await readFile(absolute)
  watched.push({ path: absolute, sha256: hash(bytes) })
  return json ? JSON.parse(bytes) : bytes
}
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
if (lock.version !== 'specials-frozen-candidate-v1' || lock.status !== 'experimental-not-enabled') throw Error('Unsupported lock')
for (const source of lock.sources) if (hash(await input(source.path, false)) !== source.sha256) throw Error(`Frozen dependency changed: ${source.path}`)
const model = await input('agent-output/grande-prudent-candidate-v1.json')
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
let supplemental = []
if (options['--development'] || options['--evidence']) {
  const bundle = await input(options['--evidence'] ?? 'agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json')
  const manifest = await input(options['--manifest'] ?? 'agent-output/brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json')
  supplemental = validateSupplementalSearches(bundle, manifest)
}
const ids = [...Array.from({ length: 6 }, (_,i) => `personal-0${i+1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const pairs = options['--development'] ? ids.map(id => ({ id, fixture: `tests/fixtures/qa/${id}.json`,
  cache: `tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`,
  role: id.startsWith('personal') ? 'development-replay' : 'historical-already-studied' }))
  : [{ fixture: options['--fixture'], cache: options['--cache'], role: 'provided-not-confirmed-independent' }]
for (const pair of pairs) {
  const fixture = await input(pair.fixture), cache = await input(pair.cache)
  if (/^personal-(?:0?[789]|10)$/.test(fixture.id ?? '')) throw Error('Reserved game ID')
  const current = evaluateFrozenSpecials({ ...fixture, id: pair.id ?? fixture.id ?? path.basename(pair.fixture, '.json') }, cache, model, book, supplemental)
  rows.push(...current.map(r => ({ ...r, role: pair.role })))
  games.push({ id: current[0]?.gameId, role: pair.role, metrics: specialMetrics(current) })
}
let regression = null
if (options['--development']) {
  const previousGrande = await input('agent-output/grande-frozen-evaluation-2026-10-08T01-39-08-868Z/results.json')
  const previousBrilliant = await input('agent-output/brilliant-same-offer-v4-2026-10-08T02-51-35-586Z/results.json')
  if (rows.length !== 592 || previousGrande.rows.length !== 592 || previousBrilliant.rows.length !== 592) throw Error('Regression length mismatch')
  for (const row of rows) {
    const g = previousGrande.rows.find(r => r.gameId === row.gameId && r.ply === row.ply)
    const b = previousBrilliant.rows.find(r => r.id === row.gameId && r.ply === row.ply)
    if (!g || !b || row.grandeAssigned !== (g.predicted === 'Grande') || row.brilliantAssigned !== b.v4
      || row.base !== g.base || row.expected !== g.expected || row.brilliantReason !== b.reason) throw Error(`Prediction changed: ${row.gameId}/${row.ply}`)
  }
  regression = { comparedPlies: 592, allAssignmentsAndBrilliantReasonsMatch: true }
}
for (const source of watched) if (hash(await readFile(source.path)) !== source.sha256) throw Error('Source changed during evaluation')
const summary = { version: lock.version, games: games.length, metrics: specialMetrics(rows), regression,
  supplementalSearchesReused: supplemental.length, searchesExecuted: 0, retrainingExecuted: false,
  sourceHashesUnchanged: true, independentValidation: false, appIntegration: false }
const directory = path.join(root, 'agent-output', `specials-frozen-evaluation-${new Date().toISOString().replace(/[:.]/g,'-')}`)
await mkdir(directory)
await writeFile(path.join(directory,'results.json'), JSON.stringify({ summary, games, rows, watched },null,2)+'\n',{flag:'wx'})
const report = ['# Valutatore congelato Grande e Geniale', '', ...Object.entries(summary).map(([k,v]) => `- ${k}: ${JSON.stringify(v)}`), '',
  '| Partita | Ply | SAN | Riferimento | Previsto | Motivo Grande | Motivo Geniale |', '|---|---:|---|---|---|---|---|',
  ...rows.filter(r => ['Grande','Geniale'].includes(r.predicted) || ['Grande','Geniale'].includes(r.expected)
    || r.brilliantStatus === 'insufficient' || r.grandeStatus === 'insufficient')
    .map(r => `| ${r.gameId} | ${r.ply} | ${r.san} | ${r.expected ?? 'non annotata'} | ${r.predicted} | ${r.grandeReason} | ${r.brilliantReason} |`), '',
  'Annotazioni assenti non sono negativi. Input forniti non sono automaticamente indipendenti. Score supplementari verificati contro UCI e manifest; nessuna ricerca automatica. Priorità Geniale sulle eventuali assegnazioni Grande, sovrapposizioni esplicite.', '',
  'App, cache e file precedenti invariati. Nessun commit/push o lettura .env/7–10. Suite app/build/browser NON ESEGUITI.', ''].join('\n')
await writeFile(path.join(directory,'report.md'),report,{flag:'wx'})
console.log(JSON.stringify({output:directory,summary},null,2))
