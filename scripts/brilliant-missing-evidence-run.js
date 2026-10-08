import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { completedRootScore } from './grande-completed-score.js'
import { classifyAttributedBrilliant } from './brilliant-offer-attribution-v3.js'

const root = new URL('../', import.meta.url), sources = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); sources.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const manifest = await input('agent-output/brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json')
if (manifest.requests !== 30 || manifest.schedule.length !== 30 || manifest.nominalNodes !== 6000000
  || manifest.proposedGlobalActualNodeCap !== 7500000 || manifest.selectionUsesExpectedLabels !== false) throw Error('Unexpected frozen manifest')
for (const source of manifest.sources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Manifest source changed')
const prior = await input('agent-output/brilliant-offer-attribution-v3-2026-10-08T02-28-55-079Z/results.json')
const pkg = await input('node_modules/stockfish/package.json')
if (pkg.version !== '19.0.0') throw Error('Unexpected engine package')
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const caches = new Map()
for (const id of ids) {
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  if (cache.packageVersion !== pkg.version || cache.multiPv !== 5 || cache.threads !== 1 || cache.hashMb !== 16
    || cache.searchLimit?.value !== 200000 || cache.scorePerspective !== 'side-to-move at each FEN') throw Error('Unexpected cache configuration')
  caches.set(id, cache)
}
for (const request of manifest.schedule) {
  const entry = caches.get(request.id)?.entries[request.ply - 1]
  const game = new Chess(request.fen)
  if (entry?.fenAfter !== request.fen || entry.san !== request.san || request.budgetNodes !== 200000
    || !game.moves({ verbose: true }).some(m => `${m.from}${m.to}${m.promotion ?? ''}` === request.rootUci)) throw Error('Invalid search request')
}
const directory = new URL(`agent-output/brilliant-missing-evidence-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
const save = (name, data) => writeFile(new URL(name, directory), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
await save('schedule.json', manifest)
const searches = [], rows = []
const started = performance.now(), cap = manifest.proposedGlobalActualNodeCap
let engine, actualNodes = 0, failure = null, wdlSupported = false, options = []
try {
  engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)), fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
  await engine.init()
  if (!/^Stockfish 19\b/.test(engine.version)) throw Error('Unexpected engine identity')
  await engine.request(['uci'], raw => { options.push(raw); if (raw === 'uciok') return true })
  wdlSupported = options.some(raw => /^option name UCI_ShowWDL type check\b/.test(raw))
  await engine.request([...(wdlSupported ? ['setoption name UCI_ShowWDL value true'] : []), 'isready'], raw => raw === 'readyok' ? true : undefined)
  await save('engine-options.json', { version: engine.version, wdlSupported, options })
  for (const [index, request] of manifest.schedule.entries()) {
    if (actualNodes + request.budgetNodes + 2000 > cap) throw Error('Remaining cap insufficient; no retry')
    await engine.request(['ucinewgame', 'setoption name Clear Hash', 'setoption name MultiPV value 1', 'isready'], raw => raw === 'readyok' ? true : undefined)
    const rawLines = [], searchStarted = performance.now()
    let nodes = 0, stopped = false
    const bestmove = await engine.request([`position fen ${request.fen}`, `go nodes ${request.budgetNodes} searchmoves ${request.rootUci}`], raw => {
      rawLines.push(raw); nodes = Math.max(nodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
      if (!stopped && actualNodes + nodes >= cap) { stopped = true; engine.process.stdin.write('stop\n') }
      if (raw.startsWith('bestmove ')) return raw
    })
    actualNodes += nodes
    const selected = completedRootScore(rawLines, request.rootUci), replay = new Chess(request.fen)
    for (const uci of selected.completed?.pv ?? []) replay.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    const wdlMatch = selected.completed?.raw.match(/\bwdl (\d+) (\d+) (\d+)/)
    const wdl = wdlMatch ? { win: Number(wdlMatch[1]), draw: Number(wdlMatch[2]), loss: Number(wdlMatch[3]) } : null
    if (wdl && wdl.win + wdl.draw + wdl.loss !== 1000) throw Error('Invalid WDL telemetry')
    const record = { ...request, actualNodes: nodes, elapsedMs: performance.now() - searchStarted,
      engineVersion: engine.version, bestmove, rawLines, completed: selected.completed, latest: selected.latest,
      status: selected.completed && !stopped ? 'estimated' : 'insufficient', stoppedForCap: stopped,
      wdlOpponentPermille: wdl,
      expectedPointsMoverFromEngineWdl: wdl ? (wdl.loss + wdl.draw / 2) / 1000 : null }
    searches.push(record)
    await save(`search-${String(index + 1).padStart(2, '0')}.json`, record)
    if (!nodes || bestmove.split(' ')[1] !== request.rootUci || actualNodes > cap) throw Error('Unexpected root/telemetry or exceeded cap')
    if ((index + 1) % 5 === 0) console.log(JSON.stringify({ progress: index + 1, total: 30, actualNodes }))
  }
} catch (error) { failure = error.stack } finally { engine?.close() }
const usable = searches.filter(s => s.status === 'estimated')
for (const id of ids) {
  const cache = caches.get(id)
  for (const [index, entry] of cache.entries.entries()) {
    const baseline = prior.rows.find(r => r.id === id && r.ply === entry.ply)
    if (!baseline || baseline.san !== entry.san) throw Error('Baseline mismatch')
    const result = classifyAttributedBrilliant(entry, baseline.base, cache.entries[index - 2], cache.entries[index - 1], usable)
    // Reference labels are copied only after evidence-only classification.
    rows.push({ id, group: baseline.group, ply: entry.ply, san: entry.san, expected: baseline.expected,
      excluded: baseline.excluded, base: baseline.base, before: baseline.v3, after: result.brilliant,
      beforeStatus: baseline.status, beforeReason: baseline.reason, status: result.status, reason: result.reason,
      attributions: result.attributions, evidence: result.evidence })
  }
}
const metrics = (group, field) => {
  const own = rows.filter(r => !r.excluded && (group === 'all' || r.group === group))
  const assigned = own.filter(r => r[field]), positives = own.filter(r => r.expected === 'Geniale')
  const tp = assigned.filter(r => r.expected === 'Geniale').length
  return { group, version: field, tp, fp: assigned.length - tp, fn: positives.length - tp,
    precision: assigned.length ? tp / assigned.length : null, recall: positives.length ? tp / positives.length : null }
}
const watched = [...sources, ...manifest.sources]
let hashesUnchanged = true
for (const source of watched) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) hashesUnchanged = false
const changes = rows.filter(r => r.before !== r.after || r.beforeStatus !== r.status || r.beforeReason !== r.reason)
const summary = { searchesExecuted: searches.length, completedEstimates: usable.length,
  nominalNodes: searches.length * 200000, actualNodes, cap, capExceeded: actualNodes > cap,
  elapsedMs: performance.now() - started, wdlSupported, failure, sourceHashesUnchanged: hashesUnchanged,
  remainingAbstentions: rows.filter(r => r.status === 'insufficient').length, changedRows: changes.length,
  assignedAfter: rows.filter(r => r.after).length, independentValidation: false, appIntegration: false,
  metrics: ['development', 'historical', 'all'].flatMap(g => ['before', 'after'].map(f => metrics(g, f))) }
await save('results.json', { summary, changes, rows, searches, watched })
const report = ['# Geniale — completamento delle accettazioni mancanti', '',
  'Manifest congelato: ../brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json. Regole v3 invariate; campione già studiato.', '',
  ...Object.entries(summary).map(([k,v]) => `- ${k}: ${JSON.stringify(v)}`), '',
  '| Partita | Ply | SAN | Riferimento | Prima | Dopo | Esito |', '|---|---:|---|---|---|---|---|',
  ...changes.map(r => `| ${r.id} | ${r.ply} | ${r.san} | ${r.expected} | ${r.beforeReason} | ${r.reason} | ${r.after} |`), '',
  'WDL registrato come misura separata di auto-gioco Stockfish: non usato per cambiare soglie o etichette. Nessuna modifica ad app/Grande/cache, commit/push o lettura .env/7–10. Suite app/build/browser NON ESEGUITI.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, newlyAssigned: rows.filter(r => r.after && !r.before).map(r => ({ id: r.id, ply: r.ply, san: r.san, expected: r.expected, reason: r.reason })) }, null, 2))
if (failure || !hashesUnchanged) process.exitCode = 1
