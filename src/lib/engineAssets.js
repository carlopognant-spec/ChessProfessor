import { ENGINE_CONFIG } from './engineConfig.js'

export const ENGINE_CACHE_NAME = 'chessprofessor-engine-' + ENGINE_CONFIG.engine.workerFile.replace(/\.js$/, '')
export function engineAssetUrls() {
  return [ENGINE_CONFIG.engine.workerFile, ENGINE_CONFIG.engine.wasmFile].map(name => new URL(import.meta.env.BASE_URL + name, location.href).href)
}
export async function engineAssetsCached() {
  try {
    if (!globalThis.caches || !await caches.has(ENGINE_CACHE_NAME)) return false
    const cache = await caches.open(ENGINE_CACHE_NAME)
    return (await Promise.all(engineAssetUrls().map(url => cache.match(url)))).every(Boolean)
  } catch { return false }
}
export async function prepareEngineCache() {
  if (!globalThis.isSecureContext || !navigator.serviceWorker) {
    return { persistent: false, note: 'In questo browser il download del motore potrebbe ripetersi.' }
  }
  try {
    const scope = new URL(import.meta.env.BASE_URL, location.href).href
    const script = scope + 'engine-cache-sw.js?engine=' + ENGINE_CONFIG.engine.workerFile.replace(/\.js$/, '')
    let registration = await navigator.serviceWorker.getRegistration(scope)
    if (registration?.active?.scriptURL !== script) registration = await navigator.serviceWorker.register(script, { scope })
    const worker = registration.installing ?? registration.waiting ?? registration.active
    await new Promise((resolve, reject) => {
      if (!worker) return reject(new Error('Cache del motore non disponibile'))
      const finish = (error) => {
        clearTimeout(timer)
        worker.removeEventListener('statechange', check)
        navigator.serviceWorker.removeEventListener('controllerchange', check)
        error ? reject(error) : resolve()
      }
      const check = () => {
        if (worker.state === 'redundant') finish(new Error('Cache del motore non attivata'))
        else if (worker.state === 'activated' && navigator.serviceWorker.controller?.scriptURL === script) finish()
      }
      const timer = setTimeout(() => finish(new Error('Cache del motore non attivata in tempo')), 10000)
      worker.addEventListener('statechange', check)
      navigator.serviceWorker.addEventListener('controllerchange', check)
      check()
    })
    return { persistent: true, note: '' }
  } catch {
    return { persistent: false, note: 'Non è stato possibile conservare il motore nel browser; il download potrebbe ripetersi.' }
  }
}
