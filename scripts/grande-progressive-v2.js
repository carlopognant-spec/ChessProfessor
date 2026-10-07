import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { completedRootScore } from './grande-completed-score.js'
import { rootFailure, pairFailure, completeDecision } from './grande-policy.js'

const root = new URL('../', import.meta.url)
const previous = 'agent-output/grande-progressive-2026-10-07T15-12-20-834Z/'
const diagnosticPath = 'agent-output/grande-bound-diagnostic-2026-10-07T15-22-14-248Z/results.json'
const protectedFiles = [], available = new Map(), records = [], searchRecords = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root))
  protectedFiles.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const old = await input(previous + 'results.json'), schedule = await input(previous + 'schedule.json'), diagnostic = await input(diagnosticPath)
for (const source of old.protectedSources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error(`Changed source ${source.path}`)
protectedFiles.push(...old.protectedSources)
const packageInfo = await input('node_modules/stockfish/package.json')
if (packageInfo.version !== '19.0.0') throw Error('Unexpected engine package')
const key = (gameId, ply, fen, uci, nodes) => JSON.stringify([gameId, ply, fen, uci, nodes])
function validate(raw, candidate, uci, budget) {
  if (raw.fen !== candidate.fenBefore || raw.uci !== uci || raw.budgetNodes !== budget || raw.bestmove.split(' ')[1] !== uci || !(raw.actualNodes > 0)) throw Error('Search provenance mismatch')
  const selected = completedRootScore(raw.rawLines, uci)
  if (selected.completed) {
    const game = new Chess(candidate.fenBefore)
    for (const move of selected.completed.pv) game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })
  }
  return selected
}
for (let i = 1; i <= old.summary.searches; i++) {
  const path = previous + `search-${String(i).padStart(4, '0')}.json`, raw = await input(path)
  const candidate = schedule.candidates.find(c => c.gameId === raw.gameId && c.ply === raw.ply)
  const selected = validate(raw, candidate, raw.uci, raw.budgetNodes)
  available.set(key(raw.gameId, raw.ply, raw.fen, raw.uci, raw.budgetNodes), { score: selected.completed, source: path })
}
const state = new Map(diagnostic.replay.map(r => [`${r.gameId}:${r.ply}`, r]))
const queue = schedule.candidates.filter(c => !['excluded-under-replay-policy', 'verified-under-replay-policy'].includes(state.get(`${c.gameId}:${c.ply}`)?.replayState))
  .sort((a,b) => Number(state.get(`${a.gameId}:${a.ply}`)?.replayState !== 'requires-additional-searches') - Number(state.get(`${b.gameId}:${b.ply}`)?.replayState !== 'requires-additional-searches'))
for (const candidate of schedule.candidates.filter(c => !queue.includes(c))) {
  const prior = old.records.find(r => r.gameId === candidate.gameId && r.ply === candidate.ply), verdict = state.get(`${candidate.gameId}:${candidate.ply}`)
  const roots = prior.roots.map(r => ({ ...r, scores: r.scores.map((s,i) => available.get(key(candidate.gameId, candidate.ply, candidate.fenBefore, r.uci, [200000,1000000][i])).score) }))
  records.push({ ...prior, roots, status: verdict.replayState === 'verified-under-replay-policy' ? 'verified-experimental' : 'rejected', reason: verdict.reason, inheritedOfflineReplay: true })
}
const directory = new URL(`agent-output/grande-progressive-v2-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
const save = (name,value) => writeFile(new URL(name,directory),JSON.stringify(value,null,2)+'\n',{flag:'wx'})
const cap = 100000000, budgets = [200000,1000000]
let engine, searches = 0, reusedSearches = 0, nominalNodes = 0, actualNodes = 0, failure = null, visited = 0
const started = performance.now()
await save('schedule.json', { policy: 'v2-last-completed-root-score', numericPolicyUnchanged: true, previous, diagnosticPath, cap, budgets, inheritedDecisions: records.length, queue,
  ordering: 'open replay candidates first, then unrun; previous round-robin order within groups',
  scorePolicy: 'last primary unbounded score with matching UCI root; record depth and nodesAtScore separately from final bound and total nodes', protectedFiles })
async function search(candidate, uci, budget) {
  const id = key(candidate.gameId,candidate.ply,candidate.fenBefore,uci,budget)
  if (available.has(id)) { reusedSearches++; return { ...available.get(id), reused: true } }
  if (nominalNodes + budget > cap || actualNodes + budget > cap) return null
  await engine.request(['ucinewgame','setoption name Clear Hash','setoption name MultiPV value 1','isready'],line => line === 'readyok' ? true : undefined)
  nominalNodes += budget; searches++
  let maxNodes = 0
  const rawLines = [], start = performance.now()
  const result = await engine.request([`position fen ${candidate.fenBefore}`,`go nodes ${budget} searchmoves ${uci}`],raw => {
    rawLines.push(raw); maxNodes = Math.max(maxNodes,Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
    if (raw.startsWith('bestmove ')) return { bestmove: raw, actualNodes: maxNodes, elapsedMs: performance.now()-start }
  })
  actualNodes += result.actualNodes
  const raw = { gameId:candidate.gameId,ply:candidate.ply,fen:candidate.fenBefore,uci,budgetNodes:budget,...result,rawLines }
  const path = `search-${String(searches).padStart(4,'0')}.json`
  // Save raw evidence before interpreting it; retain failures for inspection.
  await save(path,raw)
  const selected = validate(raw,candidate,uci,budget)
  const record = { score:selected.completed, finalScore:selected.latest, actualNodes:result.actualNodes, source:fileURLToPath(new URL(path,directory)), reused:false }
  available.set(id,record)
  searchRecords.push({ gameId:candidate.gameId,ply:candidate.ply,uci,budget,actualNodes:result.actualNodes,completedDepth:selected.completed?.depth ?? null,nodesAtScore:selected.completed?.nodesAtScore ?? null,finalBound:selected.latest?.bound ?? null })
  if (searches % 10 === 0) console.log(JSON.stringify({ progress:'search',searches,actualNodes,game:candidate.gameId,ply:candidate.ply }))
  return record
}
try {
  engine = new NativeEngine(process.execPath,120000,[fileURLToPath(new URL('scripts/qa/wasm-engine.cjs',root)),fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js',root))])
  await engine.init()
  if (!/^Stockfish 19\b/.test(engine.version)) throw Error('Unexpected UCI engine')
  for (const candidate of queue) {
    visited++
    const record = { gameId:candidate.gameId,ply:candidate.ply,san:candidate.san,uci:candidate.uci,legalCount:candidate.legalCount,status:'incomplete',reason:null,roots:[] }
    records.push(record)
    for (const [role,move] of [['played',{uci:candidate.uci}],...candidate.alternatives.map(m=>['alternative',m])]) {
      const pair = [], provenance = []
      for (const budget of budgets) {
        const result = await search(candidate,move.uci,budget)
        if (!result) { record.reason='budget-cap'; break }
        pair.push(result.score); provenance.push({ budget,source:result.source,reused:result.reused })
        const reject = rootFailure(result.score,role)
        if (reject) { record.status=reject==='insufficient-score'?'abstained':'rejected'; record.reason=reject; break }
      }
      record.roots.push({ role,uci:move.uci,scores:pair,provenance })
      if (record.reason) break
      const reject=pairFailure(...pair,role)
      if (reject) { record.status='rejected';record.reason=reject;break }
    }
    if (!record.reason) {
      const verdict=completeDecision(record.roots[0].scores,record.roots.slice(1).map(r=>r.scores),candidate.legalCount)
      Object.assign(record,verdict);record.status=verdict.verified?'verified-experimental':'rejected'
    }
    await save(`candidate-${candidate.gameId}-${candidate.ply}.json`,record)
    console.log(JSON.stringify({ visited,queue:queue.length,game:candidate.gameId,ply:candidate.ply,status:record.status,reason:record.reason,searches,reusedSearches,actualNodes }))
    if (record.reason==='budget-cap') break
  }
} catch(error) {failure=error.stack;console.error(failure)} finally {engine?.close()}
const pending=queue.slice(visited).map(c=>({gameId:c.gameId,ply:c.ply,status:'not-run'}))
let hashesUnchanged=true
for(const source of protectedFiles) if(hash(await readFile(new URL(source.path,root)))!==source.sha256) hashesUnchanged=false
const statuses={};for(const r of records)statuses[r.status]=(statuses[r.status]??0)+1
const summary={policy:'v2-last-completed-root-score',engine:engine?.version,packageVersion:packageInfo.version,cap,newSearches:searches,reusedSearches,newNominalNodes:nominalNodes,newActualNodes:actualNodes,capOvershootNodes:Math.max(0,actualNodes-cap),previousActualNodes:old.summary.actualNodes,cumulativeActualNodes:actualNodes+old.summary.actualNodes,elapsedMs:performance.now()-started,totalCandidates:schedule.candidates.length,visitedThisSession:visited,pending:pending.length,statuses,failure,sourceHashesUnchanged:hashesUnchanged,annotationsRead:false}
await save('results.json',{summary,records,pending,searchRecords,protectedFiles})
const report=['# Grande — progressiva v2, ultimo score completo','',...Object.entries(summary).map(([k,v])=>`- ${k}: ${JSON.stringify(v)}`),'','Soglie numeriche invariate; variante dichiarata prima della raccolta. Precedenti risultati e cache intatti. Nessuna etichetta attivata nell’app.','Score completo = stima UCI senza bound alla depth registrata; non valutazione esatta a tutti i nodi allocati.','Annotazioni attese non lette durante la raccolta. Test sintetici eseguiti separatamente; suite app/build/browser NON ESEGUITI. Nessun commit/push. STOP.',''].join('\n')
await writeFile(new URL('report.md',directory),report,{flag:'wx'})
console.log(JSON.stringify({output:fileURLToPath(directory),summary},null,2))
if(failure||!hashesUnchanged)process.exitCode=1
