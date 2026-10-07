// Only engine assets are cached; no app shell, game data, COOP/COEP or other requests.
const stem = new URL(self.location.href).searchParams.get('engine')
if (!/^stockfish-\d+\.\d+\.\d+-single$/.test(stem ?? '')) throw new Error('Invalid engine cache version')
const cacheName = 'chessprofessor-engine-' + stem
const assets = new Set(['.js', '.wasm'].map(extension => new URL(stem + extension, self.registration.scope).href))
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()))
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !assets.has(event.request.url)) return
  event.respondWith((async () => {
    let cache
    try {
      cache = await caches.open(cacheName)
      const cached = await cache.match(event.request)
      if (cached) return cached
    } catch { /* Private browsing/storage restrictions: use the HTTP cache. */ }
    const response = await fetch(event.request)
    if (response.ok && cache) {
      // Stream to the worker while the browser writes its clone to disk.
      event.waitUntil(cache.put(event.request, response.clone()).catch(() => {}))
    }
    return response
  })())
})
