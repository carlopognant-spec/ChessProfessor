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
          if (message.startsWith('go depth')) {
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
    expect(await engine.analyze('test-fen', 12, 1)).toMatchObject({ evalCp: 30, mate: null, depth: 12, pv: ['d2d4'] })
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
      expect(captured).toEqual([`${import.meta.env.BASE_URL}stockfish-19-lite-single.js`])
    } finally {
      globalThis.Worker = originalWorker
    }
  })

  it('rejects when stockfish never becomes ready', async () => {
    const worker = {
      onmessage: null,
      postMessage() {},
      terminate() {},
    }
    const engine = new StockfishEngine({ workerFactory: () => worker })

    await expect(engine.waitUntilReady()).rejects.toThrow('Stockfish non si è inizializzato')
    engine.destroy()
  }, 20000)

  it('requests and returns the configured number of principal variations', async () => {
    const worker = createStockfishTestWorker()
    const engine = new StockfishEngine({ workerFactory: () => worker })

    const result = await engine.analyze('startpos-fen', 12, 2)

    expect(worker.messages).toContain('setoption name MultiPV value 2')
    expect(worker.messages).toContain('go depth 12')
    expect(result.lines).toEqual([
      { multipv: 1, depth: 12, evalCp: 35, mate: null, pv: ['e2e4', 'e7e5'] },
      { multipv: 2, depth: 12, evalCp: 18, mate: null, pv: ['e7e5', 'g1f3'] },
    ])
    expect(result.evalCp).toBe(35)
    engine.destroy()
  })
})
