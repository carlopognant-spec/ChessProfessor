export function createAnalysisCache(ttlMs = 60000) {
  const entries = new Map()

  return {
    get(key) {
      const entry = entries.get(key)
      if (!entry) return null

      if (Date.now() > entry.expiresAt) {
        entries.delete(key)
        return null
      }

      return entry.value
    },
    set(key, value) {
      entries.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      })
      return value
    },
    has(key) {
      return this.get(key) !== null
    },
    delete(key) {
      entries.delete(key)
    },
    clear() {
      entries.clear()
    },
  }
}
