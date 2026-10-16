// Collect external annotations, checking PGN/SAN and explicit effects only.
// Does not import or run the application's engine or grading rules.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'

const [gameId, source] = process.argv.slice(2)
assert.match(gameId ?? '', /^\d+$/)
assert.ok(source, 'Expected game ID and original PGN path')
const folder = `Partite/Validazione/Da-verificare/chesscom-${gameId}`
const bytes = await readFile(source), pgn = bytes.toString('utf8')
const draft = JSON.parse(await readFile(`${folder}/trascrizione.json`, 'utf8'))
const game = new Chess(); game.loadPgn(pgn)
const headers = game.getHeaders(), moves = game.history(), board = new Chess(headers.FEN)
assert.ok(headers.Link?.includes(gameId), 'Game ID must match the PGN link')
const comments = new Map(game.getComments().map(c => [c.fen, c.comment]))
const effects = { Inaccuracy: 'Imprecisione', Mistake: 'Errore', Blunder: 'Errore grave',
  GreatFind: 'Grande', Brilliant: 'Geniale', MissedWin: 'Mossa mancata', Miss: 'Mossa mancata' }
const annotations = []
for (const [number, white, wc, black, bc] of draft.rows) {
  assert.equal(number, annotations.length / 2 + 1)
  for (const [san, code] of [[white, wc], [black, bc]]) {
    if (!san) continue
    const ply = annotations.length + 1, category = draft.categories[code]
    assert.equal(san, moves[ply - 1]); assert.ok(category)
    const legalMoves = board.moves().length, fenBefore = board.fen(), move = board.move(san)
    const green = ['M', 'O', 'B'].includes(code), icon = ['I', 'E', 'X', 'S', 'G', 'Z'].includes(code)
    if (code === 'F') assert.equal(legalMoves, 1, `Forced move ${ply}`)
    const embedded = [...(comments.get(board.fen()) ?? '').matchAll(/\btype;(Inaccuracy|Mistake|Blunder|GreatFind|Brilliant|MissedWin|Miss)\b/g)]
      .map(match => effects[match[1]])
    for (const effect of embedded) assert.equal(category, effect, `PGN classification at ${ply}`)
    annotations.push({ ply, san, category, evidence: embedded.length ? 'pgn-c-effect-and-classification-icon'
      : code === 'F' ? 'gray-color-and-only-legal-move' : icon ? 'classification-icon' : green ? 'green-shade-draft' : 'brown-book-color',
      needsReview: green, userConfirmed: false, fenBefore, fenAfter: board.fen(),
      uci: move.from + move.to + (move.promotion ?? ''), legalMoves })
  }
}
assert.equal(annotations.length, moves.length)
if (headers.CurrentPosition) assert.equal(board.fen(), headers.CurrentPosition)
const draftCounts = { white: {}, black: {} }
for (const a of annotations) {
  const counts = draftCounts[a.ply % 2 ? 'white' : 'black']
  counts[a.category] = (counts[a.category] ?? 0) + 1
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex'), sources = []
for (const path of ['src/lib/reviewEvaluation.js', 'src/lib/specialClassification.js', 'src/lib/analysisRefinement.js',
  'src/lib/classification.js', 'src/lib/evaluation.js', 'src/lib/moveOpportunities.js', 'src/lib/missedOpportunity.js',
  'src/lib/engineConfig.js', 'src/lib/sacrificeEvidence.js', 'src/lib/materialRealization.js', 'src/lib/reviewMoves.js',
  'src/lib/openingBook.js', 'src/data/openingPositions.json']) sources.push({ path, sha256: hash(await readFile(path)) })
const anchor = 'chesscom-185215805284/riferimento.json'
let previousBytes
try {
  previousBytes = await readFile(`Partite/Validazione/Confermate/${anchor}`, 'utf8')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  previousBytes = await readFile(`Partite/Validazione/Da-verificare/${anchor}`, 'utf8')
}
const previous = JSON.parse(previousBytes)
assert.deepEqual(sources, previous.applicationAtCollection.sources, 'Application changed since holdout collection began')
const ref = { gameId, status: 'awaiting-user-review', benchmarkEligible: false, role: 'reserved-holdout-validation',
  developmentUseAllowed: false, usedForDevelopment: false, engineAnalysisPerformed: false, evaluationPerformed: false,
  collectedOn: '2026-10-15', date: headers.Date, white: headers.White, black: headers.Black, result: headers.Result,
  pgn, pgnProvenance: source, pgnSha256: hash(bytes), source: 'PGN originale e screenshot forniti da Carlo in chat.',
  summaryCounts: null, draftCounts, accuracy: null,
  notes: 'Bozza completa. Sfumature verdi provvisorie da verificare. Nessuna classificazione prodotta dal motore. Riservata alla validazione finale.',
  applicationAtCollection: { reviewPolicy: 'review-reliability-v2', specialPolicy: 'counterfactual-v11', sources }, annotations }
const lines = [`# ${headers.White} - ${headers.Black}, ${headers.Date}`, '',
  'Bozza da verificare. Partita riservata alla validazione finale, separata dalle partite di sviluppo.',
  'Le categorie verdi (Migliore/Ottima/Buona) sono una lettura provvisoria delle sfumature.',
  'Icone esplicite confrontate con i c_effect disponibili nel PGN. Nessuna analisi del motore.', '',
  '| N. | Bianco | Categoria | Nero | Categoria |', '|---:|---|---|---|---|']
for (const [n, w, wc, b, bc] of draft.rows) lines.push(`| ${n} | ${w} | ${draft.categories[wc]} | ${b ?? ''} | ${draft.categories[bc] ?? ''} |`)
await writeFile(`${folder}/partita.pgn`, bytes, { flag: 'wx' })
await writeFile(`${folder}/riferimento.json`, JSON.stringify(ref, null, 2) + '\n', { flag: 'wx' })
await writeFile(`${folder}/lista.md`, lines.join('\n') + '\n', { flag: 'wx' })
console.log(JSON.stringify({ gameId, plies: annotations.length,
  embeddedClassifications: annotations.filter(a => a.evidence.startsWith('pgn-')).length,
  forced: annotations.filter(a => a.category === 'Forzata').map(a => ({ ply: a.ply, san: a.san })),
  draftCounts, unchangedApplication: true }, null, 2))
