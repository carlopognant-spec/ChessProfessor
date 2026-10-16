// Offline diagnosis and one isolated ablation; no engine transport imports.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { classifyReviewedMove, applyMoveFacts } from '../src/lib/reviewEvaluation.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { collectSacrificeEvidence } from '../src/lib/sacrificeEvidence.js'
import { SPECIAL_POLICY } from '../src/lib/specialClassification.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'

const area = 'agent-output/special-diagnosis-v1', prior = 'agent-output/new-references-200k-v1'
const sha = b => createHash('sha256').update(b).digest('hex')
const sources = new Map()
async function input(path) { const b = await readFile(path); sources.set(path, sha(b)); return JSON.parse(b) }
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { assert.equal(sha(await readFile(s.path)), s.sha256); sources.set(s.path, s.sha256) }
for (const path of ['src/lib/specialClassification.js', 'src/lib/sacrificeEvidence.js', 'src/lib/materialRealization.js',
  'src/lib/moveOpportunities.js', 'src/lib/reviewEvaluation.js', 'src/lib/reviewMoves.js', 'src/lib/gameAnalysis.js',
  'scripts/diagnose-new-specials.js', `${area}/protocol.md`]) sources.set(path, sha(await readFile(path)))
const code = await readFile('src/lib/specialClassification.js', 'utf8')
const signature = 'function responseDecision(entry, previous, before, side, baseline) {'
assert.equal(code.split(signature).length, 2)
const variant = code.replace(signature, signature + '\n  return null; // Diagnostic ablation only.\n')
  .replace("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
  .replace(/from '(\.\/[^']+)'/g, (_, specifier) => `from '${new URL(specifier, new URL('../src/lib/specialClassification.js', import.meta.url)).href}'`)
const cloned = await import('data:text/javascript;base64,' + Buffer.from(variant).toString('base64'))
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const newResult = await input(`${prior}/results.json`), cases = []
for (const g of newResult.games) {
  const stored = await input(`${prior}/game-${g.id}.json`)
  cases.push({ cohort: 'new', id: g.id, entries: stored.liveEntries, expected: stored.rows.map(r => r.expected), stored: stored.entries })
}
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
for (const id of [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']) {
  const fixture = await input(`tests/fixtures/qa/${id}.json`)
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  assert.equal(cache.searchLimit.value, 200000); assert.equal(cache.packageVersion, '19.0.0')
  let before = 0, after = 0
  const entries = await analyzeGame({ moves: cache.entries.map(e => e.san), baseFen: cache.entries[0].fenBefore, openingBook: book,
    analyzePosition: async fen => { const e = cache.entries[before++]; assert.equal(e.fenBefore, fen); return e.engine },
    analyzePlayedPosition: async fen => { const e = cache.entries[after++]; assert.equal(e.fenAfter, fen); return e.playedEngine } })
  assert.equal(entries.length, fixture.annotations.length)
  cases.push({ cohort: 'old', id, entries, expected: fixture.annotations.map(a => a.category) })
  console.log(JSON.stringify({ oldLoaded: id, plies: entries.length }))
}
const rows = [], missed = [], sacrifices = []
const indexOf = line => line?.mate != null ? line.mate > 0 ? 1 : 0 : Number.isFinite(line?.evalCp) ? calculateWinProbability(line.evalCp) : null
for (const c of cases) {
  const current = reclassifyReviewedMoves(c.entries)
  if (c.stored) assert.deepEqual(JSON.parse(JSON.stringify(current)), c.stored)
  const changed = cloned.reclassifySpecialMoves(c.entries.map(classifyReviewedMove)).map(applyMoveFacts)
  for (const [i, e] of current.entries()) {
    const altered = changed[i], expected = c.expected[i]
    const row = { cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove, expected,
      current: labels[e.classification], variant: labels[altered.classification],
      currentReason: e.specialAssessment?.grande.reason, variantReason: altered.specialAssessment?.grande.reason,
      corrected: labels[e.classification] !== expected && labels[altered.classification] === expected,
      regressed: labels[e.classification] === expected && labels[altered.classification] !== expected }
    rows.push(row)
    if (c.cohort !== 'new') continue
    if (expected === 'Mossa mancata' || e.classification === 'missed') {
      const p = current[i - 1]
      missed.push({ ...row, reason: e.missedOpportunityReason, opportunity: e.missedOpportunity,
        previous: p ? { san: p.playedMove, base: p.baseClassification, numerical: p.numericalClassification,
          bestProbability: p.bestProbability, playedProbability: p.playedProbability } : null,
        before: p?.bestProbability != null ? 1 - p.bestProbability : null,
        offered: p?.playedProbability != null ? 1 - p.playedProbability : null,
        best: e.bestProbability, played: e.playedProbability, bestMate: e.bestMate, playedMate: e.playedMate,
        engineBest: e.isEngineBest, evidence: e.evaluationEvidence, assessment: e.specialAssessment })
    }
    if (expected === 'Geniale' || e.classification === 'brilliant') {
      const evidence = collectSacrificeEvidence(e, current[i + 1], SPECIAL_POLICY)
      const rawPacket = await input(`${prior}/search-${String((await input(`${prior}/manifest.json`)).schedule.find(t => t.fen === e.fenAfter).index).padStart(3, '0')}.json`)
      const offers = e.specialAssessment.brilliant.offers ?? []
      sacrifices.push({ ...row, fenAfter: e.fenAfter, brilliant: e.specialAssessment.brilliant, collectedEvidence: evidence,
        offers: offers.map(o => ({ uci: o.uci, san: o.san, movedPiece: o.movedPiece,
          acceptanceSnapshot: e.playedEngine.specialLines.filter(l => l.pv[0] === o.uci).map(l => ({ depth: l.depth, index: indexOf(l), pv: l.pv })),
          latestAcceptance: e.playedEngine.lines.filter(l => l.pv[0] === o.uci).map(l => ({ depth: l.depth, index: indexOf(l), pv: l.pv })),
          rawAcceptanceDepths: [...new Set(rawPacket.rawLines.filter(l => l.match(/\bpv (\S+)/)?.[1] === o.uci).map(l => Number(l.match(/\bdepth (\d+)/)?.[1] ?? 0)))],
          confirmation: evidence?.confirmations?.filter(x => x.captureUci === o.uci) ?? [] })) })
    }
  }
  console.log(JSON.stringify({ compared: c.id, cohort: c.cohort }))
}
const summary = ['new', 'old'].map(cohort => {
  const r = rows.filter(r => r.cohort === cohort), changes = r.filter(r => r.current !== r.variant)
  return { cohort, total: r.length, currentExact: r.filter(x => x.current === x.expected).length,
    variantExact: r.filter(x => x.variant === x.expected).length, changes: changes.length,
    corrected: changes.filter(x => x.corrected).length, regressed: changes.filter(x => x.regressed).length,
    greatCurrent: r.filter(x => x.current === 'Grande').length, greatVariant: r.filter(x => x.variant === 'Grande').length,
    greatCorrectCurrent: r.filter(x => x.current === 'Grande' && x.expected === 'Grande').length,
    greatCorrectVariant: r.filter(x => x.variant === 'Grande' && x.expected === 'Grande').length }
})
assert.equal(summary.find(s => s.cohort === 'new').currentExact, 167)
assert.equal(summary.find(s => s.cohort === 'old').currentExact, 329)
const missedReasons = {}
for (const r of missed.filter(r => r.expected === 'Mossa mancata' && r.current !== r.expected)) missedReasons[r.reason] = (missedReasons[r.reason] ?? 0) + 1
for (const [path, expected] of sources) assert.equal(sha(await readFile(path)), expected, path)
await mkdir(area, { recursive: true })
await writeFile(`${area}/variant-module.txt`, variant)
await writeFile(`${area}/results.json`, JSON.stringify({ newSearches: 0, applicationChanged: false, variantEnabled: false,
  retrospectiveExperiment: true, summary, missedReasons, missed, sacrifices, changes: rows.filter(r => r.current !== r.variant),
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })), variantSha256: sha(Buffer.from(variant)) }, null, 2) + '\n')
const report = ['# Diagnosi offline delle speciali', '', 'Zero nuove ricerche. Variante solo in memoria, non attivata nell’app.', '',
  '| Campione | Mosse | Esatte attuali | Esatte senza famiglia empirica | Recuperi | Regressioni | Grandi corrette attuali | Grandi corrette variante |',
  '|---|---:|---:|---:|---:|---:|---:|---:|', ...summary.map(s => `| ${s.cohort} | ${s.total} | ${s.currentExact} | ${s.variantExact} | ${s.corrected} | ${s.regressed} | ${s.greatCorrectCurrent} | ${s.greatCorrectVariant} |`), '',
  'Disattivata solo responseDecision nella copia del modulo; tutte le altre famiglie sono state ricalcolate nella sequenza. Studio retrospettivo, non validazione della variante.', '',
  '## Mancate attese non riconosciute: primo motivo registrato', '', ...Object.entries(missedReasons).map(([reason, n]) => `- ${reason}: ${n}`), '',
  '| Partita | Ply | Mossa | App | Motivo | Prima | Offerta | Migliore | Giocata |', '|---|---:|---|---|---|---:|---:|---:|---:|',
  ...missed.filter(r => r.expected === 'Mossa mancata').map(r => `| ${r.game} | ${r.ply} | ${r.san} | ${r.current} | ${r.reason} | ${r.before?.toFixed(3) ?? 'N/D'} | ${r.offered?.toFixed(3) ?? 'N/D'} | ${r.best?.toFixed(3) ?? 'N/D'} | ${r.played?.toFixed(3) ?? 'N/D'} |`), '',
  'Il motivo e la prima guardia che arresta il percorso, non prova che tutte le altre condizioni sarebbero soddisfatte.', '',
  '## Sacrifici', '', ...sacrifices.flatMap(r => [`### ${r.game}, ply ${r.ply}, ${r.san}`, '',
    `Riferimento ${r.expected}, app ${r.current}; motivo ${r.brilliant.reason}.`,
    ...r.offers.map(o => `- ${o.san}: snapshot accettazione ${o.acceptanceSnapshot.length}, linee recenti ${o.latestAcceptance.length}, profondita presenti nei raw ${o.rawAcceptanceDepths.join(', ') || 'nessuna'}, conferme dopo presa ${o.confirmation.length}.`), '']),
  '## Cambi della variante', '', '| Campione | Partita | Ply | Mossa | Attesa | Attuale | Variante |', '|---|---|---:|---|---|---|---|',
  ...rows.filter(r => r.current !== r.variant).map(r => `| ${r.cohort} | ${r.game} | ${r.ply} | ${r.san} | ${r.expected} | ${r.current} | ${r.variant} |`), '',
  'Input e sorgenti invariati; 20 sorgenti congelate verificate. Vecchie cache e nuovo campione restano distinti. Dettagli e hash in results.json.', '']
await writeFile(`${area}/report.md`, report.join('\n'))
console.log(JSON.stringify({ summary, missedReasons, sacrifices: sacrifices.map(s => ({ game: s.game, ply: s.ply, reason: s.brilliant.reason, offers: s.offers.map(o => ({ san: o.san, rawDepths: o.rawAcceptanceDepths, snapshot: o.acceptanceSnapshot.length, confirmations: o.confirmation.length })) })) }, null, 2))
