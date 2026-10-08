import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { evaluateFrozenGame, validateFrozenModel, frozenMetrics } from './grande-frozen-evaluation.js'
import { resolveEvaluationInput } from './grande-frozen-input-path.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2), options = {}
for (let i = 0; i < args.length; i++) {
  const key = args[i]
  if (!['--development', '--fixture', '--cache'].includes(key) || key in options) throw Error('Unknown or repeated argument')
  if (key === '--development') options[key] = true
  else {
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw Error('Input path required')
    options[key] = args[++i]
  }
}
if (options['--development'] ? Object.keys(options).length !== 1 : !options['--fixture'] || !options['--cache']) {
  throw Error('Use --development OR --fixture <fixture.json> --cache <analysis.json>')
}
const watched = [], rows = [], games = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(filename) {
  const absolute = await resolveEvaluationInput(filename, root)
  const bytes = await readFile(absolute)
  watched.push({ path: absolute, sha256: hash(bytes) })
  return JSON.parse(bytes)
}
const model = await input('agent-output/grande-prudent-candidate-v1.json')
validateFrozenModel(model)
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
const personalIds = Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`)
const ids = [...personalIds, 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const pairs = options['--development'] ? ids.map(id => ({ id,
  fixture: `tests/fixtures/qa/${id}.json`, cache: `tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`,
  role: personalIds.includes(id) ? 'development-replay' : 'historical-already-studied',
})) : [{ fixture: options['--fixture'], cache: options['--cache'], role: 'provided-not-confirmed-independent' }]
for (const pair of pairs) {
  const fixture = await input(pair.fixture), cache = await input(pair.cache)
  if (/^personal-(?:0?[789]|10)$/.test(fixture.id ?? '')) throw Error('Reserved game ID')
  const current = evaluateFrozenGame({ ...fixture, id: pair.id ?? fixture.id ?? path.basename(pair.fixture, '.json') }, cache, model, book)
  rows.push(...current.map(row => ({ ...row, role: pair.role })))
  games.push({ id: current[0]?.gameId ?? fixture.id, role: pair.role, fixture: pair.fixture, cache: pair.cache, metrics: frozenMetrics(current) })
}
let regression = null
if (options['--development']) {
  const previous = await input('agent-output/grande-leave-game-out-2026-10-07T20-47-09-175Z/results.json')
  const priorRows = previous.predictions.filter(p => p.policyName === 'cautious')
  if (priorRows.length !== rows.length) throw Error('Regression length mismatch')
  for (const [index, row] of rows.entries()) {
    const prior = priorRows[index]
    if (row.gameId !== prior.gameId || row.ply !== prior.ply || row.predicted !== prior.predicted || row.expected !== prior.expected) throw Error(`Frozen prediction changed: ${row.gameId}/${row.ply}`)
  }
  regression = { comparedPlies: rows.length, allPredictionsMatch: true,
    note: 'All six cautious fold rules were identical to the final frozen rule. This replay is not new validation.' }
}
for (const source of watched) if (hash(await readFile(source.path)) !== source.sha256) throw Error('Input changed during evaluation')
const summary = { frozenVersion: model.version, metrics: frozenMetrics(rows), games: games.length,
  searchesExecuted: 0, retrainingExecuted: false, sourceHashesUnchanged: true, independentValidation: false,
  appIntegration: false, regression }
const directory = path.join(root, 'agent-output', `grande-frozen-evaluation-${new Date().toISOString().replace(/[:.]/g, '-')}`)
await mkdir(directory)
await writeFile(path.join(directory, 'results.json'), JSON.stringify({ summary, games, rows, watched }, null, 2) + '\n', { flag: 'wx' })
const report = ['# Valutazione del modello congelato Grande', '',
  ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
  '## Tutte le Grande assegnate, attese e i casi insufficienti', '',
  '| Partita | Ply | SAN | Riferimento | Previsto | Stato | Motivo |', '|---|---:|---|---|---|---|---|',
  ...rows.filter(r => r.predicted === 'Grande' || r.expected === 'Grande' || r.status === 'insufficient')
    .map(r => `| ${r.gameId} | ${r.ply} | ${r.san} | ${r.expected ?? 'non annotata'} | ${r.predicted} | ${r.status} | ${r.reason} |`), '',
  'Le annotazioni mancanti non sono negativi. Precisione/recall riguardano soltanto le mosse annotate e incluse. Input incompleti o incoerenti fanno fallire la raccolta; score mancanti rimangono Non valutabile o insufficienti. Ruolo di nuovi input non dichiarato automaticamente indipendente.', '',
  'Modello non riaddestrato; nessuna ricerca motore. App/cache/file precedenti intatti. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.', ''].join('\n')
await writeFile(path.join(directory, 'report.md'), report, { flag: 'wx' })
console.log(JSON.stringify({ output: directory, summary }, null, 2))
