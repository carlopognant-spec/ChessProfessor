import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'

const dir = 'agent-output/ordinary-depth-check-v1'
const results = JSON.parse(await readFile(`${dir}/results.json`, 'utf8'))
const manifest = JSON.parse(await readFile(`${dir}/manifest.json`, 'utf8'))
for (const s of results.sources) {
  if (createHash('sha256').update(await readFile(s.path)).digest('hex') !== s.sha256) throw Error(`Source changed: ${s.path}`)
}
const labels = { best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', unclassified: 'Non valutabile' }
const rows = []
for (const row of results.rows) {
  const before = JSON.parse(await readFile(`${dir}/search-${String(row.i * 2).padStart(2, '0')}.json`, 'utf8'))
  const after = JSON.parse(await readFile(`${dir}/search-${String(row.i * 2 + 1).padStart(2, '0')}.json`, 'utf8'))
  const entry = manifest.cases[row.i].entry
  const legacy = classifyAnalysisEntries([{ ...entry, isBookMove: false,
    ...moveEvaluationFields(before.engine, after.engine, entry.uci) }])[0]
  rows.push({ id: row.id, ply: row.ply, san: row.san, expected: row.expected,
    baseline200k: row.before.category, legacy1M: labels[legacy.classification], coherent1M: row.after.category,
    legacyDrop: legacy.dropPct, coherentDrop: row.after.dropPct, legacySource: legacy.evaluationSource,
    coherentSource: row.after.evidence.source })
}
const summary = { newSearches: 0, baselineCorrect: rows.filter(r => r.baseline200k === r.expected).length,
  legacy1MCorrect: rows.filter(r => r.legacy1M === r.expected).length,
  coherent1MCorrect: rows.filter(r => r.coherent1M === r.expected).length,
  methodLabelDifferencesAt1M: rows.filter(r => r.legacy1M !== r.coherent1M).length,
  appChanged: false, selectedDiagnosticSample: true }
await writeFile(`${dir}/offline-method-comparison.json`, JSON.stringify({ summary, rows }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ summary, rows }, null, 2))
