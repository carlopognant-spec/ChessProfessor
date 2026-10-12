import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'

const root = new URL('../', import.meta.url), dir = 'agent-output/ordinary-depth-check-v1'
const hash = b => createHash('sha256').update(b).digest('hex'), sources = new Map()
async function read(path, json = true) {
  const b = await readFile(new URL(path, root)); sources.set(path, hash(b))
  return json ? JSON.parse(b) : b.toString('utf8')
}
const save = (name, d) => writeFile(`${dir}/${name}`, JSON.stringify(d, null, 2) + '\n', { flag: 'wx' })
const prior = await read('agent-output/ordinary-classification-2026-10-09T16-15-34-436Z/results.json')
const lock = await read('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) {
  if (hash(await readFile(new URL(s.path, root))) !== s.sha256) throw Error(`Frozen source changed: ${s.path}`)
  sources.set(s.path, s.sha256)
}
for (const path of ['scripts/probe-ordinary-depth.js', `${dir}/protocol.md`, 'src/lib/reviewEvaluation.js',
  'src/lib/multiPvEvidence.js', 'src/lib/analysisMetadata.js', 'scripts/qa/native-engine.js',
  'scripts/qa/wasm-engine.cjs', 'node_modules/stockfish/package.json']) await read(path, false)
const ranks = { Migliore: 0, Ottima: 1, Buona: 2, Imprecisione: 3, Errore: 4, 'Errore grave': 5 }
const chosen = [], seen = new Set()
for (const category of ['Buona', 'Imprecisione', 'Errore']) {
  const rows = prior.rows.filter(r => r.expected === category)
  for (const [kind, predicate] of [
    ['independent-disagreement', r => r.evaluationSource === 'independent-position' && ranks[r.actual] < ranks[category]],
    ['pv1-disagreement', r => r.isEngineBest && ranks[r.actual] < ranks[category]],
    ['coherent-disagreement', r => r.evaluationSource === 'root-pv' && !r.isEngineBest && ranks[r.actual] < ranks[category]],
    ['correct-control', r => r.actual === category],
  ]) {
    const row = rows.find(r => !seen.has(`${r.id}/${r.ply}`) && predicate(r))
    if (!row) throw Error(`Missing diagnostic case: ${category}/${kind}`)
    seen.add(`${row.id}/${row.ply}`); chosen.push({ ...row, kind })
  }
}
const caches = {}
for (const id of new Set(chosen.map(r => r.id))) caches[id] = await read(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
const cases = chosen.map((r, i) => {
  const entry = caches[r.id].entries.find(e => e.ply === r.ply)
  if (!entry || entry.san !== r.san || entry.fenBefore !== r.fenBefore || entry.fenAfter !== r.fenAfter) throw Error('Case mismatch')
  return { i, id: r.id, ply: r.ply, san: r.san, expected: r.expected, kind: r.kind, entry }
})
const tasks = cases.flatMap(c => ['before', 'after'].map(phase => ({ i: c.i * 2 + Number(phase === 'after'), caseIndex: c.i,
  phase, fen: phase === 'before' ? c.entry.fenBefore : c.entry.fenAfter, nodes: 1000000, multiPv: 5 })))
const watch = [...sources].map(([path, sha256]) => ({ path, sha256 }))
async function verify(list = watch) { for (const s of list) if (hash(await readFile(new URL(s.path, root))) !== s.sha256) throw Error(`Source changed: ${s.path}`) }
if (process.argv[2] === '--prepare') {
  await mkdir(dir, { recursive: true })
  await save('manifest.json', { date: '2026-10-12', cases, tasks, nominalNodes: 24000000, cap: 24120000, reserve: 5000,
    packageVersion: '19.0.0', build: 'large-single', sources: watch })
  console.log('Prepared: 12 cases, 24 searches, 24,000,000 nominal nodes; engine not started.')
} else if (process.argv[2] === '--run') {
  const manifest = await read(`${dir}/manifest.json`)
  if (JSON.stringify(manifest.tasks) !== JSON.stringify(tasks) || manifest.nominalNodes !== 24000000
    || manifest.cap !== 24120000 || manifest.reserve !== 5000) throw Error('Manifest mismatch')
  await verify(manifest.sources)
  if ((await read('node_modules/stockfish/package.json')).version !== '19.0.0') throw Error('Engine package mismatch')
  try { await access(`${dir}/started.json`); throw Error('Already started; automatic rerun forbidden') }
  catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { startedAt: new Date().toISOString() })
  let engine, actualNodes = 0
  const records = []
  try {
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)),
      fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
    await engine.init()
    if (engine.version !== 'Stockfish 19 WASM') throw Error('Unexpected engine identity')
    for (const task of tasks) {
      if (actualNodes + task.nodes + manifest.reserve > manifest.cap) throw Error('Budget exhausted')
      await engine.request(['ucinewgame', 'setoption name Clear Hash', 'setoption name MultiPV value 5', 'isready'],
        raw => raw === 'readyok' ? true : undefined)
      const evidence = createMultiPvEvidence(Math.min(5, new Chess(task.fen).moves().length)), rawLines = [], latest = new Map()
      let nodes = 0
      const bestmove = await engine.request([`position fen ${task.fen}`, `go nodes ${task.nodes}`], raw => {
        rawLines.push(raw); evidence.accept(raw)
        nodes = Math.max(nodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
        const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
        if (raw.startsWith('info ') && score && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
          const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
          latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
            evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null,
            pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
        }
        if (raw.startsWith('bestmove ')) return raw.split(/\s+/)[1]
      })
      const lines = [...latest.values()].sort((a, b) => a.multipv - b.multipv)
      const result = { ...lines[0], lines, fen: task.fen, bestmove, specialLines: evidence.finish(bestmove),
        analysisMetadata: createAnalysisMetadata({ nodes: task.nodes }) }
      const record = { ...task, actualNodes: nodes, bestmove, rawLines, engine: result }
      await save(`search-${String(task.i).padStart(2, '0')}.json`, record); records.push(record); actualNodes += nodes
      if (!nodes || actualNodes > manifest.cap || !lines.length) throw Error('Invalid telemetry')
      const legal = new Chess(task.fen).moves({ verbose: true }).map(m => `${m.from}${m.to}${m.promotion ?? ''}`)
      if (!legal.includes(bestmove)) throw Error('Invalid bestmove')
      for (const line of [...lines, ...result.specialLines]) {
        const g = new Chess(task.fen)
        for (const u of line.pv) g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
      }
      console.log(JSON.stringify({ searches: records.length, totalNodes: actualNodes, caseIndex: task.caseIndex, phase: task.phase }))
    }
    await verify()
    const label = { best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', unclassified: 'Non valutabile' }
    const rows = cases.map(c => {
      const raw = { ...c.entry, playedMove: c.san, playedUci: c.entry.uci, isBookMove: false }
      const before = classifyReviewedMove(raw), after = classifyReviewedMove({ ...raw, engine: records[c.i * 2].engine, playedEngine: records[c.i * 2 + 1].engine })
      const compact = e => ({ category: label[e.classification], bestEval: e.bestEval, playedEval: e.playedEval, bestMate: e.bestMate,
        playedMate: e.playedMate, dropPct: e.dropPct, bestUci: e.bestUci, isEngineBest: e.isEngineBest,
        evidence: e.evaluationEvidence, mateComparison: e.mateComparison })
      return { i: c.i, id: c.id, ply: c.ply, san: c.san, expected: c.expected, kind: c.kind, before: compact(before), after: compact(after) }
    })
    const summary = { newSearches: records.length, actualNodes, cases: rows.length,
      correctBefore: rows.filter(r => r.before.category === r.expected).length, correctAfter: rows.filter(r => r.after.category === r.expected).length,
      corrected: rows.filter(r => r.before.category !== r.expected && r.after.category === r.expected).length,
      regressed: rows.filter(r => r.before.category === r.expected && r.after.category !== r.expected).length,
      changedLabels: rows.filter(r => r.before.category !== r.after.category).length,
      changedBestMove: rows.filter(r => r.before.bestUci !== r.after.bestUci).length,
      sourceHashesUnchanged: true, appChanged: false, independentValidation: false }
    await save('results.json', { summary, rows, sources: watch })
    await writeFile(`${dir}/report.md`, ['# Controllo selezionato 200k -> 1M nodi', '',
      ...Object.entries(summary).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`), '',
      '| Partita/ply | Mossa | Riferimento | 200k | 1M | Perdita 200k | Perdita 1M |', '|---|---|---|---|---|---:|---:|',
      ...rows.map(r => `| ${r.id}/${r.ply} | ${r.san} | ${r.expected} | ${r.before.category} | ${r.after.category} | ${r.before.dropPct?.toFixed(3)} | ${r.after.dropPct?.toFixed(3)} |`), '',
      'Campione diagnostico selezionato, con controlli: nessuna estrapolazione alle 592 mosse. Confronto numerico isolato, non una rianalisi completa delle categorie speciali. Curva, soglie, rating e budget dell’app invariati. Il risultato più profondo non è verità assoluta.', ''].join('\n'), { flag: 'wx' })
    console.log(JSON.stringify({ summary, rows }, null, 2))
  } catch (e) { await save('failure.json', { message: e.message, actualNodes, savedSearches: records.length }); throw e }
  finally { engine?.close() }
} else throw Error('Use --prepare or --run')
