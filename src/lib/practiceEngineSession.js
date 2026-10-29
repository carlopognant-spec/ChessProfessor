const abortError = () => {
  const error = new Error('Analisi interrotta')
  error.name = 'AbortError'
  return error
}

const unavailableError = () => new Error('Motore di analisi non disponibile.')

export function createPracticeEngineSession({ getEngine, isActive, isReady } = {}) {
  let pending = null

  const cancelRequest = request => {
    if (request.settled) return
    request.settled = true
    request.signal?.removeEventListener('abort', request.onAbort)
    if (pending === request) {
      pending = null
      try { request.engine.cancel?.() } catch { /* Keep cancellation immediate even if the worker rejects it. */ }
    }
    request.reject(abortError())
  }

  const session = {
    analyze(fen, nodes, multiPv, { signal, ...options } = {}) {
      if (signal?.aborted) return Promise.reject(abortError())
      if (!isActive?.()) return Promise.reject(abortError())

      let engine
      try { engine = getEngine?.() } catch { return Promise.reject(unavailableError()) }
      let ready = false
      try { ready = Boolean(engine && isReady?.()) } catch { /* Report unavailable below. */ }
      if (!ready || typeof engine.analyze !== 'function') return Promise.reject(unavailableError())

      if (pending) cancelRequest(pending)

      return new Promise((resolve, reject) => {
        const request = { engine, signal, resolve, reject, settled: false, onAbort: null }
        const settle = (fn, value) => {
          if (request.settled || pending !== request) return
          request.settled = true
          pending = null
          signal?.removeEventListener('abort', request.onAbort)
          fn(value)
        }
        request.onAbort = () => cancelRequest(request)
        pending = request
        signal?.addEventListener('abort', request.onAbort, { once: true })

        let analysis
        try { analysis = engine.analyze(fen, nodes, multiPv, options) }
        catch (error) { settle(reject, error); return }
        Promise.resolve(analysis).then(
          value => settle(resolve, value),
          error => settle(reject, error)
        )
      })
    },
    cancel() {
      if (pending) cancelRequest(pending)
    }
  }

  return session
}
