import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import vm from 'node:vm'
import { engineAssetsCached, engineAssetUrls, prepareEngineCache, ENGINE_CACHE_NAME } from '../src/lib/engineAssets.js'

afterEach(() => vi.unstubAllGlobals())
describe('lazy engine asset cache', () => {
  it('requires both versioned assets; an absent/unavailable cache is not a cached engine', async () => {
    vi.stubGlobal('location', { href: 'https://example.com/ChessProfessor/' })
    const urls = engineAssetUrls()
    expect(urls).toHaveLength(2)
    const match = vi.fn(async url => url.endsWith('.js') ? {} : undefined)
    const open = vi.fn(async () => ({ match }))
    vi.stubGlobal('caches', { has: async name => name === ENGINE_CACHE_NAME, open })
    expect(await engineAssetsCached()).toBe(false)
    match.mockResolvedValue({})
    expect(await engineAssetsCached()).toBe(true)
    open.mockRejectedValue(new Error('Storage unavailable'))
    expect(await engineAssetsCached()).toBe(false)
  })

  it('can analyze via HTTP caching when persistent caching is unavailable', async () => {
    vi.stubGlobal('isSecureContext', false)
    expect(await prepareEngineCache()).toMatchObject({ persistent: false })
    vi.stubGlobal('isSecureContext', true)
    vi.stubGlobal('location', { href: 'https://example.com/' })
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => { throw new Error('Denied') } } })
    expect(await prepareEngineCache()).toMatchObject({ persistent: false })
  })

  it('only intercepts its two engine assets and reuses the cached response', async () => {
    const handlers = new Map(), stored = new Map(), scope = 'https://example.com/ChessProfessor/'
    const stem = 'stockfish-19.0.0-single'
    const response = { ok: true, clone: () => response }
    const fetch = vi.fn(async () => response)
    const cache = { match: async request => stored.get(request.url), put: async (request, value) => stored.set(request.url, value) }
    vm.runInNewContext(fs.readFileSync(new URL('../public/engine-cache-sw.js', import.meta.url), 'utf8'), {
      URL, fetch, caches: { open: async () => cache },
      self: { location: { href: scope + 'engine-cache-sw.js?engine=' + stem }, registration: { scope }, addEventListener: (name, handler) => handlers.set(name, handler) },
    })
    expect(fetch).not.toHaveBeenCalled()
    for (const url of [scope + 'game.json', 'https://explorer.lichess.ovh/masters', scope + 'stockfish-19-lite-single.wasm']) {
      const event = { request: { method: 'GET', url }, respondWith: vi.fn() }
      handlers.get('fetch')(event)
      expect(event.respondWith).not.toHaveBeenCalled()
    }
    const waits = []
    const event = { request: { method: 'GET', url: scope + stem + '.wasm' }, respondWith: vi.fn(), waitUntil: p => waits.push(p) }
    handlers.get('fetch')(event)
    expect(await event.respondWith.mock.calls[0][0]).toBe(response)
    await Promise.all(waits)
    const next = { ...event, respondWith: vi.fn() }
    handlers.get('fetch')(next)
    expect(await next.respondWith.mock.calls[0][0]).toBe(response)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
