// Prepare the user's external reference; never import or run the engine/classifier.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'

const folder = 'Partite/Validazione/Da-verificare/chesscom-185215805284'
const source = 'C:/Users/carlo/.codex/attachments/2400a33e-171a-4e42-8d26-bd989b8b7e5c/Pasted text.txt'
const bytes = await readFile(source), pgn = bytes.toString('utf8')
const data = JSON.parse(await readFile(`${folder}/trascrizione.json`, 'utf8'))
const game = new Chess(); game.loadPgn(pgn)
const sans = game.history(), board = new Chess(), annotations = []
for (const [number, white, whiteCode, black, blackCode] of data.rows) {
  assert.equal(number, annotations.length / 2 + 1)
  for (const [san, code] of [[white, whiteCode], [black, blackCode]]) {
    const ply = annotations.length + 1
    assert.equal(san, sans[ply - 1]); assert.ok(data.categories[code])
    const legalMoves = board.moves().length, fenBefore = board.fen(), move = board.move(san)
    const icon = ['I', 'E', 'X', 'S', 'G'].includes(code), forced = code === 'F', green = ['M', 'O', 'B'].includes(code)
    if (forced) assert.equal(legalMoves, 1)
    annotations.push({ ply, san, category: data.categories[code],
      evidence: forced ? 'gray-color-and-only-legal-move' : icon ? 'classification-icon' : green ? 'green-shade-draft' : 'brown-book-color',
      needsReview: green, userConfirmed: false, fenBefore, fenAfter: board.fen(),
      uci: move.from + move.to + (move.promotion ?? ''), legalMoves })
  }
}
assert.equal(annotations.length, 122); assert.equal(sans.length, 122)
assert.equal(board.fen(), game.getHeaders().CurrentPosition)
assert.equal(annotations.at(-1).category, 'Grande')
assert.match(pgn, /h2 \$1/); assert.match(pgn, /type;GreatFind/)
const counts = { white: {}, black: {} }
for (const a of annotations) {
  const side = a.ply % 2 ? 'white' : 'black'
  counts[side][a.category] = (counts[side][a.category] ?? 0) + 1
}
const sources = []
for (const path of ['src/lib/reviewEvaluation.js', 'src/lib/specialClassification.js', 'src/lib/analysisRefinement.js',
  'src/lib/classification.js', 'src/lib/evaluation.js', 'src/lib/moveOpportunities.js', 'src/lib/missedOpportunity.js',
  'src/lib/engineConfig.js', 'src/lib/sacrificeEvidence.js', 'src/lib/materialRealization.js', 'src/lib/reviewMoves.js',
  'src/lib/openingBook.js', 'src/data/openingPositions.json']) {
  sources.push({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })
}
const ref = { gameId: '185215805284', status: 'awaiting-user-review', benchmarkEligible: false,
  role: 'reserved-holdout-validation', developmentUseAllowed: false, usedForDevelopment: false,
  engineAnalysisPerformed: false, evaluationPerformed: false, collectedOn: '2026-10-15',
  date: game.getHeaders().Date, white: game.getHeaders().White, black: game.getHeaders().Black, result: game.getHeaders().Result,
  pgn, pgnProvenance: source, pgnSha256: createHash('sha256').update(bytes).digest('hex'),
  source: 'PGN originale e tre screenshot sovrapposti forniti da Carlo in chat.',
  summaryCounts: null, draftCounts: counts, accuracy: null,
  notes: 'Bozza completa. Le sfumature verdi sono provvisorie e richiedono verifica. Nessuna classificazione prodotta dal motore. Partita riservata alla validazione finale.',
  applicationAtCollection: { reviewPolicy: 'review-reliability-v2', specialPolicy: 'counterfactual-v11', sources }, annotations }
await writeFile(`${folder}/partita.pgn`, bytes, { flag: 'wx' })
await writeFile(`${folder}/riferimento.json`, JSON.stringify(ref, null, 2) + '\n', { flag: 'wx' })
const lines = ['# Brishka98 - ProprioI0, 12 ottobre 2026', '',
  'Bozza da verificare. Prima partita del nuovo gruppo riservato alla validazione.',
  'Le categorie verdi (Migliore/Ottima/Buona) sono una lettura provvisoria delle sfumature.',
  'Icone esplicite trascritte; 14.Rxd1 e 36...Ke4 sono grigie e uniche mosse legali.',
  'Nessuna analisi del motore e nessuna modifica alle regole su questa partita.', '',
  '| N. | Bianco | Categoria | Nero | Categoria |', '|---:|---|---|---|---|']
for (const [n, w, wc, b, bc] of data.rows) lines.push(`| ${n} | ${w} | ${data.categories[wc]} | ${b} | ${data.categories[bc]} |`)
await writeFile(`${folder}/lista.md`, lines.join('\n') + '\n', { flag: 'wx' })
console.log(JSON.stringify({ game: ref.gameId, plies: annotations.length, greenDrafts: annotations.filter(a => a.needsReview).length,
  counts, role: ref.role, legalPgn: true }, null, 2))
