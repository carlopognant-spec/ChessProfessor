import { readFile, writeFile, appendFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compare, summarizeReports } from './qa/compare.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

// Read-only reclassification of the completed run; no engine searches.
const root = fileURLToPath(new URL('../', import.meta.url))
const parent = path.join(root, 'tests/fixtures/qa/analysis-cache-large-200k')
const output = path.resolve(process.argv[2] ?? '')
if (!output.startsWith(parent + path.sep) || process.argv.length !== 3) throw Error('Serve la cartella di una nuova esecuzione 2.2b')
const json = async file => JSON.parse(await readFile(file, 'utf8'))
const summary = await json(path.join(output, 'summary.json'))
if (!summary.completed || summary.budget !== 200000) throw Error('Esecuzione incompleta o budget inatteso')
const app = await json(path.join(output, 'classifications.json'))
const base = path.join(root, 'tests/fixtures/qa')
const suspects = await json(path.join(base, 'suspect-labels.json'))
const book = createOpeningBook((await json(path.join(root, 'src/data/openingPositions.json'))).positions)
const legacy = { baseline: [], candidate: [] }, diagnostics = []
for (const report of app.candidate) {
  const id = report.id
  if (!/^personal-0[1-6]$/.test(id) && !['game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843'].includes(id)) throw Error('ID fuori whitelist')
  const fixture = { ...await json(path.join(base, id + '.json')), id }
  const baseline = await json(path.join(base, 'analysis-cache', id + '.json'))
  const candidate = await json(path.join(output, id + '.json'))
  for (const [scheme, cache] of [['baseline', baseline], ['candidate', candidate]]) legacy[scheme].push(compare(fixture, cache, suspects, { openingBook: book }))
  const old = app.baseline.find(r => r.id === id)
  const eligible = report.rows.filter((row, i) => !row.reasons.length && !old.rows[i].reasons.length)
  const searches = candidate.entries.flatMap(e => [e.engine, e.playedEngine])
  diagnostics.push({ id, sameEligibleCohort: eligible.length,
    changedToExpected: report.rows.filter((row, i) => !row.reasons.length && !old.rows[i].reasons.length && row.actual === row.expected && old.rows[i].actual !== row.expected).length,
    changedAwayFromExpected: report.rows.filter((row, i) => !row.reasons.length && !old.rows[i].reasons.length && row.actual !== row.expected && old.rows[i].actual === row.expected).length,
    unchangedBookFlags: report.rows.every((row, i) => row.isBookMove === old.rows[i].isBookMove),
    searchesBelowNodeBudget: searches.filter(r => r.actualNodes < 200000).length,
    minActualNodes: Math.min(...searches.map(r => r.actualNodes)), maxActualNodes: Math.max(...searches.map(r => r.actualNodes)),
    primaryDepths: [...new Set(searches.map(r => r.lines[0]?.depth ?? null))].sort((a, b) => a - b),
    legacyQaBookDifferences: legacy.candidate.at(-1).rows.filter((row, i) => row.actual !== report.rows[i].actual).map(row => ({ ply: row.ply, expected: row.expected, legacyActual: row.actual, appActual: 'Libro', excluded: row.reasons })) })
}
const groups = ['personal', 'historical', 'all'].map(group => {
  const include = r => group === 'all' || r.id.startsWith(group === 'personal' ? 'personal-' : 'game-')
  return { group, legacyBaseline: summarizeReports(legacy.baseline.filter(include)), legacyCandidate: summarizeReports(legacy.candidate.filter(include)),
    appBaseline: summarizeReports(app.baseline.filter(include)), appCandidate: summarizeReports(app.candidate.filter(include)) }
})
const transitions = {}
for (const change of summary.changes) {
  const key = change.oldCategory + ' -> ' + change.newCategory
  transitions[key] = (transitions[key] ?? 0) + 1
}
const extra = { groups, diagnostics, transitions,
  changedToExpected: diagnostics.reduce((s, r) => s + r.changedToExpected, 0), changedAwayFromExpected: diagnostics.reduce((s, r) => s + r.changedAwayFromExpected, 0),
  unchangedBookFlags: diagnostics.every(r => r.unchangedBookFlags) }
await writeFile(path.join(output, 'additional-statistics.json'), JSON.stringify(extra, null, 2) + '\n', { flag: 'wx' })
const line = (group, scheme, r) => `| ${group} | ${scheme} | ${r.exact}/${r.included} | ${r.exactPct.toFixed(2)}% | ${r.withinOne}/${r.ordinalIncluded} | ${r.withinOnePct.toFixed(2)}% |`
await appendFile(path.join(output, 'report.md'), ['','## Comparabilità con i rapporti QA precedenti','',
  'La baseline pubblicata 256/503 e 439/493 deriva dal helper QA che conserva categorie numeriche nelle righe Libro. La tabella principale usa le categorie effettive dell’app, con Libro protetto. H1 ply 13–14 sono Libro locale ma attesi Migliore: questa differenza di rappresentazione è mostrata, non corretta modificando il repertorio o le attese. Tabelle separate evitano di attribuirla al motore. Stesse esclusioni e nessuna modifica alle regole.', '',
  '| Gruppo | Schema | Esatta | % | Entro una classe | % |','|---|---|---:|---:|---:|---:|',
  ...groups.flatMap(g => [line(g.group, 'QA precedente baseline', g.legacyBaseline), line(g.group, 'QA precedente large 200k', g.legacyCandidate), line(g.group, 'App baseline', g.appBaseline), line(g.group, 'App large 200k', g.appCandidate)]), '',
  '## Metriche app per partita','', '| Partita | Schema | Esatta | % | Entro una classe | % |','|---|---|---:|---:|---:|---:|',
  ...app.candidate.flatMap(r => [line(r.id, 'baseline', app.baseline.find(o => o.id === r.id)), line(r.id, 'large 200k', r)]), '',
  `Fra le mosse incluse in entrambi gli schemi: ${extra.changedToExpected} diventano esatte, ${extra.changedAwayFromExpected} perdono la corrispondenza esatta. Flag Libro invariati: ${extra.unchangedBookFlags}.`, '',
  '## Diagnostica nodi, depth e transizioni','', '```json', JSON.stringify({ diagnostics, transitions }, null, 2), '```',''].join('\n'))
console.log(JSON.stringify(extra, null, 2))
