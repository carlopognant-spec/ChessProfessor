function createWorker() {
  return new Worker(`${import.meta.env.BASE_URL}stockfish-19-lite-single.js`)
}

export class StockfishEngine {
  constructor(options = {}) {
    const workerFactory = options.workerFactory ?? createWorker

    this.worker = workerFactory()
    this.ready = false
    this._readyPromise = new Promise((resolve, reject) => {
      this._resolveReady = resolve
      this._rejectReady = reject
    })
    this._readyTimeout = null
    this._currentRequest = null
    this._latestRequestId = 0
    this._onLine = null
    this._workerError = null

    this.worker.onmessage = (e) => this._handleMessage(e.data)
    this.worker.onerror = (error) => {
      if (this._readyTimeout) clearTimeout(this._readyTimeout)
      this._workerError = new Error('Stockfish worker non è riuscito a caricare il motore.')
      this._rejectReady(this._workerError)
      this._currentRequest?.reject(this._workerError)
      this._currentRequest = null
    }
    this.worker.postMessage('uci')
  }

  _handleMessage(line) {
    if (typeof line !== 'string') return

    if (line === 'uciok') {
      this.worker.postMessage('isready')
    }
    if (line === 'readyok' && !this.ready) {
      if (this._readyTimeout) clearTimeout(this._readyTimeout)
      this.ready = true
      this._resolveReady()
    }
    if (this._onLine) this._onLine(line)
  }

  async waitUntilReady() {
    if (this.ready) return

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.ready) {
          clearTimeout(timeoutId)
          resolve()
          return
        }

        const timeoutError = new Error('Stockfish non si è inizializzato')
        this._rejectReady?.(timeoutError)
        reject(timeoutError)
      }, 15000)

      this._readyTimeout = timeoutId
      this._readyPromise.then(() => {
        clearTimeout(timeoutId)
        resolve()
      }).catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
    })
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
