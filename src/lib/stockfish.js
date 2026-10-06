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
    this._pendingRequest = null
    this._stopTimeout = null
    this._stopTimeoutMs = options.stopTimeoutMs ?? 15000
    this._onLine = null
    this._workerError = null
    this._onFailure = options.onFailure
    // A component may unmount before anyone awaits readiness.
    this._readyPromise.catch(() => {})

    this.worker.onmessage = (e) => this._handleMessage(e.data)
    this.worker.onerror = (error) => {
      this._fail(new Error('Stockfish worker non è riuscito a caricare il motore.'))
    }
    this.worker.postMessage('uci')
  }

  _handleMessage(line) {
    if (this._workerError) return
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
    if (this._workerError) throw this._workerError
    if (this.ready) return

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.ready) {
          clearTimeout(timeoutId)
          resolve()
          return
        }

        const timeoutError = new Error('Stockfish non si è inizializzato')
        this._fail(timeoutError)
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
  analyze(fen, depth = 16, multiPv = 1) {
    return new Promise((resolve, reject) => {
      if (this._workerError) { reject(this._workerError); return }
      this._pendingRequest?.reject(new Error('analysis superseded'))
      this._pendingRequest = { fen, depth, multiPv, resolve, reject, cancelled: false }
      const previousRequest = this._currentRequest
      if (previousRequest && !previousRequest.cancelled) {
        previousRequest.cancelled = true
        previousRequest.reject(new Error('analysis superseded'))
        this._stopTimeout = setTimeout(() => {
          this._fail(new Error('Stockfish non ha completato la ricerca interrotta'))
        }, this._stopTimeoutMs)
        this.worker.postMessage('stop')
      }
      this.waitUntilReady().then(() => this._startPending()).catch(error => this._fail(error))
    })
  }

  _startPending() {
    if (!this.ready || this._workerError || this._currentRequest || !this._pendingRequest) return
    const request = this._pendingRequest
    this._pendingRequest = null
    const { fen, depth, multiPv, resolve } = request
    const lines = new Map()

    this._currentRequest = request
    this._onLine = (line) => {
      if (request.cancelled && !line.startsWith('bestmove')) return

      if (line.startsWith('info') && line.includes('score') && !/\b(upperbound|lowerbound)\b/.test(line)) {
        const multiPvMatch = line.match(/ multipv (\d+)/)
        const cpMatch = line.match(/score cp (-?\d+)/)
        const mateMatch = line.match(/score mate (-?\d+)/)
        const pvMatch = line.match(/ pv (.+)/)
        const multipv = multiPvMatch ? parseInt(multiPvMatch[1], 10) : 1
        const current = lines.get(multipv) ?? { multipv, evalCp: null, mate: null, pv: [] }

        current.depth = Number(line.match(/\bdepth (\d+)/)?.[1] ?? 0)
        if (cpMatch) {
          current.evalCp = parseInt(cpMatch[1], 10)
          current.mate = null
        }
        if (mateMatch) {
          current.mate = parseInt(mateMatch[1], 10)
          current.evalCp = null
        }
        if (pvMatch) current.pv = pvMatch[1].trim().split(' ')
        lines.set(multipv, current)
      }

      if (line.startsWith('bestmove')) {
        if (this._stopTimeout) clearTimeout(this._stopTimeout)
        this._stopTimeout = null
        this._onLine = null
        this._currentRequest = null
        const orderedLines = [...lines.values()].sort((left, right) => left.multipv - right.multipv)
        const primary = orderedLines[0] ?? { evalCp: null, mate: null, pv: [] }
        if (!request.cancelled) resolve({ ...primary, lines: orderedLines })
        this._startPending()
      }
    }

    this.worker.postMessage(`setoption name MultiPV value ${Math.max(1, multiPv)}`)
    this.worker.postMessage(`position fen ${fen}`)
    this.worker.postMessage(`go depth ${depth}`)
  }

  _fail(error) {
    if (this._workerError) return
    this._workerError = error
    clearTimeout(this._readyTimeout)
    clearTimeout(this._stopTimeout)
    this._rejectReady(error)
    this._currentRequest?.reject(error)
    this._pendingRequest?.reject(error)
    this._currentRequest = null
    this._pendingRequest = null
    this._onLine = null
    // Terminal failures also need to reach the UI when no request is awaiting a result.
    if (error.name !== 'AbortError') this._onFailure?.(error)
  }

  get failure() {
    return this._workerError
  }

  destroy() {
    const error = new Error('Stockfish engine destroyed')
    error.name = 'AbortError'
    this._fail(error)
    this.worker.terminate()
  }
}
