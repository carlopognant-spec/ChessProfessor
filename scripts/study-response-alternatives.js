// Offline predeclared hypothesis. No engine imports, no app writes.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { classifyReviewedMove, applyMoveFacts } from '../src/lib/reviewEvaluation.js'
import { selectRefinementView } from '../src/lib/analysisRefinement.js'

const area = 'agent-output/grande-response-alternatives-study-v1', watched = new Map()
const sha = b => createHash('sha256').update(b).digest('hex')
async function input(path) { const b = await readFile(path); watched.set(path, sha(b)); return JSON.parse(b) }
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { assert.equal(sha(await readFile(s.path)), s.sha256, s.path); watched.set(s.path, s.sha256) }
for (const path of ['scripts/study-response-alternatives.js', `${area}/protocol.md`, 'src/lib/specialClassification.js',
  'src/lib/sacrificeSearches.js', 'src/lib/analysisRefinement.js', 'src/lib/sacrificeEvidence.js',
  'src/lib/reviewMoves.js', 'src/lib/reviewEvaluation.js', 'src/lib/materialRealization.js', 'src/lib/gameAnalysis.js']) watched.set(path, sha(await readFile(path)))
const code = await readFile('src/lib/specialClassification.js', 'utf8')
const helper = `function equivalentResponseAlternative(entry, roots) {
  const requested = entry.engine?.analysisMetadata?.multiPv
  if (roots.status !== 'available' || !roots.coherent || roots.coverage.source !== 'completed-snapshot'
    || !Number.isSafeInteger(requested) || requested < 2
    || roots.raw.length !== Math.min(requested, roots.coverage.legal)
    || roots.raw.some(line => line.bound || line.lowerbound || line.upperbound)
    || roots.lines[0].uci !== entry.playedUci || roots.raw[0].mate != null
    || primary(entry.engine)?.pv?.[0] !== entry.playedUci
    || score(primary(entry.engine)) == null
    || Math.abs(score(primary(entry.engine)) - roots.lines[0].score) > SPECIAL_POLICY.consistency) return null
  const alternative = roots.lines.slice(1).find((line, index) => roots.raw[index + 1].mate == null
    && 100 * (roots.lines[0].score - line.score) <= ENGINE_CONFIG.classification.excellent)
  return alternative ? { uci: alternative.uci, lossPct: 100 * (roots.lines[0].score - alternative.score),
    depth: alternative.depth, san: alternative.events.map(e => e.san).slice(0, 8) } : null
}
`
let candidateSource = "import { ENGINE_CONFIG } from './engineConfig.js'\n" + code
const signature = 'function responseDecision(entry, previous, before, side, baseline) {'
assert.equal(code.split(signature).length, 2)
candidateSource = candidateSource.replace(signature, helper + 'function responseDecision(entry, previous, before, side, baseline, roots) {')
const marker = "  return { status: 'supported', reason: 'best-noncapture-after-opponent-error',"
assert.equal(code.split(marker).length, 2)
candidateSource = candidateSource.replace(marker, '  if (equivalentResponseAlternative(entry, roots)) return null\n' + marker)
const call = '    const response = responseDecision(entry, previous, before, side, baseline)'
assert.equal(code.split(call).length, 2)
candidateSource = candidateSource.replace(call, '    const roots = rootEvidence(entry, before, side, baseline)\n    const response = responseDecision(entry, previous, before, side, baseline, roots)')
candidateSource = candidateSource.replace("    const roots = rootEvidence(entry, before, side, baseline)\n    if (roots.status", '    if (roots.status')
const moduleCode = candidateSource.replace("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
  .replace(/from '(\.\/[^']+)'/g, (_, specifier) => `from '${new URL(specifier, new URL('../src/lib/specialClassification.js', import.meta.url)).href}'`)
const candidate = await import('data:text/javascript;base64,' + Buffer.from(moduleCode).toString('base64'))
const label = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale',
  missed: 'Mossa mancata', unclassified: 'Non valutabile' }, cases = []
const measured = await input('agent-output/new-refinement-measurement-v1/results.json')
for (const g of measured.perGame) {
  const initial = await input(`agent-output/new-references-200k-v1/game-${g.id}.json`)
  const refined = await input(`agent-output/new-refinement-measurement-v1/game-${g.id}-round-2.json`)
  const ref = await input(`Partite/Confermate/chesscom-${g.id}/riferimento.json`)
  cases.push({ cohort: 'new-initial', id: g.id, entries: initial.liveEntries, expected: ref.annotations.map(a => a.category) })
  cases.push({ cohort: 'new-refined', id: g.id, entries: selectRefinementView(refined.entries, true), expected: ref.annotations.map(a => a.category) })
}
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
for (const id of [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']) {
  const ref = await input(`tests/fixtures/qa/${id}.json`)
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  let before = 0, after = 0
  const entries = await analyzeGame({ moves: cache.entries.map(e => e.san), baseFen: cache.entries[0].fenBefore, openingBook: book,
    analyzePosition: async fen => { const e = cache.entries[before++]; assert.equal(e.fenBefore, fen); return e.engine },
    analyzePlayedPosition: async fen => { const e = cache.entries[after++]; assert.equal(e.fenAfter, fen); return e.playedEngine } })
  cases.push({ cohort: 'old', id, entries, expected: ref.annotations.map(a => a.category) })
  console.log(JSON.stringify({ loaded: id }))
}
const rows = [], empiricalCases = []
for (const c of cases) {
  const preserved = JSON.stringify(c.entries), current = reclassifyReviewedMoves(c.entries)
  const altered = candidate.reclassifySpecialMoves(c.entries.map(classifyReviewedMove)).map(applyMoveFacts)
  for (const [i, e] of current.entries()) {
    const a = altered[i], expected = c.expected[i]
    const row = { cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove, expected,
      before: label[e.classification], after: label[a.classification], reasonBefore: e.specialAssessment?.grande.reason,
      reasonAfter: a.specialAssessment?.grande.reason, corrected: label[e.classification] !== expected && label[a.classification] === expected,
      regressed: label[e.classification] === expected && label[a.classification] !== expected }
    rows.push(row)
    if (e.specialAssessment?.grande.reason === 'best-noncapture-after-opponent-error') empiricalCases.push({ ...row,
      fenBefore: e.fenBefore, fenAfter: e.fenAfter, snapshot: e.engine?.specialLines,
      previous: current[i - 1]?.playedMove, assessment: e.specialAssessment.grande })
  }
  assert.equal(JSON.stringify(c.entries), preserved)
  console.log(JSON.stringify({ compared: c.id, cohort: c.cohort }))
}
const summaries = ['new-initial', 'new-refined', 'old'].map(cohort => {
  const r = rows.filter(r => r.cohort === cohort), changed = r.filter(r => r.before !== r.after)
  return { cohort, total: r.length, before: r.filter(r => r.before === r.expected).length, after: r.filter(r => r.after === r.expected).length,
    corrected: changed.filter(r => r.corrected).length, regressed: changed.filter(r => r.regressed).length,
    otherChanges: changed.filter(r => !r.corrected && !r.regressed).length,
    greatCorrectBefore: r.filter(r => r.before === 'Grande' && r.expected === 'Grande').length,
    greatCorrectAfter: r.filter(r => r.after === 'Grande' && r.expected === 'Grande').length,
    greatExcessBefore: r.filter(r => r.before === 'Grande' && r.expected !== 'Grande').length,
    greatExcessAfter: r.filter(r => r.after === 'Grande' && r.expected !== 'Grande').length }
})
assert.deepEqual(summaries.map(s => s.before), [170, 180, 329])
const accepted = summaries.every(s => s.regressed === 0 && s.greatCorrectAfter >= s.greatCorrectBefore)
for (const [path, expected] of watched) assert.equal(sha(await readFile(path)), expected, path)
await mkdir(area, { recursive: true })
await writeFile(`${area}/candidate-source.js.txt`, candidateSource, { flag: 'wx' })
await writeFile(`${area}/results.json`, JSON.stringify({ newSearches: 0, applicationChanged: false, acceptedForImplementation: accepted,
  independentValidation: false, summaries, changes: rows.filter(r => r.before !== r.after), empiricalCases,
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })), candidateSha256: sha(Buffer.from(candidateSource)) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(`${area}/report.md`, ['# Alternative quasi equivalenti alla risposta migliore', '',
  'Ipotesi preregistrata, soglia Ottima già attiva, solo snapshot completi e punteggi senza matto. Zero nuove ricerche.',
  'Campioni già osservati, non validazione indipendente. Variante soltanto in memoria.', '',
  '| Campione | Prima | Proposta | Correzioni | Regressioni | Grande corrette prima/dopo | In eccesso prima/dopo |', '|---|---:|---:|---:|---:|---:|---:|',
  ...summaries.map(s => `| ${s.cohort} | ${s.before}/${s.total} | ${s.after}/${s.total} | ${s.corrected} | ${s.regressed} | ${s.greatCorrectBefore}/${s.greatCorrectAfter} | ${s.greatExcessBefore}/${s.greatExcessAfter} |`), '',
  `Supera il controllo di non regressione: ${accepted ? 'sì' : 'no'}.`, '',
  ...rows.filter(r => r.before !== r.after).map(r => `- ${r.cohort}, ${r.game}, ply ${r.ply}, ${r.san}: ${r.before} → ${r.after}; confermata ${r.expected}.`), '',
  'Non conclude che ogni risposta senza presa sia ordinaria. Altre famiglie critiche e Geniale restano attive.', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ summaries, acceptedForImplementation: accepted, newSearches: 0 }, null, 2))
