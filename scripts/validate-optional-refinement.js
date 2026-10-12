import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView } from '../src/lib/analysisRefinement.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { NativeEngine } from './qa/native-engine.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'

const root = new URL('../', import.meta.url), area = 'agent-output/optional-refinement-full-game-v1'
const sha = b => createHash('sha256').update(b).digest('hex'), sources = new Map()
async function input(path, json = true) {
  const b = await readFile(new URL(path, root)); sources.set(path, sha(b)); return json ? JSON.parse(b) : b.toString('utf8')
}
const save = (name, data) => writeFile(`${area}/${name}`, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { if (sha(await readFile(new URL(s.path, root))) !== s.sha256) throw Error(`Frozen source changed: ${s.path}`); sources.set(s.path, s.sha256) }
for (const p of ['scripts/validate-optional-refinement.js', 'scripts/qa/captured-node-search.js', 'scripts/qa/native-engine.js',
  'scripts/qa/wasm-engine.cjs', 'src/lib/analysisRefinement.js', 'src/lib/reviewEvaluation.js', 'src/lib/reviewMoves.js',
  'src/lib/specialClassification.js', 'src/lib/sacrificeEvidence.js', 'src/lib/materialRealization.js', 'src/lib/moveOpportunities.js',
  'src/lib/multiPvEvidence.js', 'src/lib/analysisMetadata.js', 'src/lib/gameArchive.js',
  'src/components/EnginePanel.jsx', 'src/App.jsx', 'agent-output/optional-refinement-v1-protocol.md',
  'node_modules/stockfish/package.json']) await input(p, false)
const cache = await input('tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-01.json')
const fixture = await input('tests/fixtures/qa/personal-01.json')
if (cache.packageVersion !== '19.0.0' || cache.engineBuild !== 'stockfish-19-single' || cache.searchLimit?.value !== 200000 || cache.multiPv !== 5) throw Error('Invalid baseline cache')
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions), metadata = createAnalysisMetadata()
let active = true
const history = []
const baseline = reclassifyReviewedMoves(cache.entries.map(e => {
  const isBookMove = active && book.hasPosition(e.fenAfter); if (!isBookMove) active = false
  const entry = { ...e, playedMove: e.san, playedUci: e.uci, side: e.fenBefore.split(' ')[1],
    moveHistorySan: [...history], analysisMetadata: metadata, isBookMove,
    engine: { ...e.engine, fen: e.fenBefore, analysisMetadata: metadata },
    playedEngine: { ...e.playedEngine, fen: e.fenAfter, analysisMetadata: metadata } }
  history.push(e.san); return entry
}))
const plan = buildRefinementPlan(baseline), reuse = new Map()
for (let i = 0; i < 24; i++) {
  const path = `agent-output/ordinary-depth-check-v1/search-${String(i).padStart(2, '0')}.json`
  const record = await input(path)
  if (record.nodes !== 1000000 || record.multiPv !== 5 || !record.actualNodes) throw Error('Invalid reusable search')
  if (plan.positions.includes(record.fen)) reuse.set(record.fen, { path, record })
}
const schedule = plan.positions.map((fen, i) => ({ i, fen, nodes: plan.nodes, reuse: reuse.get(fen)?.path ?? null }))
const newCount = schedule.filter(s => !s.reuse).length
const watched = [...sources].map(([path, sha256]) => ({ path, sha256 }))
async function verify(list = watched) { for (const s of list) if (sha(await readFile(new URL(s.path, root))) !== s.sha256) throw Error(`Source changed: ${s.path}`) }
if (process.argv[2] === '--prepare') {
  await mkdir(area, { recursive: true })
  await save('manifest.json', { date: '2026-10-12', game: fixture.id, plies: baseline.length, plan, schedule,
    newSearches: newCount, nominalNewNodes: newCount * plan.nodes, actualNodeCap: newCount * (plan.nodes + 5000), sources: watched })
  console.log(JSON.stringify({ prepared: true, plies: baseline.length, moves: plan.selectedPlies, positions: plan.positions.length,
    reused: reuse.size, newSearches: newCount, nominalNewNodes: newCount * plan.nodes }))
} else if (process.argv[2] === '--run') {
  const manifest = JSON.parse(await readFile(`${area}/manifest.json`, 'utf8'))
  if (JSON.stringify(manifest.plan) !== JSON.stringify(plan) || JSON.stringify(manifest.schedule) !== JSON.stringify(schedule)
    || manifest.newSearches !== newCount || manifest.actualNodeCap !== newCount * (plan.nodes + 5000)) throw Error('Manifest mismatch')
  await verify(manifest.sources)
  try { await access(`${area}/started.json`); throw Error('Already started; no automatic rerun') }
  catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { startedAt: new Date().toISOString() })
  let engine, actualNodes = 0, actualSearches = 0, partial = baseline
  const baselineBytes = JSON.stringify(baseline)
  try {
    if (JSON.parse(await readFile('node_modules/stockfish/package.json', 'utf8')).version !== '19.0.0') throw Error('Engine package mismatch')
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)),
      fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
    await engine.init()
    if (engine.version !== 'Stockfish 19 WASM') throw Error('Engine identity mismatch')
    const result = await refineGameEntries({ entries: baseline, plan,
      onEntries: entries => { partial = entries },
      analyzePosition: async (fen, nodes, multiPv) => {
        const task = schedule.find(s => s.fen === fen), old = reuse.get(fen)
        if (old) { await save(`position-${String(task.i).padStart(2, '0')}.json`, { ...task, reused: true, sourceNodes: old.record.actualNodes });
          return { ...old.record.engine, fen, actualNodes: 0 }
        }
        if (actualNodes + nodes + 5000 > manifest.actualNodeCap) throw Error('Budget exhausted')
        const record = await capturedNodeSearch(engine, fen, nodes, multiPv)
        actualSearches++; actualNodes += record.actualNodes
        await save(`position-${String(task.i).padStart(2, '0')}.json`, { ...task, ...record, reused: false })
        if (!record.actualNodes || actualNodes > manifest.actualNodeCap) throw Error('Invalid budget telemetry')
        console.log(JSON.stringify({ actualSearches, actualNodes, fenIndex: task.i }))
        return record.engine
      } })
    await verify()
    if (JSON.stringify(baseline) !== baselineBytes) throw Error('Initial data mutated')
    const view = selectRefinementView(result.entries, true), labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore',
      excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave',
      great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
    const rows = view.map((e, i) => ({ ply: e.ply, san: e.playedMove, expected: fixture.annotations[i].category,
      initial: labels[baseline[i].classification], refined: labels[e.classification],
      selected: plan.selectedPlies.includes(e.ply), compared: Boolean(e.refinementComparison?.examined) }))
    const summary = { game: fixture.id, plies: rows.length, selectedMoves: plan.selectedPlies.length,
      positions: plan.positions.length, reused: reuse.size, newSearches: actualSearches, actualNodes,
      initialCorrect: rows.filter(r => r.initial === r.expected).length, refinedCorrect: rows.filter(r => r.refined === r.expected).length,
      corrected: rows.filter(r => r.initial !== r.expected && r.refined === r.expected).length,
      regressed: rows.filter(r => r.initial === r.expected && r.refined !== r.expected).length,
      changedLabels: rows.filter(r => r.initial !== r.refined).length, initialPreserved: true, sourceHashesUnchanged: true,
      independentlyValidated: false, global592ScoreChanged: false }
    await save('results.json', { summary, rows, canonicalEntries: result.entries, sources: watched })
    await writeFile(`${area}/report.md`, ['# Approfondimento facoltativo: partita completa', '',
      ...Object.entries(summary).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`), '',
      '| ply | Mossa | Attesa | Iniziale | Approfondita | Selezionata |', '|---|---|---|---|---|---|',
      ...rows.filter(r => r.initial !== r.refined || r.selected).map(r => `| ${r.ply} | ${r.san} | ${r.expected} | ${r.initial} | ${r.refined} | ${r.selected} |`), '',
      'Partita già studiata, approfondimento selettivo sulle prime 12 mosse dubbie: non una nuova precisione generale. Le righe adiacenti usano gli stessi score FEN. Entrambe le analisi sono conservate; soglie e rating invariati.', ''].join('\n'), { flag: 'wx' })
    console.log(JSON.stringify({ summary, changes: rows.filter(r => r.initial !== r.refined) }, null, 2))
  } catch (e) { await save('failure.json', { message: e.message, actualNodes, actualSearches, partialEntries: partial }); throw e }
  finally { engine?.close() }
} else throw Error('Use --prepare or --run')
