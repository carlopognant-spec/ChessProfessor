// One predeclared offline hypothesis. No engine imports or app mutations.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Chess } from 'chess.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { classifyReviewedMove, applyMoveFacts } from '../src/lib/reviewEvaluation.js'
import { selectRefinementView } from '../src/lib/analysisRefinement.js'
import { detectMaterialRealization } from '../src/lib/materialRealization.js'

const area = 'agent-output/grande-discovered-realization-study-v2', watched = new Map()
const sha = b => createHash('sha256').update(b).digest('hex')
async function input(path) { const b = await readFile(path); watched.set(path, sha(b)); return JSON.parse(b) }
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { assert.equal(sha(await readFile(s.path)), s.sha256, s.path); watched.set(s.path, s.sha256) }
for (const path of ['scripts/study-discovered-realization-v2.js', `${area}/protocol.md`, 'src/lib/specialClassification.js',
  'src/lib/sacrificeSearches.js', 'src/lib/analysisRefinement.js', 'src/lib/sacrificeEvidence.js',
  'src/lib/reviewMoves.js', 'src/lib/reviewEvaluation.js', 'src/lib/materialRealization.js', 'src/lib/gameAnalysis.js']) {
  watched.set(path, sha(await readFile(path)))
}
const code = await readFile('src/lib/specialClassification.js', 'utf8')
const materialCode = await readFile('src/lib/materialRealization.js', 'utf8')
const marker = "    if (!previousOwn || previousOwn.fenAfter !== previous.fenBefore || previousOwn.ply !== entry.ply - 2) return null"
assert.equal(materialCode.split(marker).length, 2)
const candidateMaterial = materialCode.replace(marker, marker + `
    const prepared = replay(previousOwn)
    const setup = prepared.move
    if (!setup.captured && !setup.promotion && prior.piece === 'q' && !prior.captured && !prior.promotion
      && setup.color === move.color && setup.to !== move.from) {
      const earlierBoard = new Chess(previousOwn.fenBefore)
      const attacker = earlierBoard.get(move.from), victim = prepared.game.get(move.to)
      const unchangedAttacker = prepared.game.get(move.from)
      const moverBoard = board => {
        if (board.turn() === move.color) return board
        const fields = board.fen().split(' '); fields[1] = move.color; fields[3] = '-'
        return new Chess(fields.join(' '))
      }
      const queenCaptures = board => moverBoard(board).moves({ verbose: true }).filter(m => m.to === prior.from && m.captured === 'q')
      // New legal attack by a piece whose path was opened by the setup move.
      const newlyOpened = queenCaptures(prepared.game).some(m => m.from !== setup.to
        && !earlierBoard.attackers(prior.from, move.color).includes(m.from)
        && !queenCaptures(earlierBoard).some(old => old.from === m.from))
      const availableCapture = moverBoard(prepared.game).moves({ verbose: true }).some(m =>
        m.from === move.from && m.to === move.to && m.captured === move.captured)
      if (newlyOpened && availableCapture && attacker?.color === move.color && attacker.type === move.piece
        && unchangedAttacker?.color === move.color && unchangedAttacker.type === move.piece
        && victim?.color === prior.color && victim.type === move.captured) {
        return { kind: 'discovered-attack-realization', previousPly: previousOwn.ply,
          initiatingMove: setup.san, target: move.to, displacedQueen: prior.san }
      }
    }
`)
const materialModule = candidateMaterial.replace("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
const materialUrl = 'data:text/javascript;base64,' + Buffer.from(materialModule).toString('base64')
const candidateSource = code.replace("from './materialRealization.js'", `from '${materialUrl}'`)
const moduleCode = candidateSource.replace("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
  .replace(/from '(\.\/[^']+)'/g, (_, specifier) => `from '${new URL(specifier, new URL('../src/lib/specialClassification.js', import.meta.url)).href}'`)
const candidate = await import('data:text/javascript;base64,' + Buffer.from(moduleCode).toString('base64'))
const cases = [], label = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale',
  missed: 'Mossa mancata', unclassified: 'Non valutabile' }
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
  const entries = await analyzeGame({ moves: cache.entries.map(e => e.san), baseFen: cache.entries[0].fenBefore,
    openingBook: book, analyzePosition: async fen => { const e = cache.entries[before++]; assert.equal(e.fenBefore, fen); return e.engine },
    analyzePlayedPosition: async fen => { const e = cache.entries[after++]; assert.equal(e.fenAfter, fen); return e.playedEngine } })
  cases.push({ cohort: 'old', id, entries, expected: ref.annotations.map(a => a.category) })
  console.log(JSON.stringify({ loaded: id, plies: entries.length }))
}
const rows = [], greatCases = []
for (const c of cases) {
  const preserved = JSON.stringify(c.entries), current = reclassifyReviewedMoves(c.entries)
  const altered = candidate.reclassifySpecialMoves(c.entries.map(classifyReviewedMove)).map(applyMoveFacts)
  for (const [i, entry] of current.entries()) {
    const changed = altered[i], expected = c.expected[i]
    const row = { cohort: c.cohort, game: c.id, ply: entry.ply, san: entry.playedMove, expected,
      before: label[entry.classification], after: label[changed.classification],
      beforeReason: entry.specialAssessment?.grande.reason, afterReason: changed.specialAssessment?.grande.reason,
      corrected: label[entry.classification] !== expected && label[changed.classification] === expected,
      regressed: label[entry.classification] === expected && label[changed.classification] !== expected,
      fenBefore: entry.fenBefore, fenAfter: entry.fenAfter }
    rows.push(row)
    if (entry.classification === 'great' || expected === 'Grande') greatCases.push({ ...row,
      realization: detectMaterialRealization(entry, current[i - 1], current[i - 2]),
      inCheck: new Chess(entry.fenBefore).isCheck(), context: entry.specialAssessment?.context,
      assessment: entry.specialAssessment?.grande })
  }
  assert.equal(JSON.stringify(c.entries), preserved)
  console.log(JSON.stringify({ compared: c.id, cohort: c.cohort }))
}
const summaries = ['new-initial', 'new-refined', 'old'].map(cohort => {
  const all = rows.filter(r => r.cohort === cohort), changes = all.filter(r => r.before !== r.after)
  const great = stage => ({ predicted: all.filter(r => r[stage] === 'Grande').length,
    correct: all.filter(r => r[stage] === 'Grande' && r.expected === 'Grande').length,
    falsePositives: all.filter(r => r[stage] === 'Grande' && r.expected !== 'Grande').length,
    falseNegatives: all.filter(r => r[stage] !== 'Grande' && r.expected === 'Grande').length })
  return { cohort, total: all.length, before: all.filter(r => r.before === r.expected).length,
    after: all.filter(r => r.after === r.expected).length, corrected: changes.filter(r => r.corrected).length,
    regressed: changes.filter(r => r.regressed).length, otherChanges: changes.filter(r => !r.corrected && !r.regressed).length,
    greatBefore: great('before'), greatAfter: great('after') }
})
assert.deepEqual(summaries.map(s => s.before), [172, 181, 329])
const accepted = summaries.some(s => s.corrected > 0)
  && summaries.every(s => s.regressed === 0 && s.greatAfter.correct >= s.greatBefore.correct)
for (const [path, expected] of watched) assert.equal(sha(await readFile(path)), expected, path)
await mkdir(area, { recursive: true })
await writeFile(`${area}/candidate-material.js.txt`, candidateMaterial, { flag: 'wx' })
await writeFile(`${area}/results.json`, JSON.stringify({ newSearches: 0, applicationChanged: false, acceptedForImplementation: accepted,
  independentValidation: false, summaries, changes: rows.filter(r => r.before !== r.after), greatCases,
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })), candidateSha256: sha(Buffer.from(candidateMaterial)) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(`${area}/report.md`, ['# Incasso dopo attacco scoperto alla donna: verifica della proposta', '',
  'Una sola ipotesi preregistrata, variante in memoria, zero nuove ricerche. Campioni già osservati, non validazione indipendente.', '',
  '| Campione | Prima | Proposta | Cambi positivi | Negativi | Grande corrette prima/dopo | In eccesso prima/dopo |',
  '|---|---:|---:|---:|---:|---:|---:|', ...summaries.map(s =>
    `| ${s.cohort} | ${s.before}/${s.total} | ${s.after}/${s.total} | ${s.corrected} | ${s.regressed} | ${s.greatBefore.correct}/${s.greatAfter.correct} | ${s.greatBefore.falsePositives}/${s.greatAfter.falsePositives} |`), '',
  `Proposta supera il controllo di non regressione: ${accepted ? 'sì' : 'no'}. Prima dell’integrazione servono anche test dei controesempi.`, '',
  '| Campione | Partita | Ply | Mossa | Confermata | Prima | Proposta |', '|---|---|---:|---|---|---|---|',
  ...rows.filter(r => r.before !== r.after).map(r => `| ${r.cohort} | ${r.game} | ${r.ply} | ${r.san} | ${r.expected} | ${r.before} | ${r.after} |`), '',
  'Il caso sotto scacco mantiene il comportamento precedente; non sono rimosse altre famiglie o cambiati punteggi e soglie.', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ summaries, acceptedForImplementation: accepted, newSearches: 0 }, null, 2))
