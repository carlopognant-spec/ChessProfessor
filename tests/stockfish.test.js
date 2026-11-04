import { describe, expect, it, vi } from 'vitest'
import { StockfishEngine } from '../src/lib/stockfish.js'
import { createStockfishTestWorker } from './helpers/engine.js'

function controlledWorker() {
  return {
    messages: [],
    onmessage: null,
    postMessage(message) { this.messages.push(message) },
    emit(data) { this.onmessage({ data }) },
    terminate: vi.fn(),
  }
}

const historyInitialFen = '6nk/8/8/8/8/8/Q7/KN6 w - - 0 1'
const repetitionHistory = () => ({
  initialFen: historyInitialFen,
  moves: ['b1c3', 'g8f6', 'c3b1', 'f6g8', 'b1c3', 'g8f6', 'c3b1', 'f6g8'],
})
const historyTargetFen = '6nk/8/8/8/8/8/Q7/KN6 w - - 8 5'

describe('Stockfish history transport', () => {
  it('sends the full repetition history together with restricted root moves', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      worker.emit('readyok')
      const history = repetitionHistory()
      const pending = engine.analyze(historyTargetFen, 200000, 1, { history, searchMoves: ['b1c3'] })
      await vi.waitFor(() => expect(worker.messages).toContain('go nodes 200000 searchmoves b1c3'))
      expect(worker.messages).toContain(`position fen ${historyInitialFen} moves ${history.moves.join(' ')}`)
      expect(worker.messages).not.toContain(`position fen ${historyTargetFen}`)
      worker.emit('info depth 10 nodes 200000 score cp 0 pv b1c3')
      worker.emit('bestmove b1c3')
      const result = await pending
      expect(result).toMatchObject({ fen: historyTargetFen, history, evalCp: 0, analysisMetadata: { searchMoves: ['b1c3'] } })
      expect(result.analysisMetadata).not.toHaveProperty('history')
    } finally { engine.destroy() }
  })

  it('snapshots history before initialization so caller mutations cannot change the command or result', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      const history = repetitionHistory(), expected = repetitionHistory()
      const pending = engine.analyze(historyTargetFen, 200000, 1, { history })
      history.initialFen = 'invalid'
      history.moves[0] = 'a2a8'
      history.moves.push('a2a8')
      worker.emit('readyok')
      await vi.waitFor(() => expect(worker.messages).toContain(`position fen ${expected.initialFen} moves ${expected.moves.join(' ')}`))
      worker.emit('bestmove b1c3')
      expect((await pending).history).toEqual(expected)
    } finally { engine.destroy() }
  })

  it('omits the moves keyword for empty history and preserves legacy FEN-only results', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      worker.emit('readyok')
      const pending = engine.analyze(historyInitialFen, 200000, 1, { history: { initialFen: historyInitialFen, moves: [] } })
      await vi.waitFor(() => expect(worker.messages).toContain(`position fen ${historyInitialFen}`))
      expect(worker.messages.some(line => line.includes(' moves'))).toBe(false)
      worker.emit('bestmove b1c3')
      expect((await pending).history).toEqual({ initialFen: historyInitialFen, moves: [] })
      const legacy = engine.analyze(historyTargetFen, 200000, 1)
      await vi.waitFor(() => expect(worker.messages).toContain(`position fen ${historyTargetFen}`))
      worker.emit('bestmove b1c3')
      expect(await legacy).not.toHaveProperty('history')
    } finally { engine.destroy() }
  })

  it('rejects invalid histories without stopping an active valid request', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      worker.emit('readyok')
      const active = engine.analyze(historyTargetFen, 200000, 1, { history: repetitionHistory() })
      await vi.waitFor(() => expect(worker.messages).toContain('go nodes 200000'))
      const messages = [...worker.messages]
      for (const history of [
        null,
        { initialFen: 'invalid', moves: [] },
        { initialFen: historyInitialFen, moves: 'b1c3' },
        { initialFen: historyInitialFen, moves: [null] },
        { initialFen: historyInitialFen, moves: ['b1c3\ngo nodes 1'] },
        { initialFen: historyInitialFen, moves: ['b1c3q'] },
        { initialFen: historyInitialFen, moves: ['b1b4'] },
        { initialFen: historyInitialFen, moves: [] },
      ]) {
        await expect(engine.analyze(historyTargetFen, 200000, 1, { history })).rejects.toThrow()
      }
      expect(worker.messages).toEqual(messages)
      worker.emit('bestmove b1c3')
      expect(await active).toMatchObject({ fen: historyTargetFen, history: repetitionHistory() })
    } finally { engine.destroy() }
  })

  it('rejects a mismatched history before replacing work queued during initialization', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      const queued = engine.analyze(historyTargetFen, 200000, 1, { history: repetitionHistory() })
      await expect(engine.analyze(historyInitialFen, 200000, 1, { history: repetitionHistory() })).rejects.toThrow()
      worker.emit('readyok')
      await vi.waitFor(() => expect(worker.messages).toContain('go nodes 200000'))
      worker.emit('bestmove b1c3')
      expect(await queued).toMatchObject({ fen: historyTargetFen, history: repetitionHistory() })
    } finally { engine.destroy() }
  })

  it('drains cancelled history searches before starting the next history', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      worker.emit('readyok')
      const first = engine.analyze(historyTargetFen, 200000, 1, { history: repetitionHistory() })
      const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
      await vi.waitFor(() => expect(worker.messages).toContain('go nodes 200000'))
      engine.cancel()
      await rejected
      const history = { initialFen: historyInitialFen, moves: ['b1c3'] }
      const nextFen = '6nk/8/8/8/8/2N5/Q7/K7 b - - 1 1'
      const next = engine.analyze(nextFen, 1000000, 1, { history })
      expect(worker.messages.filter(line => line.startsWith('go '))).toEqual(['go nodes 200000'])
      worker.emit('info depth 99 score cp 999 pv b1c3')
      worker.emit('bestmove b1c3')
      expect(worker.messages).toContain(`position fen ${historyInitialFen} moves b1c3`)
      expect(worker.messages).toContain('go nodes 1000000')
      worker.emit('info depth 10 score cp 0 pv g8f6')
      worker.emit('bestmove g8f6')
      expect(await next).toMatchObject({ fen: nextFen, history, evalCp: 0 })
      expect(worker.messages.filter(line => line === 'stop')).toHaveLength(1)
    } finally { engine.destroy() }
  })
})

describe('Stockfish MultiPV', () => {
  it('fails a silent search after 30 seconds, terminates it once and isolates a fresh engine', async () => {
    vi.useFakeTimers()
    const worker = controlledWorker(), onFailure = vi.fn()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure })
    const freshWorker = controlledWorker()
    const fresh = new StockfishEngine({ workerFactory: () => freshWorker })
    try {
      worker.emit('readyok')
      const search = engine.analyze('silent-fen')
      const rejected = expect(search).rejects.toThrow('non risponde durante la ricerca')
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(20000)
      worker.emit('unrelated output')
      worker.emit({ unexpected: 'message' })
      await vi.advanceTimersByTimeAsync(9999)
      expect(onFailure).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      await rejected
      expect(onFailure.mock.calls).toEqual([[engine.failure]])
      expect(worker.terminate).toHaveBeenCalledTimes(1)
      await expect(engine.analyze('future-fen')).rejects.toBe(engine.failure)

      freshWorker.emit('readyok')
      const next = fresh.analyze('new-fen')
      await vi.advanceTimersByTimeAsync(0)
      worker.emit('uciok')
      worker.emit('info depth 99 score cp 999 pv a2a4')
      worker.emit('bestmove a2a4')
      freshWorker.emit('info depth 12 score cp 20 pv e2e4')
      freshWorker.emit('bestmove e2e4')
      expect(await next).toMatchObject({ fen: 'new-fen', evalCp: 20 })
      engine.destroy()
      expect(worker.terminate).toHaveBeenCalledTimes(1)
      expect(onFailure).toHaveBeenCalledTimes(1)
      expect(vi.getTimerCount()).toBe(0)
    } finally { engine.destroy(); fresh.destroy(); vi.useRealTimers() }
  })

  it('allows a slow search while UCI info keeps arriving and clears its watchdog on completion', async () => {
    vi.useFakeTimers()
    const worker = controlledWorker(), onFailure = vi.fn()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure, searchIdleTimeoutMs: 100 })
    try {
      worker.emit('readyok')
      const search = engine.analyze('active-fen')
      await vi.advanceTimersByTimeAsync(0)
      for (let depth = 1; depth <= 4; depth++) {
        await vi.advanceTimersByTimeAsync(99)
        worker.emit(`info depth ${depth} nodes ${depth * 100}`)
      }
      await vi.advanceTimersByTimeAsync(99)
      expect(onFailure).not.toHaveBeenCalled()
      worker.emit('info depth 5 score cp 15 pv e2e4')
      worker.emit('bestmove e2e4')
      expect(await search).toMatchObject({ evalCp: 15 })
      await vi.advanceTimersByTimeAsync(1000)
      expect(onFailure).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    } finally { engine.destroy(); vi.useRealTimers() }
  })

  it('cancels the idle watchdog while draining a stopped search and arms a new independent one', async () => {
    vi.useFakeTimers()
    const worker = controlledWorker(), onFailure = vi.fn()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure, searchIdleTimeoutMs: 100 })
    try {
      worker.emit('readyok')
      const first = engine.analyze('first-fen')
      const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
      await vi.advanceTimersByTimeAsync(0)
      engine.cancel()
      await rejected
      const next = engine.analyze('next-fen')
      await vi.advanceTimersByTimeAsync(200)
      expect(worker.messages.filter(line => line.startsWith('go '))).toHaveLength(1)
      expect(onFailure).not.toHaveBeenCalled()
      worker.emit('info depth 99 score cp 999 pv a2a4')
      worker.emit('bestmove a2a4')
      expect(worker.messages).toContain('position fen next-fen')
      await vi.advanceTimersByTimeAsync(99)
      expect(onFailure).not.toHaveBeenCalled()
      worker.emit('info depth 12 score cp 20 pv e7e5')
      worker.emit('bestmove e7e5')
      expect(await next).toMatchObject({ fen: 'next-fen', evalCp: 20 })
      expect(vi.getTimerCount()).toBe(0)
    } finally { engine.destroy(); vi.useRealTimers() }
  })

  it('clears the idle watchdog on teardown without reporting a terminal failure', async () => {
    vi.useFakeTimers()
    const worker = controlledWorker(), onFailure = vi.fn()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure, searchIdleTimeoutMs: 100 })
    try {
      worker.emit('readyok')
      const search = engine.analyze('active-fen')
      const rejected = expect(search).rejects.toMatchObject({ name: 'AbortError' })
      await vi.advanceTimersByTimeAsync(0)
      engine.destroy()
      await rejected
      expect(vi.getTimerCount()).toBe(0)
      await vi.advanceTimersByTimeAsync(1000)
      expect(onFailure).not.toHaveBeenCalled()
      expect(worker.terminate).toHaveBeenCalledTimes(1)
    } finally { engine.destroy(); vi.useRealTimers() }
  })

  it('keeps restricted root searches separate from ordinary position profiles', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      worker.emit('readyok')
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const pending = engine.analyze(fen, 200000, 1, { searchMoves: ['e2e4'] })
      await vi.waitFor(() => expect(worker.messages).toContain('go nodes 200000 searchmoves e2e4'))
      worker.emit('info depth 10 nodes 200100 score cp 20 pv e2e4 e7e5')
      worker.emit('bestmove e2e4')
      expect(await pending).toMatchObject({ analysisMetadata: { searchMoves: ['e2e4'] }, specialLines: [{ depth: 10 }] })
      const count = worker.messages.length
      await expect(engine.analyze(fen, 200000, 1, { searchMoves: ['e2e5'] })).rejects.toThrow()
      await expect(engine.analyze(fen, 200000, 1, { searchMoves: [] })).rejects.toThrow()
      expect(worker.messages).toHaveLength(count)
    } finally { engine.destroy() }
  })
  it('cancels an active request and drains its bestmove before accepting the next request', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      worker.emit('readyok')
      const first = engine.analyze('first-fen', 1000000, 1)
      const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
      await vi.waitFor(() => expect(worker.messages).toContain('go nodes 1000000'))
      engine.cancel(); await rejected
      const next = engine.analyze('second-fen', 200000, 1)
      expect(worker.messages.filter(m => m.startsWith('go '))).toHaveLength(1)
      worker.emit('info depth 12 score cp 999 pv e2e4')
      worker.emit('bestmove e2e4')
      expect(worker.messages).toContain('position fen second-fen')
      worker.emit('info depth 12 score cp 20 pv e7e5')
      worker.emit('bestmove e7e5')
      expect(await next).toMatchObject({ evalCp: 20 })
      expect(worker.messages.filter(m => m === 'stop')).toHaveLength(1)
    } finally { engine.destroy() }
  })
  it('returns a complete earlier snapshot when bestmove returns to an earlier first choice', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      worker.emit('readyok')
      const pending = engine.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 200000, 2)
      await vi.waitFor(() => expect(worker.messages).toContain('go nodes 200000'))
      for (const raw of [
        'info depth 10 multipv 1 score cp 80 pv e2e4 e7e5',
        'info depth 10 multipv 2 score cp 60 pv d2d4 d7d5',
        'info depth 11 multipv 1 score cp 100 pv d2d4 d7d5',
        'info depth 11 multipv 2 score cp 50 pv e2e4 e7e5',
        'info depth 12 multipv 1 score cp 150 pv e2e4 e7e5',
        'bestmove e2e4',
      ]) worker.emit(raw)
      const result = await pending
      expect(result).toMatchObject({ bestmove: 'e2e4', evalCp: 150 })
      expect(result.specialLines.map(l => [l.depth, l.pv[0], l.evalCp]))
        .toEqual([[10, 'e2e4', 80], [10, 'd2d4', 60]])
      expect(worker.messages.filter(m => m.startsWith('go '))).toEqual(['go nodes 200000'])
    } finally { engine.destroy() }
  })
  it('keeps a completed comparison snapshot separately from a newer partial score', async () => {
    const worker = controlledWorker(), engine = new StockfishEngine({ workerFactory: () => worker })
    try {
      worker.emit('readyok')
      const pending = engine.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 200000, 2)
      await vi.waitFor(() => expect(worker.messages).toContain('go nodes 200000'))
      worker.emit('info depth 10 multipv 1 score cp 100 pv e2e4 e7e5')
      worker.emit('info depth 10 multipv 2 score cp 50 pv d2d4 d7d5')
      worker.emit('info depth 11 multipv 1 score cp 200 pv e2e4 e7e5')
      worker.emit('bestmove e2e4')
      const result = await pending
      expect(result.evalCp).toBe(200)
      expect(result.specialLines.map(line => [line.depth, line.evalCp])).toEqual([[10, 100], [10, 50]])
      expect(worker.messages.filter(message => message.startsWith('go '))).toEqual(['go nodes 200000'])
    } finally { engine.destroy() }
  })
  it('reports a terminal stop failure after the unchanged 15 seconds and rejects all queued work', async () => {
    vi.useFakeTimers()
    const worker = controlledWorker()
    const onFailure = vi.fn()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure })
    try {
      worker.emit('uciok')
      worker.emit('readyok')
      const first = engine.analyze('first-fen', 200000, 5)
      const firstRejected = expect(first).rejects.toThrow('analysis superseded')
      await vi.advanceTimersByTimeAsync(0)
      const middle = engine.analyze('middle-fen', 200000, 5)
      const middleRejected = expect(middle).rejects.toThrow('analysis superseded')
      const latest = engine.analyze('latest-fen', 200000, 5)
      const latestRejected = expect(latest).rejects.toThrow('ricerca interrotta')
      await firstRejected
      await middleRejected
      await vi.advanceTimersByTimeAsync(14999)
      expect(onFailure).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      await latestRejected
      expect(onFailure.mock.calls).toEqual([[engine.failure]])
      expect(worker.messages.filter(message => message === 'stop')).toHaveLength(1)
      expect(worker.messages.filter(message => message.startsWith('go '))).toEqual(['go nodes 200000'])
      await expect(engine.analyze('future-fen')).rejects.toBe(engine.failure)
      const messages = [...worker.messages]
      worker.emit('uciok')
      worker.emit('readyok')
      worker.emit('bestmove e2e4')
      expect(worker.messages).toEqual(messages)
    } finally {
      engine.destroy()
      vi.useRealTimers()
    }
  })

  it('reports a worker error during a search and rejects its pending replacement', async () => {
    const worker = controlledWorker()
    const onFailure = vi.fn()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure })
    try {
      worker.emit('readyok')
      const first = engine.analyze('first-fen')
      const firstRejected = expect(first).rejects.toThrow('analysis superseded')
      await vi.waitFor(() => expect(worker.messages).toContain('position fen first-fen'))
      const pending = engine.analyze('pending-fen')
      const pendingRejected = expect(pending).rejects.toThrow('worker')
      worker.onerror(new Error('worker failed'))
      await firstRejected
      await pendingRejected
      expect(onFailure.mock.calls).toEqual([[engine.failure]])
      await expect(engine.analyze('future-fen')).rejects.toBe(engine.failure)
      worker.onerror(new Error('second error'))
      expect(onFailure).toHaveBeenCalledTimes(1)
    } finally {
      engine.destroy()
    }
  })

  it('reports an idle worker failure without relying on an outstanding analysis promise', () => {
    const worker = controlledWorker()
    const onFailure = vi.fn()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure })
    worker.onerror(new Error('worker failed'))
    expect(onFailure.mock.calls).toEqual([[engine.failure]])
    engine.destroy()
  })

  it('rejects an active search on destroy without reporting teardown as a recoverable failure', async () => {
    const worker = controlledWorker()
    const onFailure = vi.fn()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure })
    worker.emit('readyok')
    const active = engine.analyze('active-fen')
    const rejected = expect(active).rejects.toMatchObject({ name: 'AbortError' })
    await vi.waitFor(() => expect(worker.messages).toContain('position fen active-fen'))
    engine.destroy()
    await rejected
    expect(onFailure).not.toHaveBeenCalled()
    expect(worker.terminate).toHaveBeenCalledTimes(1)
    worker.emit('bestmove e2e4')
    await expect(engine.analyze('future-fen')).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('rejects pending initialization on destroy and leaves a fresh mount independent of late old messages', async () => {
    const oldWorker = controlledWorker()
    const onFailure = vi.fn()
    const oldEngine = new StockfishEngine({ workerFactory: () => oldWorker, onFailure })
    const pending = oldEngine.analyze('old-fen')
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    oldEngine.destroy()
    await rejected
    const worker = createStockfishTestWorker()
    const engine = new StockfishEngine({ workerFactory: () => worker, onFailure })
    try {
      oldWorker.emit('uciok')
      oldWorker.emit('readyok')
      expect(oldWorker.messages).toEqual(['uci'])
      expect(await engine.analyze('new-fen', 200000, 5)).toMatchObject({ evalCp: 35 })
      expect(onFailure).not.toHaveBeenCalled()
    } finally {
      engine.destroy()
    }
  })

  it('keeps only the latest request while the worker is initializing', async () => {
    const worker = controlledWorker()
    const engine = new StockfishEngine({ workerFactory: () => worker })
    const first = engine.analyze('first-fen')
    const rejected = expect(first).rejects.toThrow('analysis superseded')
    const latest = engine.analyze('latest-fen')
    await rejected
    worker.emit('uciok')
    worker.emit('readyok')
    await vi.waitFor(() => expect(worker.messages).toContain('position fen latest-fen'))
    expect(worker.messages).not.toContain('position fen first-fen')
    worker.emit('info depth 12 score cp 18 pv d2d4')
    worker.emit('bestmove d2d4')
    expect(await latest).toMatchObject({ evalCp: 18, pv: ['d2d4'] })
    engine.destroy()
  })

  it('rejects pending work and future requests if an interrupted search never finishes', async () => {
    const worker = controlledWorker()
    const engine = new StockfishEngine({ workerFactory: () => worker, stopTimeoutMs: 20 })
    worker.emit('uciok')
    worker.emit('readyok')
    const first = engine.analyze('first-fen')
    const firstRejected = expect(first).rejects.toThrow('analysis superseded')
    await vi.waitFor(() => expect(worker.messages).toContain('position fen first-fen'))
    const pending = engine.analyze('pending-fen')
    await firstRejected
    await expect(pending).rejects.toThrow('ricerca interrotta')
    await expect(engine.analyze('future-fen')).rejects.toThrow('ricerca interrotta')
    expect(worker.messages).not.toContain('position fen pending-fen')
    engine.destroy()
  })

  it('settles queued requests when the worker errors or the engine is destroyed', async () => {
    for (const failure of ['error', 'destroy']) {
      const worker = controlledWorker()
      const engine = new StockfishEngine({ workerFactory: () => worker })
      worker.emit('uciok')
      worker.emit('readyok')
      const first = engine.analyze('first-fen')
      const firstRejected = expect(first).rejects.toThrow('analysis superseded')
      await vi.waitFor(() => expect(worker.messages).toContain('position fen first-fen'))
      const pending = engine.analyze('pending-fen')
      const pendingRejected = expect(pending).rejects.toThrow(failure === 'error' ? 'worker' : 'destroyed')
      if (failure === 'error') worker.onerror(new Error('worker failed'))
      else engine.destroy()
      await firstRejected
      await pendingRejected
      worker.emit('bestmove e2e4')
      expect(worker.messages).not.toContain('position fen pending-fen')
      engine.destroy()
    }
  })
  it('drains the old bestmove before starting the latest replacement search', async () => {
    const worker = createStockfishTestWorker()
    const originalPost = worker.postMessage
    worker.postMessage = message => {
      if (message.startsWith('go ') || message === 'stop' || message.startsWith('position ') || message.startsWith('setoption ')) worker.messages.push(message)
      else originalPost(message)
    }
    const engine = new StockfishEngine({ workerFactory: () => worker })
    await engine.waitUntilReady()
    const first = engine.analyze('first-fen')
    const firstRejected = expect(first).rejects.toThrow('analysis superseded')
    await vi.waitFor(() => expect(worker.messages.filter(command => command.startsWith('go '))).toHaveLength(1))
    const middle = engine.analyze('middle-fen')
    const middleRejected = expect(middle).rejects.toThrow('analysis superseded')
    const latest = engine.analyze('latest-fen')
    await firstRejected
    await middleRejected
    expect(worker.messages.filter(command => command.startsWith('go '))).toHaveLength(1)
    expect(worker.messages.filter(command => command === 'stop')).toHaveLength(1)
    worker.onmessage({ data: 'info depth 12 score cp 999 pv a2a4' })
    worker.onmessage({ data: 'bestmove a2a4' })
    await vi.waitFor(() => expect(worker.messages).toContain('position fen latest-fen'))
    expect(worker.messages).not.toContain('position fen middle-fen')
    worker.onmessage({ data: 'info depth 12 score cp 25 pv e7e5' })
    worker.onmessage({ data: 'bestmove e7e5' })
    expect(await latest).toMatchObject({ evalCp: 25, pv: ['e7e5'] })
    engine.destroy()
  })
  it('discards bounded scores and clears mate when an exact cp score replaces it', async () => {
    const worker = {
      onmessage: null,
      postMessage(message) {
        queueMicrotask(() => {
          if (message === 'uci') this.onmessage({ data: 'uciok' })
          if (message === 'isready') this.onmessage({ data: 'readyok' })
          if (message.startsWith('go nodes')) {
            for (const data of [
              'info depth 11 multipv 1 score mate 4 pv e2e4',
              'info depth 12 multipv 1 score cp 30 pv d2d4',
              'info depth 13 multipv 1 score cp 500 lowerbound pv e2e4',
              'bestmove d2d4',
            ]) this.onmessage({ data })
          }
        })
      },
      terminate() {},
    }
    const engine = new StockfishEngine({ workerFactory: () => worker })
    expect(await engine.analyze('test-fen', 200000, 1)).toMatchObject({ evalCp: 30, mate: null, depth: 12, pv: ['d2d4'] })
    engine.destroy()
  })
  it('uses the local stockfish worker entrypoint', () => {
    const originalWorker = globalThis.Worker
    const captured = []

    globalThis.Worker = class {
      constructor(url) {
        captured.push(url)
        this.onmessage = null
      }
      postMessage() {}
      terminate() {}
    }

    try {
      new StockfishEngine()
      expect(captured).toEqual([`${import.meta.env.BASE_URL}stockfish-19.0.0-single.js`])
    } finally {
      globalThis.Worker = originalWorker
    }
  })

  it('rejects when stockfish never becomes ready', async () => {
    vi.useFakeTimers()
    const worker = {
      onmessage: null,
      postMessage() {},
      terminate() {},
    }
    const engine = new StockfishEngine({ workerFactory: () => worker })

    try {
      const rejection = expect(engine.waitUntilReady()).rejects.toThrow('Stockfish non si è inizializzato')
      await vi.advanceTimersByTimeAsync(179999)
      expect(engine.failure).toBeNull()
      await vi.advanceTimersByTimeAsync(1)
      await rejection
    } finally { engine.destroy(); vi.useRealTimers() }
  })

  it('requests and returns the configured number of principal variations', async () => {
    const worker = createStockfishTestWorker()
    const engine = new StockfishEngine({ workerFactory: () => worker })

    const result = await engine.analyze('startpos-fen', 200000, 2)

    expect(worker.messages).toContain('setoption name MultiPV value 2')
    expect(worker.messages).toContain('go nodes 200000')
    expect(result.lines).toEqual([
      { multipv: 1, depth: 12, evalCp: 35, mate: null, pv: ['e2e4', 'e7e5'] },
      { multipv: 2, depth: 12, evalCp: 18, mate: null, pv: ['e7e5', 'g1f3'] },
    ])
    expect(result.evalCp).toBe(35)
    expect(result.analysisMetadata).toMatchObject({ engine: { version: '19', build: 'large-single' }, budget: { kind: 'nodes', value: 200000 }, multiPv: 2 })
    expect(worker.messages).toContain('setoption name Threads value 1')
    expect(worker.messages).toContain('setoption name Hash value 16')
    expect(worker.messages).toContain('ucinewgame')
    expect(worker.messages).toContain('setoption name Clear Hash')
    engine.destroy()
  })
})
