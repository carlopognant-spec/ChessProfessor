import { StockfishEngine } from '../../src/lib/stockfish.js'

export function createStockfishTestWorker({ onAnalyze } = {}) {
  const messages = []
  let currentFen = null

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

      if (typeof message === 'string' && message.startsWith('position fen ')) {
        currentFen = message.slice('position fen '.length)
      }

      if (typeof message === 'string' && message.startsWith('go nodes')) {
        const analysis = onAnalyze?.({ fen: currentFen, messages, command: message }) ?? {
          evalCp: 35,
          mate: null,
          lines: [
            { multipv: 1, evalCp: 35, mate: null, pv: ['e2e4', 'e7e5'] },
            { multipv: 2, evalCp: 18, mate: null, pv: ['e7e5', 'g1f3'] },
          ],
          bestmove: 'e2e4',
        }

        const lines = analysis.lines ?? [
          { multipv: 1, evalCp: analysis.evalCp ?? null, mate: analysis.mate ?? null, pv: analysis.pv ?? [] },
        ]

        queueMicrotask(() => {
          for (const line of lines) {
            const score = line.mate != null ? `score mate ${line.mate}` : `score cp ${line.evalCp ?? 0}`
            const pv = line.pv?.length ? ` pv ${line.pv.join(' ')}` : ''
            worker.onmessage?.({ data: `info depth 12 multipv ${line.multipv} ${score}${pv}` })
          }
          worker.onmessage?.({ data: `bestmove ${analysis.bestmove ?? '0000'}` })
        })
      }
    },
    terminate() {},
  }

  return worker
}

export function createStockfishTestEngine(options = {}) {
  return new StockfishEngine({
    workerFactory: () => createStockfishTestWorker(options),
  })
}