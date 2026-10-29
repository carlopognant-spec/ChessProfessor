import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { expect, it } from 'vitest'
import { NativeEngine } from '../scripts/qa/native-engine.js'
import { StockfishEngine } from '../src/lib/stockfish.js'
import { buildPracticeCandidates, createPracticeAnalyzer, validPracticeSearch } from '../src/lib/reviewPractice.js'
import { createPracticeEngineSession } from '../src/lib/practiceEngineSession.js'

it('reviews the legacy f3 blunder through fresh real WASM searches', async () => {
  const native = new NativeEngine(process.execPath, 55000, [
    fileURLToPath(new URL('../scripts/qa/wasm-engine.cjs', import.meta.url)),
    fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url)),
  ])
  const commands = []
  const worker = {
    onmessage: null,
    postMessage(command) {
      commands.push(command)
      native.process.stdin.write(`${command}\n`)
    },
    terminate() { native.close() },
  }
  native.reader.on('line', data => worker.onmessage?.({ data }))
  native.process.on('error', error => worker.onerror?.(error))
  native.process.stdin.on('error', error => worker.onerror?.(error))
  native.process.on('exit', code => worker.onerror?.(new Error(`Stockfish terminated (${code})`)))
  const engine = new StockfishEngine({ workerFactory: () => worker, loadTimeoutMs: 55000 })
  try {
    await engine.waitUntilReady()
    const game = new Chess()
    game.move('f3'); game.move('e5')
    const fenBefore = game.fen()
    game.move('g4')
    const fenAfter = game.fen()
    const [candidate] = await buildPracticeCandidates({
      pgn: '1. f3 e5 2. g4 Qh4#', side: 'w', ply: 3,
      entries: [{ ply: 3, fenBefore, fenAfter, playedMove: 'g4', classification: 'blunder' }],
    })
    expect(candidate).toMatchObject({ side: 'w', ply: 3, originalSan: 'g4', history: { moves: ['f2f3', 'e7e5'] } })

    const broker = createPracticeEngineSession({ getEngine: () => engine, isActive: () => true, isReady: () => engine.ready })
    const searches = []
    const analyzer = createPracticeAnalyzer({ analyzePosition: async (fen, nodes, multiPv, options = {}) => {
      const result = await broker.analyze(fen, nodes, multiPv, options)
      searches.push({ multiPv, searchMoves: options.searchMoves, result, valid: validPracticeSearch(result, candidate, multiPv, options.searchMoves) })
      return result
    } })
    const prepared = await analyzer.prepare(candidate)
    expect(prepared.status, JSON.stringify(searches)).toBe('ready')
    expect(prepared.original).toMatchObject({ status: 'incorrect', newlyMated: true })
    const best = await analyzer.evaluate(prepared, prepared.referenceUci)
    expect(best.status).toBe('correct')

    const rootMoves = new Set(prepared.root.specialLines.map(line => line.pv[0]))
    const alternative = new Chess(candidate.fen).moves({ verbose: true })
      .map(move => `${move.from}${move.to}${move.promotion ?? ''}`)
      .find(uci => !rootMoves.has(uci))
    expect(alternative).toBeTruthy()
    const alternateVerdict = await analyzer.evaluate(prepared, alternative)
    expect(['correct', 'incorrect']).toContain(alternateVerdict.status)

    const historyPosition = `position fen ${candidate.history.initialFen} moves f2f3 e7e5`
    const positionCommands = commands.filter(command => command.startsWith('position '))
    expect(positionCommands.length).toBeGreaterThanOrEqual(3)
    expect(positionCommands.every(command => command === historyPosition)).toBe(true)
    expect(commands.filter(command => command === 'setoption name MultiPV value 2')).toHaveLength(3)
    const restrictedSearches = commands.filter(command => command.startsWith('go nodes '))
      .filter(command => command.includes(' searchmoves '))
    expect(restrictedSearches).toHaveLength(2)
    for (const command of restrictedSearches) {
      const moves = command.split(' searchmoves ')[1].split(' ')
      expect(moves).toHaveLength(2)
      expect(new Set(moves).size).toBe(2)
    }
    const goCommands = commands.filter(command => command.startsWith('go nodes '))
    expect(goCommands).toHaveLength(3)
    expect(goCommands.every(command => command.startsWith('go nodes 200000'))).toBe(true)
    expect(searches).toHaveLength(3)
    expect(searches.every(search => search.valid && search.result.analysisMetadata.multiPv === 2)).toBe(true)
    expect(searches[1].searchMoves).toEqual([prepared.referenceUci, candidate.originalUci])
    expect(searches[2].searchMoves).toEqual([prepared.referenceUci, alternative])
  } finally {
    engine.destroy()
  }
}, 60000)
