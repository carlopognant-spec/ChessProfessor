const abortError = () => new DOMException('Approfondimento interrotto', 'AbortError')

// Stockfish stays with EnginePanel. Only the existing synchronous chess work moves off the UI thread.
export function createRefinementWorkerClient({ workerFactory = () => new RefinementWorker(
  { name: 'chessprofessor-refinement' }) } = {}) {
  let worker = null, nextId = 0
  const pending = new Map()
  const stop = (error = abortError()) => {
    const previous = worker
    worker = null
    previous?.terminate()
    for (const request of pending.values()) { request.cleanup(); request.reject(error) }
    pending.clear()
  }
  const start = () => {
    if (worker) return worker
    const current = workerFactory()
    worker = current
    current.onerror = () => { if (worker === current) stop(new Error('Verifica interrotta: worker di approfondimento non disponibile.')) }
    current.onmessageerror = current.onerror
    current.onmessage = ({ data }) => {
      if (worker !== current) return
      const request = pending.get(data.id)
      if (!request) return
      if (data.type === 'search') {
        Promise.resolve().then(() => {
          if (!pending.has(data.id) || worker !== current) throw abortError()
          return request.analyzePosition(data.fen, data.nodes, data.multiPv, data.options)
        }).then(result => {
          if (pending.has(data.id) && worker === current) current.postMessage({ type: 'search-result', searchId: data.searchId, result })
        }, error => {
          if (pending.has(data.id) && worker === current) current.postMessage({ type: 'search-result', searchId: data.searchId,
            error: { name: error.name, message: error.message } })
        })
      } else if (data.type === 'entries') request.onEntries?.(data.entries)
      else if (data.type === 'progress') request.onProgress?.(data.value)
      else if (data.type === 'result' || data.type === 'error') {
        pending.delete(data.id)
        request.cleanup()
        if (data.type === 'error') request.reject(Object.assign(new Error(data.error.message), { name: data.error.name }))
        else request.resolve(data.result)
      }
    }
    return current
  }
  const call = (operation, entries, data = {}, callbacks = {}) => new Promise((resolve, reject) => {
    if (callbacks.signal?.aborted) { reject(abortError()); return }
    const id = ++nextId, onAbort = () => stop()
    const cleanup = () => callbacks.signal?.removeEventListener('abort', onAbort)
    try {
      const current = start()
      pending.set(id, { ...callbacks, resolve, reject, cleanup })
      callbacks.signal?.addEventListener('abort', onAbort, { once: true })
      current.postMessage({ id, operation, entries, ...data })
    } catch (error) { pending.delete(id); cleanup(); reject(error) }
  })
  return {
    inspect: entries => call('inspect', entries),
    plan: (entries, options, signal) => call('plan', entries, { options }, { signal }),
    view: entries => call('view', entries),
    run: (entries, plan, callbacks) => call('run', entries, { plan }, callbacks),
    cancel: () => stop(),
    destroy: () => stop(),
  }
}
import RefinementWorker from './refinementWorker.js?worker&inline'

