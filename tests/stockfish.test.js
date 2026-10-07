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

describe('Stockfish MultiPV', () => {
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
