import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { rootFailure, pairFailure, completeDecision } from './grande-policy.js'

const root = new URL('../', import.meta.url)
const manifestPath = 'agent-output/grande-manifest-2026-10-07T15-03-53-742Z/manifest.json'
const bytes = await readFile(new URL(manifestPath, root)), manifest = JSON.parse(bytes)
const digest = value => createHash('sha256').update(value).digest('hex')
const protectedSources = [...manifest.sources, { path: manifestPath, sha256: digest(bytes) }]
const caches = new Map()
for (const source of manifest.sources) {
  const buffer = await readFile(new URL(source.path, root))
  if (digest(buffer) !== source.sha256) throw Error(`Changed input: ${source.path}`)
  if (source.path.includes('personal-')) caches.set(source.path, JSON.parse(buffer))
}
const packageInfo = JSON.parse(await readFile(new URL('node_modules/stockfish/package.json', root)))
if (packageInfo.version !== '19.0.0') throw Error('Unexpected Stockfish package')
const directory = new URL(`agent-output/grande-progressive-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
const save = (name, value) => writeFile(new URL(name, directory), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const cap = 100000000, budgets = [200000, 1000000]
let engine, nominalNodes = 0, actualNodes = 0, searches = 0, failure = null
const started = performance.now(), records = [], searchRecords = []
// Round-robin games, ascending ply within each game. Frozen before any search.
const groups = manifest.games.map(g => manifest.candidates.filter(c => c.gameId === g.id))
const candidates = []
for (let i = 0; i < Math.max(...groups.map(g => g.length)); i++) for (const group of groups) if (group[i]) candidates.push(group[i])
const schedule = candidates.map(c => {
  const cached = caches.get(c.source).entries[c.ply - 1]
  const scores = new Map(cached.engine.lines.filter(l => l.mate == null && Number.isFinite(l.evalCp)).map(l => [l.pv[0], l.evalCp]))
  const alternatives = c.legalMoves.filter(m => m.uci !== c.uci).sort((a, b) => (scores.get(b.uci) ?? -Infinity) - (scores.get(a.uci) ?? -Infinity) || a.uci.localeCompare(b.uci))
  return { ...c, alternatives }
})
await save('schedule.json', { manifestPath, manifestSha256: digest(bytes), cap, budgets, ordering: 'round-robin games; ascending candidate ply; known strongest cached cp alternatives first then UCI', earlyRejection: 'necessary guard fails at either budget; no special assignment without full coverage', candidates: schedule })
async function search(candidate, uci, nodes) {
  if (nominalNodes + nodes > cap || actualNodes + nodes > cap) return null
  await engine.request(['ucinewgame', 'setoption name Clear Hash', 'setoption name MultiPV value 1', 'isready'], line => line === 'readyok' ? true : undefined)
  nominalNodes += nodes; searches++
  const rawLines = [], startedSearch = performance.now()
  let finalScore = null, maxNodes = 0
  const result = await engine.request([`position fen ${candidate.fenBefore}`, `go nodes ${nodes} searchmoves ${uci}`], raw => {
    rawLines.push(raw)
    maxNodes = Math.max(maxNodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
    const match = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (raw.startsWith('info ') && match) finalScore = { evalCp: match[1] === 'cp' ? Number(match[2]) : null, mate: match[1] === 'mate' ? Number(match[2]) : null, bound: /\b(?:lowerbound|upperbound)\b/.test(raw), depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0), pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw }
    if (raw.startsWith('bestmove ')) return { score: finalScore, bestmove: raw, actualNodes: maxNodes, elapsedMs: performance.now() - startedSearch }
  })
  actualNodes += result.actualNodes
  if (!result.actualNodes || !result.score || result.score.pv[0] !== uci || result.bestmove.split(' ')[1] !== uci) throw Error('Invalid restricted root result')
  const replay = new Chess(candidate.fenBefore)
  for (const move of result.score.pv) replay.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })
  const record = { gameId: candidate.gameId, ply: candidate.ply, fen: candidate.fenBefore, uci, budgetNodes: nodes, ...result, rawLines }
  await save(`search-${String(searches).padStart(4, '0')}.json`, record)
  searchRecords.push({ gameId: record.gameId, ply: record.ply, uci, budgetNodes: nodes, evalCp: result.score.evalCp, mate: result.score.mate, actualNodes: result.actualNodes, elapsedMs: result.elapsedMs })
  return result.score
}
try {
  engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)), fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
  await engine.init()
  if (!/^Stockfish 19\b/.test(engine.version)) throw Error(`Unexpected UCI engine: ${engine.version}`)
  for (const candidate of schedule) {
    const record = { gameId: candidate.gameId, ply: candidate.ply, san: candidate.san, uci: candidate.uci, legalCount: candidate.legalCount, status: 'incomplete', reason: null, roots: [] }
    records.push(record)
    for (const [role, move] of [['played', { uci: candidate.uci }], ...candidate.alternatives.map(m => ['alternative', m])]) {
      const pair = []
      for (const budget of budgets) {
        const score = await search(candidate, move.uci, budget)
        if (!score) { record.reason = 'budget-cap'; break }
        pair.push(score)
        const rejected = rootFailure(score, role)
        if (rejected) { record.status = score.mate != null || score.bound ? 'abstained' : 'rejected'; record.reason = rejected; break }
      }
      record.roots.push({ role, uci: move.uci, scores: pair })
      if (record.reason) break
      const rejected = pairFailure(...pair, role)
      if (rejected) { record.status = 'rejected'; record.reason = rejected; break }
    }
    if (!record.reason) {
      const decision = completeDecision(record.roots[0].scores, record.roots.slice(1).map(r => r.scores), candidate.legalCount)
      record.status = decision.verified ? 'verified-experimental' : 'rejected'; Object.assign(record, decision)
    }
    await save(`candidate-${candidate.gameId}-${candidate.ply}.json`, record)
    console.log(JSON.stringify({ completed: records.length, total: schedule.length, game: candidate.gameId, ply: candidate.ply, status: record.status, reason: record.reason, searches, nominalNodes, actualNodes }))
    if (record.reason === 'budget-cap') break
  }
} catch (error) { failure = error.stack; console.error(failure) }
finally { engine?.close() }
const pending = schedule.slice(records.length).map(c => ({ gameId: c.gameId, ply: c.ply, status: 'not-run', reason: failure ? 'session-error' : 'budget-cap' }))
let hashesUnchanged = true
for (const source of protectedSources) if (digest(await readFile(new URL(source.path, root))) !== source.sha256) hashesUnchanged = false
const summary = { engine: engine?.version, packageVersion: packageInfo.version, cap, nominalNodes, actualNodes, capOvershootNodes: Math.max(0, actualNodes - cap), searches, elapsedMs: performance.now() - started, totalCandidates: schedule.length, processedCandidates: records.length, pendingCandidates: pending.length, verified: records.filter(r => r.status === 'verified-experimental').length, failure, sourceHashesUnchanged: hashesUnchanged, annotationsRead: false }
await save('results.json', { summary, records, pending, searchRecords, protectedSources })
const report = ['# Grande — esperimento progressivo', '', 'Risultati sperimentali, nessuna etichetta attivata nell’app.', '', ...Object.entries(summary).map(([key, value]) => `- ${key}: ${value}`), '', '| Partita | Ply | SAN | Stato | Motivo | Radici visitate / legali |', '|---|---:|---|---|---|---:|', ...records.map(r => `| ${r.gameId} | ${r.ply} | ${r.san} | ${r.status} | ${r.reason} | ${r.roots.length}/${r.legalCount} |`), '', 'Annotazioni attese non lette; TP/FP/FN NON ESEGUITO. I candidati incompleti non sono risultati negativi verificati.', 'Test sintetici di politica eseguiti separatamente; suite app/build/browser NON ESEGUITI. Nessun commit/push. STOP.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
if (failure || !hashesUnchanged) process.exitCode = 1
