import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'
import { learnGrandeRules, predictsGrande, RULE_POLICIES, trainingWithoutGame } from './grande-rule-learning.js'

const root = new URL('../', import.meta.url), watched = []
const personalIds = Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`)
const ids = [...personalIds, 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); watched.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const featureTable = await input('agent-output/grande-negative-comparison-2026-10-07T19-08-02-694Z/results.json')
const baseline = await input('agent-output/stockfish-specials-simple-2026-10-07T19-25-40-871Z/results.json')
const allowed = new Set(['src/data/openingPositions.json', ...ids.flatMap(id => [
  `tests/fixtures/qa/${id}.json`, `tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`,
])])
const sourceHashes = new Map()
for (const source of [...featureTable.watched, ...baseline.sources]) {
  if (!allowed.has(source.path)) throw Error('Source outside fixed whitelist')
  if (sourceHashes.has(source.path) && sourceHashes.get(source.path) !== source.sha256) throw Error('Conflicting source hash')
  sourceHashes.set(source.path, source.sha256)
}
for (const [path, sha256] of sourceHashes) {
  if (hash(await readFile(new URL(path, root))) !== sha256) throw Error('Source no longer matches feature extraction')
  watched.push({ path, sha256 })
}
if (featureTable.rows.length !== baseline.rows.length) throw Error('Source length mismatch')
const samples = featureTable.rows.map((row, index) => {
  const old = baseline.rows[index]
  if (!ids.includes(row.gameId) || row.gameId !== old.gameId || row.ply !== old.ply || row.expected !== old.expected || row.san !== old.san) throw Error('Feature identity mismatch')
  const game = new Chess(row.fenBefore), side = game.turn()
  const move = game.move(row.san)
  if (game.fen() !== row.fenAfter || move.color !== side) throw Error('Invalid feature position')
  const primary = row.parentScores
  const primaryProbability = Number.isInteger(primary.bestMate) && primary.bestMate !== 0
    ? Number(primary.bestMate > 0) : primary.bestMate == null && Number.isFinite(primary.bestCp) ? calculateWinProbability(primary.bestCp) : null
  const features = {
    capture: row.features.capture, majorCapture: row.features.captureRookOrQueen,
    check: row.features.check, doubleAttack: row.features.geometricDoubleAttack, kingQueenAttack: row.features.kingAndQueenAttack,
    recapture: row.features.recapture, answerToCheck: row.features.answerToCheck,
    afterError: row.features.afterLocalNumericalError, mateSignal: row.features.mateSignal,
    persistentGain: row.pvMaterial?.deltaAt4Ply == null ? null : row.features.gainPersistsAt4Ply,
    largeComparableGap: row.sameDepthPvGapCp == null ? null : row.sameDepthPvGapCp >= 200,
    winningPrimary: primaryProbability == null ? null : primaryProbability >= 0.75,
  }
  const eligible = old.base === 'Migliore' && row.features.playedIsPv1 && !old.isBookMove
    && !old.deliveredMate && new Chess(row.fenBefore).moves().length >= 2 && old.predicted !== 'Geniale'
  return { gameId: row.gameId, group: row.group, ply: row.ply, san: row.san, expected: row.expected,
    base: old.base, v1: old.predicted, excluded: old.excluded, eligible, features, label: row.expected === 'Grande' }
})
const featureNames = Object.keys(samples[0].features)
const models = [], predictions = []
for (const policyName of Object.keys(RULE_POLICIES)) {
  for (const heldOut of personalIds) {
    const training = trainingWithoutGame(samples, personalIds, heldOut)
    if (training.some(s => s.gameId === heldOut)) throw Error('Held-out game leaked into training')
    const model = learnGrandeRules(training, featureNames, policyName)
    models.push({ policyName, heldOut, trainingGames: personalIds.filter(id => id !== heldOut), model })
    for (const sample of samples.filter(s => s.gameId === heldOut)) {
      const predicted = sample.v1 === 'Geniale' ? 'Geniale' : sample.eligible && predictsGrande(sample.features, model) ? 'Grande' : sample.base
      predictions.push({ ...sample, policyName, evaluation: 'leave-game-out', predicted })
    }
  }
  const model = learnGrandeRules(samples.filter(s => s.group === 'development' && s.eligible), featureNames, policyName)
  models.push({ policyName, heldOut: 'historical-separate', trainingGames: personalIds, model })
  for (const sample of samples.filter(s => s.group === 'historical')) {
    const predicted = sample.v1 === 'Geniale' ? 'Geniale' : sample.eligible && predictsGrande(sample.features, model) ? 'Grande' : sample.base
    predictions.push({ ...sample, policyName, evaluation: 'historical-separate', predicted })
  }
}
function metrics(rows, field) {
  const own = rows.filter(r => !r.excluded), assigned = own.filter(r => r[field] === 'Grande'), expected = own.filter(r => r.expected === 'Grande')
  const tp = assigned.filter(r => r.expected === 'Grande').length
  return { included: own.length, eligible: own.filter(r => r.eligible).length, expected: expected.length,
    assigned: assigned.length, tp, fp: assigned.length - tp, fn: expected.length - tp,
    precision: assigned.length ? tp / assigned.length : null, recall: expected.length ? tp / expected.length : null,
    expectedOutsideFilter: expected.filter(r => !r.eligible).length,
    matches: own.filter(r => r[field] === r.expected).length }
}
const results = ['development', 'historical'].flatMap(group => [
  { group, version: 'v1-known-development-baseline', ...metrics(samples.filter(s => s.group === group), 'v1') },
  ...Object.keys(RULE_POLICIES).map(policyName => ({ group, version: policyName, ...metrics(predictions.filter(p => p.group === group && p.policyName === policyName), 'predicted') })),
])
const perGame = Object.keys(RULE_POLICIES).flatMap(policyName => ids.map(gameId => ({ policyName, gameId,
  ...metrics(predictions.filter(p => p.gameId === gameId && p.policyName === policyName), 'predicted') })))
for (const source of watched) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Input changed during experiment')
const summary = { searchesExecuted: 0, sourceHashesUnchanged: true, allTrainingSplitsDisjoint: true,
  plies: samples.length, features: featureNames, policies: RULE_POLICIES, models: models.length,
  appIntegration: false, independentValidation: false, results, perGame }
const directory = new URL(`agent-output/grande-leave-game-out-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, models, predictions, watched }, null, 2) + '\n', { flag: 'wx' })
const format = value => value == null ? 'n/d' : `${(100 * value).toFixed(1)}%`
const ruleText = rule => rule.predicates.map(p => `${p.value ? '' : 'non '}${p.name}`).join(' AND ')
const report = ['# Grande — regole verificate lasciando fuori una partita', '',
  'Protocollo: ../grande-leave-game-out-v1-protocol.md. Dati personali già usati per sviluppo: il confronto per partita non è una validazione nuova indipendente. Storiche già esaminate, tenute fuori dall’addestramento.', '',
  '| Gruppo | Metodo | Assegnate | TP | FP | FN | Precisione | Richiamo |', '|---|---|---:|---:|---:|---:|---:|---:|',
  ...results.map(r => `| ${r.group} | ${r.version} | ${r.assigned} | ${r.tp} | ${r.fp} | ${r.fn} | ${format(r.precision)} | ${format(r.recall)} |`), '',
  '## Regole in tutti i modelli', '',
  ...models.flatMap(m => [`### ${m.policyName}, esclusa ${m.heldOut}`, `Training: ${m.model.trainingRows} mosse, ${m.model.trainingPositives} Grande.`,
    ...m.model.rules.map(r => `- ${ruleText(r)}; nuovi TP training=${r.trainingNewTp}, FP=${r.trainingNewFp}, stima interna=${format(r.laplacePrecision)}.`),
    ...(m.model.rules.length ? [] : ['Nessuna regola soddisfa i criteri preventivi.']), '']),
  '## Tutte le previsioni Grande e tutte le Grande attese', '',
  '| Politica | Partita | Ply | SAN | Atteso | Previsto |', '|---|---|---:|---|---|---|',
  ...predictions.filter(p => p.predicted === 'Grande' || p.expected === 'Grande').map(p => `| ${p.policyName} | ${p.gameId} | ${p.ply} | ${p.san} | ${p.expected} | ${p.predicted} |`), '',
  'Geniale v1 conservata; nessun nuovo modello Geniale addestrato. Zero nuove ricerche motore, soglie e file precedenti intatti. Hash sorgenti invariati. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, finalModels: models.filter(m => m.heldOut === 'historical-separate') }, null, 2))
