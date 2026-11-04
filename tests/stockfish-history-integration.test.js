import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { expect, it } from 'vitest'
import { NativeEngine } from '../scripts/qa/native-engine.js'
import { StockfishEngine } from '../src/lib/stockfish.js'

it('uses repetition history in real WASM root and child searches while empty history matches FEN-only', async () => {
  const native = new NativeEngine(process.execPath, 30000, [
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
  const engine = new StockfishEngine({ workerFactory: () => worker, loadTimeoutMs: 30000 })
  try {
    const initialFen = '6nk/8/8/8/8/8/Q7/KN6 w - - 0 1'
    const cycle = ['b1c3', 'g8f6', 'c3b1', 'f6g8']
    const history = { initialFen, moves: [...cycle, ...cycle] }
    const game = new Chess(initialFen)
    for (const uci of history.moves) game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4) })
    const fen = game.fen()
    const rootFenOnly = await engine.analyze(fen, 200000, 5, { searchMoves: ['b1c3'] })
    const rootHistory = await engine.analyze(fen, 200000, 5, { searchMoves: ['b1c3'], history })
    expect(rootFenOnly.evalCp).toBeGreaterThan(400)
    expect(rootHistory.evalCp).toBe(0)

    game.move({ from: 'b1', to: 'c3' })
    const childFen = game.fen()
    const childHistory = { initialFen, moves: [...history.moves, 'b1c3'] }
    const childFenOnly = await engine.analyze(childFen, 200000, 5)
    const childWithHistory = await engine.analyze(childFen, 200000, 5, { history: childHistory })
    expect(childFenOnly.evalCp).toBeLessThan(-400)
    expect(childWithHistory.evalCp).toBe(0)

    const emptyFenOnly = await engine.analyze(fen, 200000, 5, { searchMoves: ['b1c3'] })
    const emptyHistory = await engine.analyze(fen, 200000, 5, {
      searchMoves: ['b1c3'], history: { initialFen: fen, moves: [] },
    })
    expect(emptyHistory.evalCp).toBe(emptyFenOnly.evalCp)
    expect(emptyHistory.pv).toEqual(emptyFenOnly.pv)
    expect(emptyHistory.lines).toEqual(emptyFenOnly.lines)
    expect(commands.filter(command => command === 'ucinewgame')).toHaveLength(6)
    expect(commands.filter(command => command === 'setoption name Clear Hash')).toHaveLength(6)
    expect(commands.filter(command => command === 'setoption name MultiPV value 5')).toHaveLength(6)
    expect(commands).toContain('setoption name Threads value 1')
    expect(commands).toContain('setoption name Hash value 16')
    expect(commands.filter(command => command.startsWith('go '))).toEqual([
      'go nodes 200000 searchmoves b1c3', 'go nodes 200000 searchmoves b1c3',
      'go nodes 200000', 'go nodes 200000',
      'go nodes 200000 searchmoves b1c3', 'go nodes 200000 searchmoves b1c3',
    ])
  } finally { engine.destroy() }
}, 30000)
