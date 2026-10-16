// Apply externally supplied corrections; no engine or application classifier.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'

const [folder, correctionFile] = process.argv.slice(2)
assert.ok(folder && correctionFile, 'Expected reference folder and correction JSON')
const referencePath = `${folder}/riferimento.json`, transcriptPath = `${folder}/trascrizione.json`
const referenceBytes = await readFile(referencePath), transcriptBytes = await readFile(transcriptPath)
const listBytes = await readFile(`${folder}/lista.md`)
const ref = JSON.parse(referenceBytes), transcript = JSON.parse(transcriptBytes)
const correction = JSON.parse(await readFile(correctionFile, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
assert.equal(ref.gameId, correction.gameId)
assert.equal(ref.role, 'reserved-holdout-validation')
assert.equal(ref.developmentUseAllowed, false)
const originalPgn = await readFile(`${folder}/partita.pgn`)
assert.equal(sha(originalPgn), ref.pgnSha256)
const game = new Chess(); game.loadPgn(originalPgn.toString('utf8'))
const moves = game.history()
assert.equal(moves.length, ref.annotations.length)
const changes = [], seen = new Set(), categories = Object.values(transcript.categories)
for (const [number, side, san, category] of correction.corrections) {
  assert.ok(Number.isSafeInteger(number) && number > 0)
  assert.ok(['w', 'b'].includes(side)); assert.ok(categories.includes(category))
  const ply = 2 * number - (side === 'w' ? 1 : 0)
  assert.ok(!seen.has(ply), `Duplicate correction for ply ${ply}`); seen.add(ply)
  const entry = ref.annotations[ply - 1]
  assert.equal(entry?.ply, ply); assert.equal(entry.san, san); assert.equal(moves[ply - 1], san)
  const row = transcript.rows[number - 1], sanIndex = side === 'w' ? 1 : 3
  assert.equal(row[sanIndex], san)
  const code = Object.keys(transcript.categories).find(code => transcript.categories[code] === category)
  if (entry.category !== category) changes.push({ ply, moveNumber: number, side, san,
    previousCategory: entry.category, category, source: correction.source, date: correction.date })
  entry.category = category
  row[sanIndex + 1] = code
}
for (const entry of ref.annotations) {
  assert.equal(entry.san, moves[entry.ply - 1])
  entry.userConfirmed = true; entry.needsReview = false
  entry.verificationSource = seen.has(entry.ply) ? 'explicit-user-correction' : 'user-confirmed-unchanged-per-workflow'
}
const verifiedCounts = { white: {}, black: {} }
for (const entry of ref.annotations) {
  const counts = verifiedCounts[entry.ply % 2 ? 'white' : 'black']
  counts[entry.category] = (counts[entry.category] ?? 0) + 1
}
ref.status = 'user-confirmed'; ref.benchmarkEligible = true
ref.reservedForValidation = true; ref.confirmedAt = correction.date
ref.unchangedConfirmationBasis = correction.unchangedConfirmationBasis
ref.corrections = [...(ref.corrections ?? []), ...changes]
ref.verifiedCounts = verifiedCounts
ref.notes = 'Lista confermata da Carlo: correzioni esplicite applicate e altre mosse accettate secondo il workflow concordato. Riservata alla validazione finale, senza uso nello sviluppo delle regole.'
for (const source of ref.applicationAtCollection.sources) assert.equal(sha(await readFile(source.path)), source.sha256, source.path)
const lines = [`# ${ref.white} - ${ref.black}, ${ref.date}`, '',
  `Lista confermata da Carlo il ${correction.date}: correzioni esplicite applicate; altre mosse confermate secondo il workflow concordato.`,
  'Partita riservata alla validazione finale. Nessun confronto con il motore ancora eseguito.', '',
  '| N. | Bianco | Categoria | Nero | Categoria |', '|---:|---|---|---|---|']
for (const [n, w, wc, b, bc] of transcript.rows) lines.push(`| ${n} | ${w} | ${transcript.categories[wc]} | ${b ?? ''} | ${transcript.categories[bc] ?? ''} |`)
// Preserve the original draft before replacing any review files.
if (JSON.parse(referenceBytes).status === 'awaiting-user-review') {
  await writeFile(`${folder}/riferimento-bozza.json`, referenceBytes, { flag: 'wx' })
  await writeFile(`${folder}/trascrizione-bozza.json`, transcriptBytes, { flag: 'wx' })
  await writeFile(`${folder}/lista-bozza.md`, listBytes, { flag: 'wx' })
}
await writeFile(referencePath, JSON.stringify(ref, null, 2) + '\n')
await writeFile(transcriptPath, JSON.stringify(transcript, null, 2) + '\n')
await writeFile(`${folder}/lista.md`, lines.join('\n') + '\n')
assert.equal(sha(await readFile(`${folder}/partita.pgn`)), ref.pgnSha256)
console.log(JSON.stringify({ gameId: ref.gameId, appliedChanges: changes.length, confirmedPlies: ref.annotations.length,
  verifiedCounts, reservedForValidation: true, engineAnalysisPerformed: ref.engineAnalysisPerformed }, null, 2))
