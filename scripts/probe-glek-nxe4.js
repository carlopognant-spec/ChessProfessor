import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { classifySpecialMove, formatSpecialAssessment, SPECIAL_POLICY } from '../src/lib/specialClassification.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

const root = new URL('../', import.meta.url), area = new URL('agent-output/glek-nxe4-v1/', root)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => readFile(new URL(path, root))
const save = (name, value) => writeFile(new URL(name, area), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'g3', 'Nxe4', 'Nxe4']
const game = new Chess(), fens = [game.fen()]
for (const san of moves) { game.move(san); fens.push(game.fen()) }
const schedule = [5, 6, 7, 8, 9].map((ply, i) => ({ i, afterPly: ply, fen: fens[ply], nodes: 200000, multiPv: 5 }))
const paths = ['scripts/probe-glek-nxe4.js', 'agent-output/glek-nxe4-v1/protocol.md',
  'src/lib/reviewEvaluation.js', 'src/lib/reviewMoves.js', 'src/lib/specialClassification.js',
  'src/lib/sacrificeEvidence.js', 'src/lib/moveOpportunities.js', 'src/lib/materialRealization.js',
  'src/lib/multiPvEvidence.js', 'src/lib/analysisMetadata.js', 'scripts/qa/native-engine.js',
  'scripts/qa/wasm-engine.cjs', 'node_modules/stockfish/package.json', 'src/data/openingPositions.json']
const lock = JSON.parse(await read('agent-output/specials-frozen-candidate-v1.json'))
for (const source of lock.sources) if (hash(await read(source.path)) !== source.sha256) throw Error(`Frozen source changed: ${source.path}`)
const watched = [...lock.sources, ...await Promise.all(paths.map(async path => ({ path, sha256: hash(await read(path)) })))]
const verify = async () => {
  for (const source of watched) if (hash(await read(source.path)) !== source.sha256) throw Error(`Source changed: ${source.path}`)
}
if (process.argv[2] === '--prepare') {
  await mkdir(area, { recursive: true })
  await save('manifest.json', { date: '2026-10-12', moves, schedule, policy: SPECIAL_POLICY.version,
    packageVersion: '19.0.0', build: 'large-single', nominalNodes: 1000000, cap: 1025000, reserve: 5000, sources: watched })
  console.log('Prepared: five searches, 1,000,000 nominal nodes; no engine started.')
} else if (process.argv[2] === '--run') {
  const manifest = JSON.parse(await read('agent-output/glek-nxe4-v1/manifest.json'))
  if (manifest.policy !== SPECIAL_POLICY.version || JSON.stringify(manifest.schedule) !== JSON.stringify(schedule)
    || manifest.nominalNodes !== 1000000 || manifest.cap !== 1025000 || manifest.reserve !== 5000) throw Error('Manifest mismatch')
  for (const source of manifest.sources) if (hash(await read(source.path)) !== source.sha256) throw Error(`Manifest source changed: ${source.path}`)
  if (JSON.parse(await read('node_modules/stockfish/package.json')).version !== '19.0.0') throw Error('Engine package mismatch')
  try { await access(new URL('started.json', area)); throw Error('This manifest has already been started; no automatic rerun allowed') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  await save('started.json', { startedAt: new Date().toISOString() })
  let engine, actualNodes = 0
  const searches = []
  try {
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)),
      fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
    await engine.init()
    if (engine.version !== 'Stockfish 19 WASM') throw Error('Unexpected engine identity')
    for (const task of schedule) {
      if (actualNodes + task.nodes + manifest.reserve > manifest.cap) throw Error('Budget exhausted')
      const evidence = createMultiPvEvidence(Math.min(5, new Chess(task.fen).moves().length))
      await engine.request(['ucinewgame', 'setoption name Clear Hash', 'setoption name MultiPV value 5', 'isready'],
        raw => raw === 'readyok' ? true : undefined)
      const rawLines = [], latest = new Map()
      let nodes = 0
      const bestmove = await engine.request([`position fen ${task.fen}`, `go nodes ${task.nodes}`], raw => {
        rawLines.push(raw); evidence.accept(raw)
        nodes = Math.max(nodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
        const match = raw.match(/\bscore (cp|mate) (-?\d+)/)
        if (raw.startsWith('info ') && match && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
          const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
          latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
            evalCp: match[1] === 'cp' ? Number(match[2]) : null, mate: match[1] === 'mate' ? Number(match[2]) : null,
            pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
        }
        if (raw.startsWith('bestmove ')) return raw.split(/\s+/)[1]
      })
      const lines = [...latest.values()].sort((a, b) => a.multipv - b.multipv)
      const result = { ...lines[0], fen: task.fen, bestmove, lines, specialLines: evidence.finish(bestmove),
        analysisMetadata: createAnalysisMetadata(), actualNodes: nodes }
      const record = { ...task, bestmove, actualNodes: nodes, rawLines, engine: result }
      await save(`search-${task.i}.json`, record); searches.push(record); actualNodes += nodes
      if (!nodes || actualNodes > manifest.cap || !lines.length) throw Error('Invalid telemetry or budget overrun')
      const legal = new Chess(task.fen).moves({ verbose: true }).map(m => `${m.from}${m.to}${m.promotion ?? ''}`)
      if (!legal.includes(bestmove)) throw Error('Illegal returned bestmove')
      console.log(JSON.stringify({ searched: task.i + 1, afterPly: task.afterPly, nodes, totalNodes: actualNodes }))
    }
    await verify()
    const book = createOpeningBook(JSON.parse(await read('src/data/openingPositions.json')).positions)
    const entries = []
    for (const ply of [6, 7, 8, 9]) {
      const before = new Chess(fens[ply - 1]), move = before.move(moves[ply - 1])
      entries.push(classifyReviewedMove({ ply, side: fens[ply - 1].split(' ')[1], playedMove: move.san,
        playedUci: `${move.from}${move.to}${move.promotion ?? ''}`, fenBefore: fens[ply - 1], fenAfter: fens[ply],
        isBookMove: book.hasPosition(fens[ply]), engine: searches[ply - 6].engine, playedEngine: searches[ply - 5].engine }))
    }
    const withoutConfirmation = classifySpecialMove(entries[2], entries[1], entries[0])
    const classified = reclassifyReviewedMoves(entries), target = classified[2]
    const before = new Chess(target.fenBefore)
    const sanLine = line => {
      const g = new Chess(target.fenBefore)
      return { ...line, san: line.pv.map(uci => g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san) }
    }
    const roots = (target.engine.specialLines.length ? target.engine.specialLines : target.engine.lines).map(sanLine)
    const summary = { policy: SPECIAL_POLICY.version, newSearches: searches.length, nominalNodes: 1000000, actualNodes,
      reference: 'Geniale, supplied screenshot; not queried from platform', bestMove: target.bestUci,
      bestSan: before.move({ from: target.bestUci.slice(0, 2), to: target.bestUci.slice(2, 4), promotion: target.bestUci[4] }).san,
      played: target.playedMove, isEngineBest: target.isEngineBest, isBook: target.isBookMove,
      base: target.numericalClassification, dropPct: target.dropPct, bestEval: target.bestEval, playedEval: target.playedEval,
      withoutConfirmation: withoutConfirmation.classification, actual: target.classification,
      brilliant: target.specialAssessment.brilliant, explanation: formatSpecialAssessment(target),
      sourceHashesUnchanged: true, independentAccuracyValidation: false }
    await save('results.json', { summary, roots, entries: classified, sources: watched })
    console.log(JSON.stringify(summary, null, 2))
  } catch (error) {
    await save('failure.json', { message: error.message, actualNodes, savedSearches: searches.length })
    throw error
  } finally { engine?.close() }
} else throw Error('Use --prepare or --run')
