import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPracticeProgressStore, REVIEW_PRACTICE_PROGRESS_KEY } from '../src/lib/reviewPracticeProgress.js'

const memoryStorage = (initial = null) => {
  const values = new Map(initial === null ? [] : [[REVIEW_PRACTICE_PROGRESS_KEY, initial]])
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values
  }
}

describe('review practice progress', () => {
  afterEach(() => vi.restoreAllMocks())

  it('counts attempts, mistakes, clean solves, assisted solves and other outcomes separately', () => {
    const store = createPracticeProgressStore({ storage: memoryStorage() })
    expect(store.read('line-1')).toEqual({ progress: { attempts: 0, mistakes: 0, solved: 0, assisted: 0, solutions: 0, skipped: 0, inconclusive: 0, updatedAt: null }, error: null })
    store.record('line-1', { status: 'correct' })
    store.record('line-1', { status: 'correct', hints: 2 })
    store.record('line-1', { status: 'incorrect' })
    store.record('line-1', { status: 'solution' })
    store.record('line-1', { status: 'skipped' })
    const result = store.record('line-1', { status: 'inconclusive' })
    expect(result.error).toBeNull()
    expect(result.progress).toMatchObject({ attempts: 3, mistakes: 1, solved: 1, assisted: 1, solutions: 1, skipped: 1, inconclusive: 1 })
    expect(result.progress.updatedAt).toEqual(expect.any(String))
    expect(store.read('line-1').progress).toEqual(result.progress)
  })

  it('stores only versioned per-id counters, bounds entries FIFO and clears an id', () => {
    const storage = memoryStorage(), store = createPracticeProgressStore({ storage, maxEntries: 2 })
    store.record('a', { status: 'correct' })
    store.record('b', { status: 'incorrect' })
    store.record('c', { status: 'solution' })
    expect(JSON.parse(storage.getItem(REVIEW_PRACTICE_PROGRESS_KEY))).toMatchObject({ version: 1, entries: { b: { attempts: 1 }, c: { solutions: 1 } } })
    expect(store.read('a').progress.attempts).toBe(0)
    expect(store.clear('b')).toMatchObject({ error: null, progress: { attempts: 0 } })
    expect(store.read('b').progress.attempts).toBe(0)
  })

  it('reports malformed or hostile saved data without exposing it', () => {
    const corrupt = createPracticeProgressStore({ storage: memoryStorage('{') }).read('x')
    expect(corrupt.error).toMatch(/danneggiati/)
    expect(corrupt.progress.attempts).toBe(0)
    const hostile = memoryStorage(JSON.stringify({ version: 1, entries: { '__proto__': { attempts: 99 }, ok: { attempts: -1 } } }))
    expect(createPracticeProgressStore({ storage: hostile }).read('ok').progress.attempts).toBe(0)
    expect(createPracticeProgressStore({ storage: memoryStorage() }).record('__proto__', { status: 'correct' }).error).toMatch(/Identificativo/)
  })

  it('returns Italian errors when storage access or writes fail', () => {
    const readBlocked = createPracticeProgressStore({ storage: { getItem() { throw new Error('blocked') }, setItem() {} } }).read('x')
    expect(readBlocked.error).toMatch(/Impossibile leggere/)
    const writeBlocked = createPracticeProgressStore({ storage: { getItem() { return null }, setItem() { throw new Error('quota') } } }).record('x', { status: 'correct' })
    expect(writeBlocked.error).toMatch(/Impossibile salvare/)
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    try {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked') } })
      expect(createPracticeProgressStore().read('x').error).toMatch(/accedere/)
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original)
      else delete globalThis.localStorage
    }
  })
})
