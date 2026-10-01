// Esegue Stockfish in un Web Worker caricando lo script da CDN con importScripts.
// Questa tecnica evita di dover copiare/bundlare i file .wasm nel progetto:
// il Worker stesso è creato da un Blob (quindi same-origin), ma il suo codice
// importa Stockfish da un CDN esterno via importScripts (permesso cross-origin
// dentro un Worker). Il motore serve SOLO per calcolo (eval + PV), mai per
// generare spiegazioni testuali: quello è compito del layer LLM.

const STOCKFISH_CDN_URL = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16.js'

function createWorker() {
  const workerSource = `importScripts('${STOCKFISH_CDN_URL}');`
  const blob = new Blob([workerSource], { type: 'application/javascript' })
  return new Worker(URL.createObjectURL(blob))
}

export class StockfishEngine {
  constructor(options = {}) {
    const workerFactory = options.workerFactory ?? createWorker

    this.worker = workerFactory()
    this.ready = false
    this._readyPromise = new Promise((resolve) => {
      this._resolveReady = resolve
    })
    this._currentRequest = null
    this._latestRequestId = 0
    this._onLine = null

    this.worker.onmessage = (e) => this._handleMessage(e.data)
    this.worker.postMessage('uci')
  }

  _handleMessage(line) {
    if (typeof line !== 'string') return

    if (line === 'uciok') {
      this.worker.postMessage('isready')
    }
    if (line === 'readyok' && !this.ready) {
      this.ready = true
      this._resolveReady()
    }
    if (this._onLine) this._onLine(line)
  }

  async waitUntilReady() {
    return this._readyPromise
  }

  /**
   * Analizza una posizione FEN e restituisce eval + prima linea principale (PV).
   * Solo l'ultima richiesta ha diritto a risolvere: richieste più vecchie vengono
   * scartate per evitare risultati obsoleti quando la posizione cambia rapidamente.
   * @param {string} fen
  * @param {number} depth
  * @param {number} multiPv
  * @returns {Promise<{evalCp: number|null, mate: number|null, pv: string[], lines: Array}>}
   */
  async analyze(fen, depth = 16, multiPv = 1) {
    await this.waitUntilReady()

    const requestId = ++this._latestRequestId

    return new Promise((resolve, reject) => {
      const previousRequest = this._currentRequest
      if (previousRequest) {
        previousRequest.cancelled = true
        previousRequest.reject(new Error('analysis superseded'))
      }

      const lines = new Map()
      const request = { id: requestId, cancelled: false, reject }

      this._currentRequest = request
      this._onLine = (line) => {
        if (requestId !== this._latestRequestId) return

        if (line.startsWith('info') && line.includes('score')) {
          const multiPvMatch = line.match(/ multipv (\d+)/)
          const cpMatch = line.match(/score cp (-?\d+)/)
          const mateMatch = line.match(/score mate (-?\d+)/)
          const pvMatch = line.match(/ pv (.+)/)
          const multipv = multiPvMatch ? parseInt(multiPvMatch[1], 10) : 1
          const current = lines.get(multipv) ?? { multipv, evalCp: null, mate: null, pv: [] }

          if (cpMatch) current.evalCp = parseInt(cpMatch[1], 10)
          if (mateMatch) current.mate = parseInt(mateMatch[1], 10)
          if (pvMatch) current.pv = pvMatch[1].trim().split(' ')
          lines.set(multipv, current)
        }

        if (line.startsWith('bestmove')) {
          if (requestId !== this._latestRequestId) return
          this._onLine = null
          this._currentRequest = null
          const orderedLines = [...lines.values()].sort((left, right) => left.multipv - right.multipv)
          const primary = orderedLines[0] ?? { evalCp: null, mate: null, pv: [] }
          resolve({ ...primary, lines: orderedLines })
        }
      }

      this.worker.postMessage(`setoption name MultiPV value ${Math.max(1, multiPv)}`)
      this.worker.postMessage(`position fen ${fen}`)
      this.worker.postMessage(`go depth ${depth}`)
    })
  }

  destroy() {
    this.worker.terminate()
  }
}
