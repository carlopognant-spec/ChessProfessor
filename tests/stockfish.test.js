import { describe, expect, it } from 'vitest'
import { StockfishEngine } from '../src/lib/stockfish.js'

function createFakeWorker() {
  const messages = []
  const worker = {
    messages,
    onmessage: null,
    postMessage(message) {
      messages.push(message)
      if (message === 'uci') {
        queueMicrotask(() => worker.onmessage?.({ data: 'uciok' }))
      }
      if (message === 'isready') {
        queueMicrotask(() => worker.onmessage?.({ data: 'readyok' }))
      }
      if (message.startsWith('go depth')) {
        queueMicrotask(() => {
          worker.onmessage?.({ data: 'info depth 12 multipv 2 score cp 18 pv e7e5 g1f3' })
          worker.onmessage?.({ data: 'info depth 12 multipv 1 score cp 35 pv e2e4 e7e5' })
          worker.onmessage?.({ data: 'bestmove e2e4' })
        })
      }
    },
    terminate() {},
  }
  return worker
}

describe('Stockfish MultiPV', () => {
  it('requests and returns the configured number of principal variations', async () => {
    const worker = createFakeWorker()
    const engine = new StockfishEngine({ workerFactory: () => worker })

    const result = await engine.analyze('startpos-fen', 12, 2)

    expect(worker.messages).toContain('setoption name MultiPV value 2')
    expect(worker.messages).toContain('go depth 12')
    expect(result.lines).toEqual([
      { multipv: 1, evalCp: 35, mate: null, pv: ['e2e4', 'e7e5'] },
      { multipv: 2, evalCp: 18, mate: null, pv: ['e7e5', 'g1f3'] },
    ])
    expect(result.evalCp).toBe(35)
    engine.destroy()
  })
})
