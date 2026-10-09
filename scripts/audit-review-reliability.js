import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { REVIEW_POLICY_VERSION } from '../src/lib/reviewEvaluation.js'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const baselinePath = 'agent-output/special-classification-2026-10-09T14-30-16-854Z/results.json'
const dirs = (await readdir('agent-output')).filter(name => /^special-classification-\d{4}-/.test(name)).sort()
const currentPath = process.argv[2] ?? `agent-output/${dirs.at(-1)}/results.json`
const baselineBytes = await readFile(baselinePath), currentBytes = await readFile(currentPath)
const baseline = JSON.parse(baselineBytes), current = JSON.parse(currentBytes)
for (const source of current.sources) {
  if (hash(await readFile(source.path)) !== source.sha256) throw Error(`Current audit source changed: ${source.path}`)
}
for (const source of baseline.sources.filter(s => s.path.startsWith('tests/fixtures/') || s.path === 'src/data/openingPositions.json')) {
  if (hash(await readFile(source.path)) !== source.sha256) throw Error(`Baseline data changed: ${source.path}`)
}
const labels = { book: 'Libro', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', missed: 'Mossa mancata', great: 'Grande', brilliant: 'Geniale',
  forced: 'Forzata', unclassified: 'Non valutabile' }
const rows = current.rows.map((row, i) => {
  const old = baseline.rows[i]
  if (row.id !== old.id || row.ply !== old.ply || row.san !== old.san || row.expected !== old.expected
    || row.evaluationEvidence?.version !== REVIEW_POLICY_VERSION) throw Error('Noncomparable audits')
  return { ...row, baseline: old.after, corrected: labels[old.after] !== row.expected && labels[row.after] === row.expected,
    regressed: labels[old.after] === row.expected && labels[row.after] !== row.expected }
})
const categories = Object.entries(labels).map(([category, expected]) => {
  const subset = rows.filter(row => row.expected === expected)
  return { category, expected, total: subset.length,
    before: subset.filter(row => labels[row.baseline] === expected).length,
    after: subset.filter(row => labels[row.after] === expected).length,
    falsePositives: rows.filter(row => row.after === category && row.expected !== expected).length }
})
const evidence = rows.reduce((out, row) => {
  const status = row.evaluationEvidence.status
  out[status] = (out[status] ?? 0) + 1
  return out
}, {})
const changes = rows.filter(row => row.baseline !== row.after)
const summary = { reviewPolicy: REVIEW_POLICY_VERSION, specialPolicy: current.summary.version,
  plies: rows.length, before: categories.reduce((n, c) => n + c.before, 0), after: categories.reduce((n, c) => n + c.after, 0),
  corrected: rows.filter(row => row.corrected).length, regressed: rows.filter(row => row.regressed).length,
  changes: changes.length, evidence, newSearches: 0, independentValidation: false, frozenSourcesUnchanged: true }
const sources = [...current.sources, { path: baselinePath, sha256: hash(baselineBytes) },
  { path: currentPath, sha256: hash(currentBytes) },
  ...await Promise.all(['scripts/audit-review-reliability.js', 'agent-output/review-reliability-v1-protocol.md']
    .map(async path => ({ path, sha256: hash(await readFile(path)) })))]
for (const source of sources) if (hash(await readFile(source.path)) !== source.sha256) throw Error(`Source changed: ${source.path}`)
const dir = `agent-output/review-reliability-${new Date().toISOString().replace(/[:.]/g, '-')}`
await mkdir(dir)
await writeFile(`${dir}/results.json`, JSON.stringify({ summary, categories, changes, sources }, null, 2) + '\n', { flag: 'wx' })
await writeFile(`${dir}/report.md`, ['# Confronto dopo il miglioramento dei dati numerici', '',
  ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
  '| Categoria attesa | Totale | Prima corrette | Dopo corrette | Falsi positivi dopo |', '|---|---:|---:|---:|---:|',
  ...categories.map(c => `| ${c.expected} | ${c.total} | ${c.before} | ${c.after} | ${c.falsePositives} |`), '',
  '## Cambiamenti', '', ...changes.map(r => `- ${r.id}/${r.ply} ${r.san}: ${labels[r.baseline]} -> ${labels[r.after]}; attesa ${r.expected}.`), '',
  '## Interpretazione', '',
  'Il guadagno di concordanza riguarda le tre Forzate. Le altre etichette restano invariate sulle cache originarie, che non contengono snapshot completati. Il confronto coerente migliora il percorso delle nuove analisi; qui si verifica la regressione, non un aumento dimostrato per Buona, Imprecisione o Errore. Nessun fitting, rating o nuova curva.', '',
  'Indipendente significa confronto indicativo fra due ricerche; conflicting significa perdita grezza negativa fra quelle stime. Le etichette numeriche restano conservate e il limite è mostrato nel resoconto. La prima scelta del motore mantiene perdita zero nella stessa ricerca. Libro e Forzata conservano la categoria numerica separata.', '',
  'Le partite sono già studiate: nessuna validazione indipendente o equivalenza con Chess.com è dichiarata. Nessuna lettura delle partite riservate 7–10 e nessuna nuova ricerca motore.', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ output: dir, summary, categories }, null, 2))
