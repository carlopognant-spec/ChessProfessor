import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { captureContextFeatures } from './grande-capture-context.js'
import { learnGrandeRules, predictsGrande, trainingWithoutGame } from './grande-rule-learning.js'

const root = new URL('../', import.meta.url), watched = []
const personalIds = Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`)
const ids = [...personalIds, 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); watched.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const prior = await input('agent-output/grande-leave-game-out-2026-10-07T20-47-09-175Z/results.json')
const allowed = new Set(['src/data/openingPositions.json',
  'agent-output/grande-negative-comparison-2026-10-07T19-08-02-694Z/results.json',
  'agent-output/stockfish-specials-simple-2026-10-07T19-25-40-871Z/results.json',
  ...ids.flatMap(id => [`tests/fixtures/qa/${id}.json`, `tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`]),
])
for (const source of prior.watched) {
  if (!allowed.has(source.path)) throw Error('Source outside whitelist')
  if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Input changed since previous experiment')
  watched.push(source)
}
const context = new Map()
for (const id of ids) {
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  if (cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000) throw Error('Incompatible cache')
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.ply !== index + 1) throw Error('Invalid ply')
    context.set(`${id}:${entry.ply}`, captureContextFeatures(entry, cache.entries[index - 1], cache.entries[index - 2]))
  }
}
const originalPredictions = prior.predictions.filter(p => p.policyName === 'cautious')
if (originalPredictions.length !== 592 || context.size !== originalPredictions.length) throw Error('Wrong dataset size')
// Add label-independent contextual features; reference labels are unchanged.
const samples = originalPredictions.map(sample => {
  if (!ids.includes(sample.gameId)) throw Error('Unknown game')
  const added = context.get(`${sample.gameId}:${sample.ply}`)
  if (!added) throw Error('Missing context')
  return { ...sample, priorPrudent: sample.predicted, features: { ...sample.features, ...added } }
})
const featureNames = Object.keys(samples[0].features), models = [], predictions = []
for (const heldOut of personalIds) {
  const training = trainingWithoutGame(samples, personalIds, heldOut)
  const model = learnGrandeRules(training, featureNames, 'cautious')
  models.push({ heldOut, trainingGames: personalIds.filter(id => id !== heldOut), model })
  for (const sample of samples.filter(s => s.gameId === heldOut)) {
    const predicted = sample.v1 === 'Geniale' ? 'Geniale' : sample.eligible && predictsGrande(sample.features, model) ? 'Grande' : sample.base
    predictions.push({ ...sample, predicted })
  }
}
const finalModel = learnGrandeRules(samples.filter(s => personalIds.includes(s.gameId) && s.eligible), featureNames, 'cautious')
models.push({ heldOut: 'historical-separate', trainingGames: personalIds, model: finalModel })
for (const sample of samples.filter(s => !personalIds.includes(s.gameId))) {
  const predicted = sample.v1 === 'Geniale' ? 'Geniale' : sample.eligible && predictsGrande(sample.features, finalModel) ? 'Grande' : sample.base
  predictions.push({ ...sample, predicted })
}
function metrics(rows, field) {
  const own = rows.filter(r => !r.excluded), assigned = own.filter(r => r[field] === 'Grande'), positives = own.filter(r => r.expected === 'Grande')
  const tp = assigned.filter(r => r.expected === 'Grande').length
  return { included: own.length, assigned: assigned.length, expected: positives.length, tp, fp: assigned.length - tp, fn: positives.length - tp,
    precision: assigned.length ? tp / assigned.length : null, recall: positives.length ? tp / positives.length : null,
    matches: own.filter(r => r[field] === r.expected).length }
}
const changes = predictions.filter(p => !p.excluded && p.priorPrudent !== p.predicted)
const comparison = ['development', 'historical', 'all'].flatMap(group => ['priorPrudent', 'predicted'].map(version => ({ group, version,
  ...metrics(predictions.filter(p => group === 'all' || p.group === group), version) })))
for (const source of watched) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source changed during extraction')
const summary = { searchesExecuted: 0, sourceHashesUnchanged: true, features: featureNames, models: models.length,
  appIntegration: false, independentValidation: false, comparison, changes: changes.length,
  newTruePositives: changes.filter(p => p.predicted === 'Grande' && p.expected === 'Grande').length,
  lostTruePositives: changes.filter(p => p.priorPrudent === 'Grande' && p.expected === 'Grande').length,
  newFalsePositives: changes.filter(p => p.predicted === 'Grande' && p.expected !== 'Grande').length,
  correctedFalsePositives: changes.filter(p => p.priorPrudent === 'Grande' && p.expected !== 'Grande').length }
const directory = new URL(`agent-output/grande-capture-context-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, models, changes, predictions, watched }, null, 2) + '\n', { flag: 'wx' })
const ruleText = rule => rule.predicates.map(p => `${p.value ? '' : 'non '}${p.name}`).join(' AND ')
const report = ['# Grande — ampliamento con il contesto delle prese', '',
  'Protocollo: ../grande-capture-context-v1-protocol.md. Costo FP, supporto minimo e complessità del modello prudenti invariati. Personali predette fuori dal rispettivo training; storiche fuori da tutti i training. Dati già studiati: nessuna validazione indipendente.', '',
  '| Gruppo | Metodo | TP | FP | FN | Assegnazioni |', '|---|---|---:|---:|---:|---:|',
  ...comparison.map(c => `| ${c.group} | ${c.version} | ${c.tp} | ${c.fp} | ${c.fn} | ${c.assigned} |`), '',
  `Nuovi positivi: ${summary.newTruePositives}; positivi persi: ${summary.lostTruePositives}; nuovi falsi positivi: ${summary.newFalsePositives}.`, '',
  '## Tutti i cambiamenti', '', '| Partita | Ply | SAN | Atteso | Prudente precedente | Nuovo |', '|---|---:|---|---|---|---|',
  ...changes.map(p => `| ${p.gameId} | ${p.ply} | ${p.san} | ${p.expected} | ${p.priorPrudent} | ${p.predicted} |`), '',
  '## Tutti i modelli', '', ...models.flatMap(m => [`### Esclusa ${m.heldOut}`, ...m.model.rules.map(r => `- ${ruleText(r)}; nuovi TP training ${r.trainingNewTp}; FP ${r.trainingNewFp}.`), '']),
  'Geniale invariata. Zero nuove ricerche motore, app/cache/file precedenti invariati. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, finalModel, changes: changes.map(p => ({ id: p.gameId, ply: p.ply, san: p.san, expected: p.expected, before: p.priorPrudent, after: p.predicted })) }, null, 2))
