import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Chess } from 'chess.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { classifySpecialMove } from '../src/lib/specialClassification.js'
import { collectSacrificeEvidence } from '../src/lib/sacrificeEvidence.js'

const sources = new Map(), sha = b => createHash('sha256').update(b).digest('hex')
async function input(path, json = true) {
  const bytes = await readFile(path); sources.set(path, sha(bytes))
  return json ? JSON.parse(bytes) : bytes.toString('utf8')
}
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { if (sha(await readFile(s.path)) !== s.sha256) throw Error(`Frozen source changed: ${s.path}`); sources.set(s.path, s.sha256) }
for (const path of ['scripts/audit-glek-followup.js', 'agent-output/glek-followup-v1-protocol.md',
  'src/lib/reviewMoves.js', 'src/lib/reviewEvaluation.js', 'src/lib/specialClassification.js',
  'src/lib/multiPvEvidence.js', 'src/lib/sacrificeEvidence.js', 'src/lib/moveOpportunities.js', 'src/lib/materialRealization.js']) await input(path, false)
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
function goodCandidate(entries) {
  return entries.map((entry, i) => {
    if (entry.classification !== 'good') return entry
    const checked = classifySpecialMove({ ...entry, classification: 'excellent', baseClassification: 'excellent', specialAssessment: undefined },
      entries[i - 1], entries[i - 2], collectSacrificeEvidence(entry, entries[i + 1]))
    return { ...entry, classification: checked.classification === 'brilliant' ? 'brilliant' : entry.classification,
      candidateAssessment: checked.specialAssessment }
  })
}
const baseline = await input('agent-output/special-classification-2026-10-09T16-46-52-935Z/results.json')
const rows = []
for (const id of [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']) {
  const fixture = await input(`tests/fixtures/qa/${id}.json`)
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  let active = true
  const raw = cache.entries.map(e => {
    const isBookMove = active && !new Chess(e.fenAfter).isCheckmate() && book.hasPosition(e.fenAfter)
    if (!isBookMove) active = false
    return { ...e, playedMove: e.san, playedUci: e.uci, side: e.fenBefore.split(' ')[1], isBookMove }
  })
  const current = reclassifyReviewedMoves(raw), candidate = goodCandidate(current)
  current.forEach((e, i) => {
    const old = baseline.rows.find(r => r.id === id && r.ply === e.ply)
    if (!old || old.after !== e.classification) throw Error(`Production baseline changed: ${id}/${e.ply}`)
    rows.push({ id, ply: e.ply, san: e.playedMove, expected: fixture.annotations.find(a => a.ply === e.ply).category,
      current: e.classification, candidate: candidate[i].classification, evidence: candidate[i].candidateAssessment?.brilliant ?? null })
  })
}
const records = await Promise.all(Array.from({ length: 13 }, (_, i) => input(`agent-output/glek-five-choices-v1/search-${String(i).padStart(2, '0')}.json`)))
const engines = Object.fromEntries(records.map(r => {
  const collector = createMultiPvEvidence(5)
  for (const raw of r.rawLines) collector.accept(raw)
  return [r.key, { ...r.engine, specialLines: collector.finish(r.bestmove) }]
}))
const game = new Chess(), fens = [game.fen()]
for (const m of ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'g3', 'Nxe4', 'Nxe4', 'd5', 'Nc3', 'd4']) { game.move(m); fens.push(game.fen()) }
const glek = []
for (const san of ['Qe2', 'd3', 'Bd3', 'Bb5', 'Bg2']) {
  const g = new Chess(game.fen()), move = g.move(san), after = g.fen(); g.move('dxc3')
  const variants = {}
  for (const scope of ['standard', 'targeted']) {
    const raw = [
      { ply: 11, playedMove: 'Nc3', playedUci: 'e4c3', fenBefore: fens[10], fenAfter: fens[11], classification: 'unclassified' },
      { ply: 12, playedMove: 'd4', playedUci: 'd5d4', fenBefore: fens[11], fenAfter: fens[12], engine: engines.history, playedEngine: engines.standard },
      { ply: 13, playedMove: san, playedUci: `${move.from}${move.to}`, fenBefore: fens[12], fenAfter: after, engine: engines[scope], playedEngine: engines[`after-${san}`] },
      { ply: 14, playedMove: 'dxc3', playedUci: 'd4c3', fenBefore: after, fenAfter: g.fen(), engine: engines[`after-${san}`], playedEngine: engines[`accepted-${san}`] },
    ]
    const current = reclassifyReviewedMoves(raw), candidate = goodCandidate(current), target = current[2]
    variants[scope] = { current: target.classification, candidate: candidate[2].classification,
      numerical: target.numericalClassification, dropPct: target.dropPct,
      reason: target.specialAssessment.brilliant.reason, candidateReason: candidate[2].candidateAssessment?.brilliant.reason ?? null }
  }
  glek.push({ san, referenceGameReview: 'brilliant', referenceExplorer: san === 'Bg2' ? 'best' : null, ...variants })
}
const categories = Object.entries(labels).map(([key, label]) => {
  const subset = rows.filter(r => r.expected === label)
  return { category: key, label, total: subset.length, correct: subset.filter(r => r.current === key).length,
    candidateCorrect: subset.filter(r => r.candidate === key).length,
    falsePositives: rows.filter(r => r.current === key && r.expected !== label).length,
    candidateFalsePositives: rows.filter(r => r.candidate === key && r.expected !== label).length }
})
const changed = rows.filter(r => r.current !== r.candidate)
const summary = { plies: rows.length, exact: categories.reduce((n, c) => n + c.correct, 0),
  candidateExact: categories.reduce((n, c) => n + c.candidateCorrect, 0), candidateChanges: changed.length,
  productionBaselineReproduced: true, newSearches: 0, thresholdsChanged: false,
  goodEligibilityCandidateActivated: false, independentValidation: false, sourceHashesUnchanged: true }
for (const [path, expected] of sources) if (sha(await readFile(path)) !== expected) throw Error(`Source changed: ${path}`)
const dir = `agent-output/glek-followup-${new Date().toISOString().replace(/[:.]/g, '-')}`
await mkdir(dir)
await writeFile(`${dir}/results.json`, JSON.stringify({ summary, categories, glek, changed, rows,
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(`${dir}/report.md`, ['# Riferimenti corretti e controllo completo', '',
  ...Object.entries(summary).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`), '',
  'Ag2: riferimento Game Review Geniale, Esploratore Migliore, come chiarito da Carlo. Tutte le cinque scelte hanno riferimento Game Review Geniale. I report precedenti restano conservati come storico.', '',
  '| Categoria | Attese | Corrette attuali | Corrette candidato Buona | FP attuali | FP candidato |', '|---|---:|---:|---:|---:|---:|',
  ...categories.map(c => `| ${c.label} | ${c.total} | ${c.correct} | ${c.candidateCorrect} | ${c.falsePositives} | ${c.candidateFalsePositives} |`), '',
  '| Glek | Standard attuale | Standard candidato | Mirato attuale | Mirato candidato |', '|---|---|---|---|---|',
  ...glek.map(r => `| ${r.san} | ${r.standard.current} | ${r.standard.candidate} | ${r.targeted.current} | ${r.targeted.candidate} |`), '',
  'La ricerca mirata considera solo le cinque scelte. Il collector nuovo recupera dati coerenti dai raw esistenti; non ricostruisce iterazioni mancanti nelle vecchie cache. Il candidato Buona è un esperimento separato, non una modifica alle soglie né una funzione attivata. Nessuna nuova ricerca, fitting o lettura delle partite riservate.', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ output: dir, summary, categories, glek, changed }, null, 2))
