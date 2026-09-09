// Esegue Stockfish in un Web Worker caricando lo script da CDN con importScripts.
// Questa tecnica evita di dover copiare/bundlare i file .wasm nel progetto:
// il Worker stesso è creato da un Blob (quindi same-origin), ma il suo codice
// importa Stockfish da un CDN esterno via importScripts (permesso cross-origin
// dentro un Worker). Il motore serve SOLO per calcolo (eval + PV), mai per
// generare spiegazioni testuali: quello è compito del layer LLM.

const STOCKFISH_CDN_URL = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish.js'

function createWorker() {
  const workerSource = `importScripts('${STOCKFISH_CDN_URL}');`
  const blob = new Blob([workerSource], { type: 'application/javascript' })
  return new Worker(URL.createObjectURL(blob))
}

export class StockfishEngine {
  constructor() {
    this.worker = createWorker()
    this.ready = false
    this._readyPromise = new Promise((resolve) => {
      this._resolveReady = resolve
    })

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
   * @param {string} fen
   * @param {number} depth
   * @returns {Promise<{evalCp: number|null, mate: number|null, pv: string[]}>}
   */
  async analyze(fen, depth = 16) {
    await this.waitUntilReady()

    return new Promise((resolve) => {
      let lastInfo = { evalCp: null, mate: null, pv: [] }

      this._onLine = (line) => {
        if (line.startsWith('info') && line.includes('score')) {
          const cpMatch = line.match(/score cp (-?\d+)/)
          const mateMatch = line.match(/score mate (-?\d+)/)
          const pvMatch = line.match(/ pv (.+)/)

          if (cpMatch) lastInfo.evalCp = parseInt(cpMatch[1], 10)
          if (mateMatch) lastInfo.mate = parseInt(mateMatch[1], 10)
          if (pvMatch) lastInfo.pv = pvMatch[1].trim().split(' ')
        }

        if (line.startsWith('bestmove')) {
          this._onLine = null
          resolve(lastInfo)
        }
      }

      this.worker.postMessage(`position fen ${fen}`)
      this.worker.postMessage(`go depth ${depth}`)
    })
  }

  destroy() {
    this.worker.terminate()
  }
}
