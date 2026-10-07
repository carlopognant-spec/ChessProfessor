import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { Chess } from 'chess.js'
import { completedRootScore } from './grande-completed-score.js'
import { rootFailure, pairFailure, completeDecision } from './grande-policy.js'

const root = new URL('../', import.meta.url)
const source = 'agent-output/grande-progressive-2026-10-07T15-12-20-834Z/'
const protectedFiles = [], searches = new Map()
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
async function json(path) {
  const bytes = await readFile(new URL(path, root))
  protectedFiles.push({ path, sha256: sha(bytes) })
  return JSON.parse(bytes)
}
const original = await json(source + 'results.json')
for (let i = 1; i <= original.summary.searches; i++) {
  const record = await json(source + `search-${String(i).padStart(4, '0')}.json`)
  const selection = completedRootScore(record.rawLines, record.uci)
  if (selection.completed) {
    const game = new Chess(record.fen)
    for (const uci of selection.completed.pv) game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  }
  searches.set(`${record.gameId}:${record.ply}:${record.uci}:${record.budgetNodes}`, { ...selection, searchNumber: i, actualNodes: record.actualNodes, budgetNodes: record.budgetNodes })
}
const recovered = [], replay = []
for (const record of original.records) {
  const roots = record.roots.map(r => ({ role: r.role, uci: r.uci, searches: r.scores.map((_, i) => searches.get(`${record.gameId}:${record.ply}:${r.uci}:${[200000, 1000000][i]}`)) }))
  let state = 'requires-additional-searches', reason = 'incomplete-coverage-or-second-budget'
  for (const r of roots) {
    for (const s of r.searches) {
      const reject = rootFailure(s.completed, r.role)
      if (reject) { state = s.completed ? 'excluded-under-replay-policy' : 'abstained'; reason = reject; break }
    }
    if (state !== 'requires-additional-searches') break
    if (r.searches.length === 2) {
      const reject = pairFailure(...r.searches.map(s => s.completed), r.role)
      if (reject) { state = 'excluded-under-replay-policy'; reason = reject; break }
    }
  }
  if (state === 'requires-additional-searches' && roots.length === record.legalCount && roots.every(r => r.searches.length === 2)) {
    const decision = completeDecision(roots[0].searches.map(s => s.completed), roots.slice(1).map(r => r.searches.map(s => s.completed)), record.legalCount)
    state = decision.verified ? 'verified-under-replay-policy' : 'excluded-under-replay-policy'; reason = decision.reason
  }
  const result = { gameId: record.gameId, ply: record.ply, san: record.san, originalStatus: record.status, replayState: state, reason }
  replay.push(result)
  if (record.status === 'abstained') {
    const lastRoot = roots.at(-1), search = lastRoot.searches.at(-1), completed = search.completed
    recovered.push({ ...result, rootRole: lastRoot.role, uci: lastRoot.uci,
      finalBoundCp: search.latest.evalCp, finalBoundDepth: search.latest.depth,
      completedCp: completed?.evalCp ?? null, completedMate: completed?.mate ?? null,
      completedDepth: completed?.depth ?? null, nodesAtCompletedScore: completed?.nodesAtScore ?? null,
      totalSearchNodes: search.actualNodes,
      completedNodeFraction: completed ? completed.nodesAtScore / search.actualNodes : null,
      scoreAvailable: completed != null,
    })
  }
}
for (const file of protectedFiles) if (sha(await readFile(new URL(file.path, root))) !== file.sha256) throw Error(`Changed source: ${file.path}`)
const count = (rows, key) => { const values = {}; for (const row of rows) values[row[key]] = (values[row[key]] ?? 0) + 1; return values }
const available = recovered.filter(r => r.scoreAvailable), fractions = available.map(r => r.completedNodeFraction).sort((a,b)=>a-b)
const summary = { searchesExecuted: 0, sourceSearchesRead: searches.size, originalAbstentions: recovered.length, priorCompletedScoresAvailable: available.length,
  recoveredStates: count(recovered, 'replayState'), replayStatesAllVisited: count(replay, 'replayState'),
  completedDepthRange: available.length ? [Math.min(...available.map(r=>r.completedDepth)),Math.max(...available.map(r=>r.completedDepth))] : null,
  completedNodeFractionRange: fractions.length ? [fractions[0], fractions.at(-1)] : null,
  sourceHashesUnchanged: true, annotationsRead: false,
  interpretation: 'Offline policy variant; original run unchanged. Earlier unbounded scores are estimates at recorded completed depths, not exact evaluations at all allocated nodes. Missing searches remain missing; no new labels activated.' }
const directory = new URL(`agent-output/grande-bound-diagnostic-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, recovered, replay, protectedFiles }, null, 2)+'\n', { flag: 'wx' })
const report = ['# Grande — diagnosi delle astensioni bound, sola lettura', '', ...Object.entries(summary).map(([k,v])=>`- ${k}: ${JSON.stringify(v)}`), '',
  '| Partita | Ply | SAN | Ruolo radice | cp precedente completo | Depth completa / bound | Nodi allo score / ricerca | Esito replay |',
  '|---|---:|---|---|---:|---|---|---|', ...recovered.map(r=>`| ${r.gameId} | ${r.ply} | ${r.san} | ${r.rootRole} | ${r.completedCp ?? 'mate '+r.completedMate} | ${r.completedDepth}/${r.finalBoundDepth} | ${r.nodesAtCompletedScore}/${r.totalSearchNodes} | ${r.replayState} |`), '',
  'Variante proposta: conservare ultimo score senza bound della radice richiesta, depth/nodi al momento dello score, messaggio bound finale e nodi totali separati. Verificare comunque entrambe le ricerche e tutte le alternative prima di assegnare Grande.',
  'Nessuna soglia modificata. Unbound non significa verità scacchistica provata. Il replay non completa ricerche assenti e non cambia il risultato della v1.',
  'Le etichette Chess.com non sono state lette per scegliere la politica. Il recupero è tecnico; una nuova variante va dichiarata prima di nuove ricerche.',
  'Test sintetici del parser eseguiti separatamente. Suite app/build/browser e nuove ricerche: NON ESEGUITO. Nessun commit/push. STOP.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
