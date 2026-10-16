import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { Chess } from 'chess.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { classifyReviewedMove, applyMoveFacts } from '../src/lib/reviewEvaluation.js'
import { classifySpecialMove, SPECIAL_POLICY } from '../src/lib/specialClassification.js'
import { collectSacrificeEvidence } from '../src/lib/sacrificeEvidence.js'

const area = 'agent-output/targeted-special-evidence-v1', prior = 'agent-output/new-references-200k-v1'
const mode = process.argv[2]
assert.ok(['--prepare', '--run', '--replay'].includes(mode), 'Use --prepare, --run (once), --replay')
const sha = b => createHash('sha256').update(b).digest('hex'), sources = new Map()
const json = value => JSON.parse(JSON.stringify(value))
async function input(path) { const b = await readFile(path); sources.set(path, sha(b)); return JSON.parse(b) }
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { assert.equal(sha(await readFile(s.path)), s.sha256); sources.set(s.path, s.sha256) }
for (const path of ['scripts/verify-targeted-specials.js', 'scripts/qa/captured-node-search.js', 'scripts/qa/native-engine.js',
  'scripts/qa/wasm-engine.cjs', 'src/lib/specialClassification.js', 'src/lib/sacrificeEvidence.js', 'src/lib/moveOpportunities.js',
  'src/lib/reviewEvaluation.js', 'src/lib/reviewMoves.js', 'src/lib/materialRealization.js', 'src/lib/multiPvEvidence.js',
  'node_modules/stockfish/package.json', 'node_modules/stockfish/bin/stockfish-19-single.js',
  'node_modules/stockfish/bin/stockfish-19-single.wasm', `${area}/protocol.md`, `${prior}/results.json`]) sources.set(path, sha(await readFile(path)))
const definitions = [{ game: '184316820266', ply: 41, kind: 'acceptance', nodes: 200000, multiPv: 1, uci: 'f8f7' },
  { game: '185262315732', ply: 29, kind: 'missed', nodes: 1000000, multiPv: 5 },
  { game: '185262315732', ply: 57, kind: 'missed', nodes: 1000000, multiPv: 5 },
  { game: '185230271130', ply: 51, kind: 'missed', nodes: 1000000, multiPv: 5 }]
const games = new Map(), schedule = []
for (const d of definitions) {
  if (!games.has(d.game)) games.set(d.game, await input(`${prior}/game-${d.game}.json`))
  await input(`Partite/Confermate/chesscom-${d.game}/riferimento.json`)
  const e = games.get(d.game).entries[d.ply - 1]
  if (d.kind === 'acceptance') {
    const g = new Chess(e.fenAfter); assert.equal(g.move({ from: 'f8', to: 'f7' }).san, 'Rxf7')
    schedule.push({ ...d, fen: e.fenAfter, scope: 'forced-root-move' })
  } else for (const side of ['Before', 'After']) schedule.push({ ...d, fen: e[`fen${side}`], scope: 'full-position', side })
}
assert.equal(schedule.length, 7)
assert.equal(new Set(schedule.map(t => `${t.scope}:${t.fen}`)).size, 7)
const nominalNodes = schedule.reduce((n, t) => n + t.nodes, 0), cap = nominalNodes + 5000 * schedule.length
assert.equal(cap, 6235000)
const watched = [...sources].map(([path, sha256]) => ({ path, sha256 }))
async function verify() { for (const s of watched) assert.equal(sha(await readFile(s.path)), s.sha256, s.path) }
const save = (name, data) => writeFile(`${area}/${name}`, JSON.stringify(json(data), null, 2) + '\n', { flag: 'wx' })
if (mode === '--prepare') {
  await mkdir(area, { recursive: true })
  await save('manifest.json', { date: '2026-10-14', schedule, nominalNodes, cap, sources: watched, profile: 'Stockfish19 large-single WASM; Threads1 Hash16 clear-per-search' })
  console.log(JSON.stringify({ searches: 7, nominalNodes, cap })); process.exit(0)
}
const manifest = await input(`${area}/manifest.json`)
assert.deepEqual(manifest.schedule, schedule); assert.deepEqual(manifest.sources, watched); await verify()
const packets = []
let engine, actualNodes = 0
if (mode === '--run') {
  try { await access(`${area}/started.json`); throw Error('Already started; no rerun') } catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { date: new Date().toISOString(), searches: 7, cap })
  try {
    const { NativeEngine } = await import('./qa/native-engine.js')
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('./qa/wasm-engine.cjs', import.meta.url)),
      fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url))])
    await engine.init(); assert.equal(engine.version, 'Stockfish 19 WASM')
    for (const [i, task] of schedule.entries()) {
      assert.ok(actualNodes + task.nodes + 5000 <= cap)
      const transport = task.scope === 'forced-root-move' ? { version: engine.version,
        request: (commands, handler) => engine.request(commands.map(c => c.startsWith('go nodes ') ? `${c} searchmoves ${task.uci}` : c), handler) } : engine
      const start = performance.now(), p = await capturedNodeSearch(transport, task.fen, task.nodes, task.multiPv)
      if (task.scope === 'forced-root-move') assert.equal(p.bestmove, task.uci)
      assert.ok(p.actualNodes > 0 && p.actualNodes <= task.nodes + 5000)
      actualNodes += p.actualNodes; assert.ok(actualNodes <= cap)
      const packet = { ...task, ...p, elapsedMs: performance.now() - start }
      await save(`search-${i}.json`, packet); packets.push(packet)
      console.log(JSON.stringify({ completed: i + 1, total: 7, actualNodes }))
    }
    await save('collection.json', { searches: 7, actualNodes, complete: true })
  } catch (e) { await save('failure.json', { complete: false, searches: packets.length, actualNodes, message: e.message }); throw e }
  finally { engine?.close() }
} else {
  const collection = await input(`${area}/collection.json`); assert.equal(collection.complete, true)
  for (const [i, task] of schedule.entries()) {
    const p = await input(`${area}/search-${i}.json`)
    assert.equal(p.fen, task.fen); assert.equal(p.nodes, task.nodes); assert.equal(p.scope, task.scope)
    if (task.scope === 'forced-root-move') assert.equal(p.bestmove, task.uci)
    const snapshot = createMultiPvEvidence(Math.min(task.multiPv, new Chess(task.fen).moves().length)), latest = new Map()
    let nodes = 0, bestmove
    for (const raw of p.rawLines) {
      snapshot.accept(raw); nodes = Math.max(nodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
      const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
      if (raw.startsWith('info ') && score && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
        const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
        latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0), evalCp: score[1] === 'cp' ? Number(score[2]) : null,
          mate: score[1] === 'mate' ? Number(score[2]) : null, pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
      }
      if (raw.startsWith('bestmove ')) bestmove = raw.split(/\s+/)[1]
    }
    assert.equal(bestmove, p.bestmove); assert.equal(nodes, p.actualNodes)
    assert.ok(nodes > 0 && nodes <= task.nodes + 5000)
    assert.deepEqual([...latest.values()].sort((a, b) => a.multipv - b.multipv), p.engine.lines)
    assert.deepEqual(snapshot.finish(bestmove), p.engine.specialLines)
    actualNodes += nodes; packets.push(p)
  }
  assert.equal(actualNodes, collection.actualNodes)
}
assert.ok(actualNodes <= cap)
for (const p of packets) for (const line of [...p.engine.lines, ...p.engine.specialLines]) {
  const g = new Chess(p.fen); for (const u of line.pv) g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
}
const summarize = e => ({ san: e.playedMove, classification: e.classification, bestEval: e.bestEval, playedEval: e.playedEval,
  bestMate: e.bestMate, playedMate: e.playedMate, dropPct: e.dropPct, missedReason: e.missedOpportunityReason,
  missedOpportunity: e.missedOpportunity, brilliant: e.specialAssessment.brilliant, evidence: e.evaluationEvidence })
const acceptanceDef = definitions[0], acceptedGame = games.get(acceptanceDef.game), e = acceptedGame.entries[acceptanceDef.ply - 1]
const extra = collectSacrificeEvidence(e, acceptedGame.entries[acceptanceDef.ply], SPECIAL_POLICY)
assert.ok(extra)
const acceptanceLines = packets[0].engine.specialLines
assert.equal(acceptanceLines.length, 1); assert.equal(acceptanceLines[0].pv[0], 'f8f7')
const targeted = applyMoveFacts(classifySpecialMove(classifyReviewedMove(e), acceptedGame.entries[acceptanceDef.ply - 2],
  acceptedGame.entries[acceptanceDef.ply - 3], { ...extra, source: 'forced-acceptance-search-200k', acceptanceLines }))
const full = new Map(packets.filter(p => p.scope === 'full-position').map(p => [p.fen, p.engine]))
const diagnostics = [], changes = []
for (const [id, g] of games) {
  assert.deepEqual(json(reclassifyReviewedMoves(g.liveEntries)), g.entries)
  const projected = g.liveEntries.map(e => ({ ...e, engine: full.get(e.fenBefore) ?? e.engine,
    playedEngine: full.get(e.fenAfter) ?? e.playedEngine }))
  const view = reclassifyReviewedMoves(projected)
  for (const [i, entry] of view.entries()) if (entry.classification !== g.entries[i].classification) changes.push({ game: id,
    ply: i + 1, san: entry.playedMove, initial: g.entries[i].classification, targeted: entry.classification, expected: g.rows[i].expected })
  for (const d of definitions.filter(d => d.game === id && d.kind === 'missed')) {
    const before = g.entries[d.ply - 1], after = view[d.ply - 1]
    diagnostics.push({ game: id, ply: d.ply, expected: g.rows[d.ply - 1].expected, initial: summarize(before), targeted: summarize(after) })
  }
}
const result = json({ complete: true, searches: 7, actualNodes, cap, newSearches: mode === '--run' ? 7 : 0,
  applicationChanged: false, baselineChanged: false, acceptance: { game: acceptanceDef.game, ply: acceptanceDef.ply,
    initial: summarize(e), targeted: summarize(targeted), line: acceptanceLines[0], previousConfirmation: extra.confirmations }, diagnostics, changes })
await verify()
if (mode === '--replay') {
  assert.deepEqual({ ...result, newSearches: 7 }, await input(`${area}/results.json`))
  await writeFile(`${area}/offline-check.json`, JSON.stringify({ complete: true, newSearches: 0, replayedSearches: 7,
    actualNodes, frozenSourcesVerified: lock.sources.length, resultsMatched: true }, null, 2) + '\n')
} else {
  await save('results.json', result)
  const report = ['# Evidenze mirate delle speciali', '',
    `Sette ricerche prefissate, ${actualNodes} nodi effettivi sotto il tetto ${cap}. Nessun retry; app e baseline invariati.`, '',
    '## 21.Qxe5: accettazione ...Rxf7', '',
    `Prima: ${e.classification}, ${e.specialAssessment.brilliant.reason}. Dopo evidenza mirata: ${targeted.classification}, ${targeted.specialAssessment.brilliant.reason}.`,
    `PV limitata alla presa: depth ${acceptanceLines[0].depth}, cp ${acceptanceLines[0].evalCp}, mate ${acceptanceLines[0].mate}; non e la migliore linea generale della posizione.`, '',
    '| Partita | Ply | Mossa | Prima | Dopo | Mate migliore prima/dopo | Motivo prima | Motivo dopo |',
    '|---|---:|---|---|---|---|---|---|', ...diagnostics.map(r => `| ${r.game} | ${r.ply} | ${r.initial.san} | ${r.initial.classification} | ${r.targeted.classification} | ${r.initial.bestMate ?? '-'} / ${r.targeted.bestMate ?? '-'} | ${r.initial.missedReason} | ${r.targeted.missedReason} |`), '',
    '## Cambiamenti della proiezione', '', ...changes.map(c => `- ${c.game}/${c.ply} ${c.san}: ${c.initial} -> ${c.targeted}, riferimento ${c.expected}.`), '',
    'Sono analisi diagnostiche selezionate dopo le discrepanze, non una nuova precisione globale. Dati completi e PV in results.json e raw search-*.json.',
    'La prova forzata e tenuta separata dalle sei analisi complete; non sovrascrive root, archive o categorie della partita originale.',
    `Hash input/codice e ${lock.sources.length} sorgenti congelate verificati. --run monouso, --replay offline.`, '']
  await writeFile(`${area}/report.md`, report.join('\n'), { flag: 'wx' })
}
console.log(JSON.stringify({ replay: mode === '--replay', newSearches: result.newSearches, actualNodes,
  acceptance: { initial: e.classification, targeted: targeted.classification, reason: targeted.specialAssessment.brilliant.reason },
  diagnostics: diagnostics.map(r => ({ game: r.game, ply: r.ply, initial: r.initial.classification, targeted: r.targeted.classification, bestMate: r.targeted.bestMate })), changes }, null, 2))
