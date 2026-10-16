import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
const area = 'agent-output/unresolved-reference-audit-v1', sources = new Map()
const hash = b => createHash('sha256').update(b).digest('hex')
const read = async p => { const b = await readFile(p); sources.set(p, hash(b)); return b }
const json = async p => JSON.parse(await read(p))
const save = (name, data) => writeFile(`${area}/${name}`, data, { flag: 'wx' })
// Decode just a quoted string literal. Never evaluate scripts fetched from a page.
function literal(raw) {
  const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0' }
  return raw.replace(/\\(?:u([\da-f]{4})|x([\da-f]{2})|([\\'"/nrtbfv0]))/gi,
    (_, unicode, hex, escaped) => unicode || hex ? String.fromCharCode(parseInt(unicode ?? hex, 16)) : escapes[escaped] ?? escaped)
}
const verification = await json('agent-output/native-edge-integration-v1/classifier-verification.json')
assert(verification.result.passed && verification.result.unresolved.length === 2)
for (const s of verification.sources) assert.equal(hash(await read(s.path)), s.sha256, s.path)
const depth = await json('agent-output/depth-stability-v1/report.json')
const publicCheck = await json(`${area}/public-source-check.json`)
const cases = [], manifestPaths = []
for (const unresolved of verification.result.unresolved) {
  const id = unresolved.game, referencePath = `Partite/Confermate/Storiche/${id}/riferimento.json`
  const reference = await json(referencePath), annotation = reference.annotations.find(a => a.ply === unresolved.ply)
  assert.equal(annotation.category, 'Grande')
  const fixturePath = `tests/fixtures/qa/${id}.json`, fixture = await json(fixturePath)
  const beforeCommit = JSON.parse(execFileSync('git', ['show', `4758253:${fixturePath}`], { encoding: 'utf8', windowsHide: true }))
  assert.deepEqual(beforeCommit.annotations.find(a => a.ply === unresolved.ply), annotation)
  const fetched = publicCheck.results.find(r => r.id === id)
  assert.equal(fetched.status, 200)
  const htmlPath = `${area}/${id}.html`, html = (await read(htmlPath)).toString()
  const analysis = html.slice(html.indexOf('window.chesscom.analysis ='))
  const publicLiteral = analysis.match(/\bpgn:\s*'((?:\\.|[^'\\])*)'/)
  assert(publicLiteral, 'PGN string absent from public analysis configuration')
  const publicPgn = literal(publicLiteral[1]), board = new Chess(), local = new Chess()
  board.loadPgn(publicPgn); local.loadPgn(fixture.pgn)
  assert.deepEqual(board.history(), local.history(), 'Public and local mainlines differ')
  const history = local.history({ verbose: true }), index = unresolved.ply - 1, move = history[index]
  assert.equal(move.san, annotation.san)
  const context = new Chess(history[index - 2].before)
  context.header('Event', `Verifica ${Math.ceil(unresolved.ply / 2)}...${annotation.san}`)
  context.header('White', local.getHeaders().White)
  context.header('Black', local.getHeaders().Black)
  for (const m of history.slice(index - 2, index + 1)) context.move(m.san)
  assert.equal(context.fen(), move.after)
  context.setComment('Posizione di controllo. Riferimento: Grande. Modello v24: Migliore. Etichetta Game Review da verificare.')
  const pgnPath = `${annotation.san}-context.pgn`, fenPath = `${annotation.san}-before.fen`
  await save(pgnPath, context.pgn() + '\n'); await save(fenPath, move.before + '\n')
  // Confirm the exported context round-trips, with both prior plies retained.
  const roundTrip = new Chess(); roundTrip.loadPgn(await readFile(`${area}/${pgnPath}`, 'utf8'))
  assert.equal(roundTrip.fen(), move.after); assert.equal(roundTrip.history().length, 3)
  const flags = Object.fromEntries(['canViewMoveFeedback', 'locked', 'libraryLocked'].map(key => [key, analysis.match(new RegExp(`\\b${key}:\\s*(true|false)`))?.[1] ?? 'not-present']))
  const d = depth.rows.find(r => r.game === id && r.ply === unresolved.ply)
  cases.push({ game: id, ply: unresolved.ply, san: annotation.san, expectedUnchanged: annotation.category,
    current: unresolved.actual, originalCommit: '47582531dafeb0a6cdcd57eae4a37b294bb8a642',
    referenceProvenance: 'Label predates this work; origin of the label is undocumented. Commit is not proof of Game Review provenance.',
    publicSource: fetched.url, publicMainlineMatches: true, publicFeedbackFlags: flags,
    canIndependentlyConfirmGameReviewLabel: false, before: move.before, after: move.after,
    contextPgn: pgnPath, beforeFen: fenPath, tenMillion: { rootCp: d.root.completed[0].cp, childCp: d.child.completed[0].cp, rootGapCp: d.rootGapCp } })
  manifestPaths.push(referencePath, fixturePath)
}
await read('scripts/prepare-remaining-review.mjs')
for (const [p, h] of sources) assert.equal(hash(await readFile(p)), h, p)
await save('verification.json', JSON.stringify({ passed: true, productionChanged: false, referencesChanged: false,
  newEngineSearches: 0, sourcePagesFetchedAnonymously: 2, cases,
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n')
const sections = cases.map(c => `## ${c.game}: ${Math.ceil(c.ply / 2)}...${c.san}\n\n- Riferimento conservato: **${c.expectedUnchanged}**. Modello corrente: **${c.current}**.\n- [Contesto di tre semimosse](${c.contextPgn}), [FEN prima della mossa](${c.beforeFen}), [partita originale](${c.publicSource}).\n- A10M: ${c.tenMillion.rootCp}cp per il Nero, seconda scelta a ${c.tenMillion.rootGapCp}cp di distanza; posizione figlia ${c.tenMillion.childCp}cp per il Nero.\n`).join('\n')
await save('README.md', `# Due etichette da ricontrollare\n\nL'app resta v24:32/34Grandi e4/4Geniali,senza falsi positivi nel campione. Le due etichette attese qui sotto sono invariate. Nessuna nuova regola o ricerca del motore in questo audit.\n\n${sections}\nLe etichette erano gia presenti nel commit4758253 del6ottobre:questo ne dimostra la presenza storica,non la provenienza dalla Game Review. Le pagine pubbliche rispondono200 e la loro sequenza di mosse coincide con i file locali;la configurazione anonima dichiara canViewMoveFeedback:false,locked:true e libraryLocked:true. Il PGN e i simboli editoriali non dimostrano da soli le etichette della Game Review. Le due Geniali storiche sono state confermate separatamente dall'utente.\n\nPer controllare le etichette usare la partita completa nella propria Game Review. I PGN isolati servono a individuare la posizione e preservano le due semimosse precedenti;non sono presentati come sostituti della revisione originale. Basta comunicare l'etichetta effettivamente mostrata per ciascuna delle due mosse.\n`)
console.log(JSON.stringify({ passed: true, cases: cases.map(c => ({ game: c.game, ply: c.ply, san: c.san, originalCommit: c.originalCommit.slice(0, 7), publicMainlineMatches: c.publicMainlineMatches, flags: c.publicFeedbackFlags })), referencesChanged: false, newEngineSearches: 0 }))
