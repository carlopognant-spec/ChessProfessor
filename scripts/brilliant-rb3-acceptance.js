import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { completedRootScore } from './grande-completed-score.js'
import { materialFor } from './grande-comparison-features.js'

const root = new URL('../', import.meta.url), watched = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path, json = true) {
  const bytes = await readFile(new URL(path, root)); watched.push({ path, sha256: hash(bytes) }); return json ? JSON.parse(bytes) : bytes.toString('utf8')
}
await input('agent-output/brilliant-rb3-acceptance-v1-protocol.md', false)
const cache = await input('tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/game-1-chigorin-steinitz-1892.json')
const audit = await input('agent-output/brilliant-sacrifice-audit-2026-10-08T01-48-41-355Z/results.json')
const pkg = await input('node_modules/stockfish/package.json')
if (pkg.version !== '19.0.0' || cache.packageVersion !== pkg.version || cache.searchLimit?.value !== 200000
  || cache.threads !== 1 || cache.hashMb !== 16) throw Error('Incompatible engine/cache')
const entry = cache.entries.find(e => e.ply === 53)
const audited = audit.cases.find(r => r.id === 'game-1-chigorin-steinitz-1892' && r.ply === 53)
if (entry?.uci !== 'b1b3' || entry.san !== 'Rb3' || audited?.fenAfter !== entry.fenAfter) throw Error('Case mismatch')
const full = new Chess(); full.loadPgn(cache.pgn)
const history = full.history(), game = new Chess()
for (const san of history.slice(0, 52)) game.move(san)
if (game.fen() !== entry.fenBefore) throw Error('PGN/FEN mismatch')
const initialMaterial = materialFor(game, 'w')
game.move('Rb3')
if (game.fen() !== entry.fenAfter || game.turn() !== 'b') throw Error('Incorrect search position')
const accepted = new Chess(entry.fenAfter), reply = accepted.move('Qxh8')
if (reply.from !== 'c8' || reply.to !== 'h8' || reply.captured !== 'n') throw Error('Illegal acceptance')
const target = 'c8h8', budgets = [200000, 1000000], cap = 1300000
const directory = new URL(`agent-output/brilliant-rb3-acceptance-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
const save = (name, data) => writeFile(new URL(name, directory), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
await save('schedule.json', { selectedCase: 'historical annotated Rb3', selectionIsLabelGuided: true, diagnosticOnly: true,
  fen: entry.fenAfter, rootUci: target, budgets, nominalMaximum: 1200000, cap, hashPolicy: 'clear-per-search',
  enginePackage: '19.0.0', build: 'large-single', multiPv: 1, threads: 1, hashMb: 16 })
const searches = []
let engine, totalNodes = 0, nominalNodes = 0, failure = null
const started = performance.now()
try {
  engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)), fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
  await engine.init()
  if (!/^Stockfish 19\b/.test(engine.version)) throw Error('Unexpected engine identity')
  for (const budgetNodes of budgets) {
    if (totalNodes + budgetNodes + 2000 > cap) throw Error('Insufficient remaining budget')
    await engine.request(['ucinewgame', 'setoption name Clear Hash', 'setoption name MultiPV value 1', 'isready'], raw => raw === 'readyok' ? true : undefined)
    const rawLines = [], searchStarted = performance.now()
    let actualNodes = 0
    nominalNodes += budgetNodes
    const bestmove = await engine.request([`position fen ${entry.fenAfter}`, `go nodes ${budgetNodes} searchmoves ${target}`], raw => {
      rawLines.push(raw); actualNodes = Math.max(actualNodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
      if (raw.startsWith('bestmove ')) return raw
    })
    totalNodes += actualNodes
    const selected = completedRootScore(rawLines, target)
    const trace = [], replay = new Chess(entry.fenAfter)
    for (const uci of selected.completed?.pv ?? []) {
      const move = replay.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      trace.push({ san: move.san, uci, materialWhite: materialFor(replay, 'w'), materialDelta: materialFor(replay, 'w') - initialMaterial, checkmate: replay.isCheckmate() })
    }
    const score = selected.completed
    const record = { budgetNodes, actualNodes, elapsedMs: performance.now() - searchStarted, bestmove, engineVersion: engine.version,
      rootUci: target, fen: entry.fenAfter, rawLines, completed: score, finalScore: selected.latest,
      scoreWhite: score ? { evalCp: score.evalCp == null ? null : -score.evalCp, mate: score.mate == null ? null : -score.mate } : null,
      trace, replayEndsInMate: replay.isCheckmate(), status: score ? 'estimated' : 'insufficient' }
    await save(`search-${budgetNodes}.json`, record)
    searches.push(record)
    if (bestmove.split(' ')[1] !== target || !actualNodes) throw Error('Unexpected root or missing telemetry')
    if (totalNodes > cap) throw Error('Actual budget cap exceeded')
  }
} catch (error) { failure = error.stack } finally { engine?.close() }
let hashesUnchanged = true
for (const source of watched) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) hashesUnchanged = false
const summary = { diagnosticOnly: true, labelGuidedSelection: true, searches: searches.length, nominalNodes,
  actualNodes: totalNodes, cap, capExceeded: totalNodes > cap, elapsedMs: performance.now() - started,
  sourceHashesUnchanged: hashesUnchanged, failure, originalBestReply: 'Kg7', originalBestReplyCpBlack: -672,
  originalV1: audited.v1, originalReason: audited.v1Reason, appIntegration: false, independentValidation: false,
  completedScores: searches.map(s => ({ budget: s.budgetNodes, depth: s.completed?.depth ?? null,
    nodesAtScore: s.completed?.nodesAtScore ?? null, actualNodes: s.actualNodes, white: s.scoreWhite, status: s.status })) }
await save('results.json', { summary, searches, watched })
const report = ['# Rb3: diagnosi della risposta Qxh8', '', ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
  ...searches.flatMap(s => [`## Budget ${s.budgetNodes}`, `Score dal lato Bianco: ${JSON.stringify(s.scoreWhite)}. Depth ${s.completed?.depth ?? 'n/d'}, nodi allo score ${s.completed?.nodesAtScore ?? 'n/d'}, nodi finali ${s.actualNodes}.`, '',
    '| Ply della PV | SAN | Saldo materiale Bianco | Delta rispetto a prima di Rb3 | Matto dato |', '|---:|---|---:|---:|---|',
    ...s.trace.map((m, i) => `| ${i + 1} | ${m.san} | ${m.materialWhite} | ${m.materialDelta} | ${m.checkmate} |`), '']),
  'Ricerca di una sola risposta, non prova contro tutte le difese. Selezione sul riferimento storico: nessuna misura di precisione/richiamo. Non rimuove le esclusioni v1 Ottima/alternative già vincenti. App, Grande, soglie e cache invariati. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, continuations: searches.map(s => ({ budget: s.budgetNodes, first12: s.trace.slice(0, 12) })) }, null, 2))
if (failure || !hashesUnchanged) process.exitCode = 1
