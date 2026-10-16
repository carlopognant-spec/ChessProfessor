import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'

const area = 'agent-output/qxe5-verification-v1', mode = process.argv[2]
assert.ok(['--prepare', '--run', '--replay'].includes(mode))
const sha = b => createHash('sha256').update(b).digest('hex'), watched = new Map()
async function input(path) { const b = await readFile(path); watched.set(path, sha(b)); return JSON.parse(b) }
const stored = await input('agent-output/new-references-200k-v1/game-184316820266.json'), e = stored.entries[40]
const oldAcceptance = await input('agent-output/targeted-special-evidence-v1/search-0.json')
const accepted = new Chess(e.fenAfter); accepted.move({ from: 'f8', to: 'f7' })
const count = new Chess(e.fenBefore).moves().length; assert.equal(count, 41)
const schedule = [{ fen: e.fenBefore, nodes: 2000000, multiPv: count, scope: 'all-legal-roots' },
  { fen: accepted.fen(), nodes: 200000, multiPv: 1, scope: 'forced-root-move', uci: 'e5d6' },
  { fen: accepted.fen(), nodes: 200000, multiPv: 1, scope: 'forced-root-move', uci: 'd1d2' }]
for (const t of schedule.filter(t => t.uci)) new Chess(t.fen).move({ from: t.uci.slice(0, 2), to: t.uci.slice(2, 4) })
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { assert.equal(sha(await readFile(s.path)), s.sha256); watched.set(s.path, s.sha256) }
for (const path of ['scripts/verify-qxe5.js', 'scripts/qa/captured-node-search.js', 'scripts/qa/native-engine.js',
  'scripts/qa/wasm-engine.cjs', 'src/lib/specialClassification.js', 'src/lib/sacrificeEvidence.js',
  'src/lib/reviewEvaluation.js', 'src/lib/reviewMoves.js', 'src/lib/multiPvEvidence.js',
  'node_modules/stockfish/bin/stockfish-19-single.js', 'node_modules/stockfish/bin/stockfish-19-single.wasm',
  'Partite/Confermate/chesscom-184316820266/riferimento.json', `${area}/protocol.md`]) watched.set(path, sha(await readFile(path)))
const sources = [...watched].map(([path, sha256]) => ({ path, sha256 })), cap = 2415000
async function verify() { for (const s of sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path) }
const save = (name, data) => writeFile(`${area}/${name}`, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
if (mode === '--prepare') {
  await mkdir(area, { recursive: true }); await save('manifest.json', { date: '2026-10-14', schedule, cap, sources })
  console.log(JSON.stringify({ searches: 3, legalMoves: count, cap })); process.exit(0)
}
const manifest = await input(`${area}/manifest.json`)
assert.deepEqual(manifest.schedule, schedule); assert.deepEqual(manifest.sources, sources); await verify()
const packets = []; let actualNodes = 0, engine
if (mode === '--run') {
  try { await access(`${area}/started.json`); throw Error('Already started: no rerun') } catch (err) { if (err.code !== 'ENOENT') throw err }
  await save('started.json', { date: new Date().toISOString(), cap })
  try {
    const { NativeEngine } = await import('./qa/native-engine.js')
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('./qa/wasm-engine.cjs', import.meta.url)),
      fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url))])
    await engine.init(); assert.equal(engine.version, 'Stockfish 19 WASM')
    for (const [i, t] of schedule.entries()) {
      assert.ok(actualNodes + t.nodes + 5000 <= cap)
      const transport = t.uci ? { version: engine.version, request: (commands, handler) =>
        engine.request(commands.map(c => c.startsWith('go nodes ') ? `${c} searchmoves ${t.uci}` : c), handler) } : engine
      const p = await capturedNodeSearch(transport, t.fen, t.nodes, t.multiPv)
      assert.ok(p.actualNodes > 0 && p.actualNodes <= t.nodes + 5000)
      if (t.uci) assert.equal(p.bestmove, t.uci)
      actualNodes += p.actualNodes; assert.ok(actualNodes <= cap)
      const packet = { ...t, ...p }; await save(`search-${i}.json`, packet); packets.push(packet)
      console.log(JSON.stringify({ completed: i + 1, actualNodes }))
    }
    await save('collection.json', { actualNodes, complete: true })
  } catch (err) { await save('failure.json', { actualNodes, complete: false, error: err.message }); throw err }
  finally { engine?.close() }
} else {
  for (const [i, t] of schedule.entries()) {
    const p = await input(`${area}/search-${i}.json`); assert.equal(p.fen, t.fen); assert.equal(p.nodes, t.nodes)
    const snapshots = createMultiPvEvidence(t.multiPv), latest = new Map(); let telemetry = 0, best
    for (const raw of p.rawLines) {
      snapshots.accept(raw); telemetry = Math.max(telemetry, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
      const s = raw.match(/\bscore (cp|mate) (-?\d+)/)
      if (raw.startsWith('info ') && s && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
        const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
        latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0), evalCp: s[1] === 'cp' ? Number(s[2]) : null,
          mate: s[1] === 'mate' ? Number(s[2]) : null, pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
      }
      if (raw.startsWith('bestmove ')) best = raw.split(/\s+/)[1]
    }
    assert.equal(telemetry, p.actualNodes); assert.equal(best, p.bestmove)
    assert.deepEqual([...latest.values()].sort((a, b) => a.multipv - b.multipv), p.engine.lines)
    assert.deepEqual(snapshots.finish(best), p.engine.specialLines)
    assert.ok(p.actualNodes > 0 && p.actualNodes <= t.nodes + 5000)
    actualNodes += p.actualNodes; packets.push(p)
  }
  assert.equal(actualNodes, (await input(`${area}/collection.json`)).actualNodes)
}
assert.ok(actualNodes <= cap)
for (const p of packets) for (const l of [...p.engine.lines, ...p.engine.specialLines]) {
  const g = new Chess(p.fen); for (const u of l.pv) g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
}
const roots = packets[0].engine.specialLines
assert.equal(roots.length, count); assert.equal(new Set(roots.map(l => l.depth)).size, 1)
const index = l => l.mate != null ? Number(l.mate > 0) : calculateWinProbability(l.evalCp)
const describe = (fen, l) => { const g = new Chess(fen); const san = l.pv.map(u => g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san)
  return { uci: l.pv[0], san: san[0], evalCp: l.evalCp, mate: l.mate, depth: l.depth, localIndex: index(l), pv: san } }
const alternatives = roots.map(l => describe(e.fenBefore, l))
const recoveries = packets.slice(1).map(p => describe(p.fen, p.engine.specialLines[0]))
const result = { legalMoves: count, comparedMoves: alternatives.length, actualNodes, cap,
  commonDepth: roots[0].depth, finalDepth: packets[0].engine.lines[0].depth, finalBest: packets[0].bestmove,
  bestGapCp: alternatives[0].evalCp - alternatives[1].evalCp,
  movesInLocalGoodBand: alternatives.filter(a => a.localIndex >= 0.45).map(a => a.san),
  alternatives, recoveries, acceptedLine: describe(e.fenAfter, oldAcceptance.engine.specialLines[0]),
  baselineChanged: false, applicationChanged: false }
await verify()
if (mode === '--replay') {
  assert.deepEqual(result, await input(`${area}/results.json`)); await writeFile(`${area}/offline-check.json`, JSON.stringify({ complete: true,
    newSearches: 0, replayedSearches: 3, actualNodes, frozenSourcesVerified: lock.sources.length }, null, 2) + '\n')
} else {
  await save('results.json', result)
  const report = ['# Verifica Qxe5', '', `${count} mosse legali confrontate a depth ${result.commonDepth}, bestmove finale ${result.finalBest}.`,
    `Nodi ${actualNodes} sotto tetto ${cap}. Tre ricerche, nessun retry; app e baseline invariati.`,
    `Mosse nella banda buona locale: ${result.movesInLocalGoodBand.join(', ') || 'nessuna'}. Divario prima/seconda: ${result.bestGapCp} cp.`, '',
    '| Mossa | Cp (Bianco) | Mate | Depth |', '|---|---:|---:|---:|', ...alternatives.map(a => `| ${a.san} | ${a.evalCp} | ${a.mate ?? '-'} | ${a.depth} |`), '',
    '## Recuperi alternativi dopo Qxe5 Rxf7', '', ...recoveries.map(r => `- ${r.san}: ${r.evalCp} cp, mate ${r.mate}, depth ${r.depth}; ${r.pv.slice(0, 8).join(' ')}.`), '',
    'Le ricerche limitate valutano la specifica prima mossa, non la migliore scelta generale. La banda good e locale, non una soglia Chess.com.',
    'Copertura completa a ricerca finita: non prova definitiva della posizione. Tutti i raw e le PV conservati; --replay offline, NON ripetere --run.', '']
  await writeFile(`${area}/report.md`, report.join('\n'), { flag: 'wx' })
}
console.log(JSON.stringify({ replay: mode === '--replay', commonDepth: result.commonDepth, finalDepth: result.finalDepth,
  best: alternatives.slice(0, 5), localGood: result.movesInLocalGoodBand, recoveries, actualNodes }, null, 2))
