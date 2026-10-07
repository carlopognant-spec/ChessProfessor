import { ENGINE_CONFIG } from './engineConfig.js'
import { createAnalysisMetadata } from './analysisMetadata.js'

function createWorker() {
  return new Worker(`${import.meta.env.BASE_URL}${ENGINE_CONFIG.engine.workerFile}`)
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
    this._readyTimeoutMs = options.loadTimeoutMs ?? ENGINE_CONFIG.loadTimeoutMs
    this.engineId = null
    this._onLine = null
    this._workerError = null
    this._onFailure = options.onFailure
    // A component may unmount before anyone awaits readiness.
    this._readyPromise.catch(() => {})

    this.worker.onmessage = (e) => this._handleMessage(e.data)
    this.worker.onerror = () => {
      this._fail(new Error('Stockfish worker non è riuscito a caricare il motore.'))
    }
    this.worker.onmessageerror = () => this._fail(new Error('Stockfish worker ha restituito un messaggio non valido.'))
    this.worker.postMessage('uci')
  }

  _handleMessage(line) {
    if (this._workerError) return
    if (typeof line !== 'string') return
    if (line.startsWith('id name ')) this.engineId = line.slice(8)
    if (/^(?:abort|runtimeerror|error)|out of memory|memory access out of bounds|wasm streaming failed/i.test(line)) {
      this._fail(new Error(`Stockfish: ${line}`))
      return
    }

    if (line === 'uciok') {
      this.worker.postMessage(`setoption name Threads value ${ENGINE_CONFIG.threads}`)
      this.worker.postMessage(`setoption name Hash value ${ENGINE_CONFIG.hashMb}`)
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
      }, this._readyTimeoutMs)

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
  * @param {number} nodes
  * @param {number} multiPv
  * @returns {Promise<{evalCp: number|null, mate: number|null, pv: string[], lines: Array}>}
   */
  analyze(fen, nodes = ENGINE_CONFIG.nodes, multiPv = ENGINE_CONFIG.multiPv) {
    if (!Number.isSafeInteger(nodes) || nodes <= 0) return Promise.reject(new TypeError('Budget nodi non valido'))
    if (!Number.isSafeInteger(multiPv) || multiPv <= 0) return Promise.reject(new TypeError('MultiPV non valido'))
    return new Promise((resolve, reject) => {
      if (this._workerError) { reject(this._workerError); return }
      this._pendingRequest?.reject(new Error('analysis superseded'))
      this._pendingRequest = { fen, nodes, multiPv, resolve, reject, cancelled: false }
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
    const { fen, nodes, multiPv, resolve } = request
    const lines = new Map()
    let actualNodes = 0

    this._currentRequest = request
    this._onLine = (line) => {
      if (request.cancelled && !line.startsWith('bestmove')) return
      if (line.startsWith('info ')) actualNodes = Math.max(actualNodes, Number(line.match(/\bnodes (\d+)/)?.[1] ?? 0))

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
        if (!request.cancelled) resolve({ ...primary, fen, lines: orderedLines, actualNodes,
          analysisMetadata: createAnalysisMetadata({ nodes, multiPv, actualEngineId: this.engineId }) })
        this._startPending()
      }
    }

    this.worker.postMessage('ucinewgame')
    this.worker.postMessage('setoption name Clear Hash')
    this.worker.postMessage(`setoption name MultiPV value ${Math.max(1, multiPv)}`)
    this.worker.postMessage(`position fen ${fen}`)
    this.worker.postMessage(`go nodes ${nodes}`)
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
