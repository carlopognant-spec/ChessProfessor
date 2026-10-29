export const REVIEW_PRACTICE_PROGRESS_KEY = 'chessprofessor.review-practice.v1'

const emptyProgress = () => ({ attempts: 0, mistakes: 0, solved: 0, assisted: 0, solutions: 0, skipped: 0, inconclusive: 0, updatedAt: null })
const invalidId = id => typeof id !== 'string' || !id || id.length > 200 || ['__proto__', 'constructor', 'prototype'].includes(id)
const italianError = (error, fallback) => typeof error?.message === 'string' && /^(I progressi|Identificativo|Esito|Il browser|Impossibile)/.test(error.message) ? error.message : fallback
const validRow = row => row && typeof row === 'object' && !Array.isArray(row)
  && ['attempts', 'mistakes', 'solved', 'assisted', 'solutions', 'skipped', 'inconclusive'].every(key => Number.isSafeInteger(row[key]) && row[key] >= 0 && row[key] <= 1000000)
  && (row.updatedAt === null || (typeof row.updatedAt === 'string' && row.updatedAt.length <= 40))

export function createPracticeProgressStore({ storage, maxEntries = 200 } = {}) {
  let storageError = null
  if (storage === undefined) {
    try { storage = globalThis.localStorage } catch { storageError = 'Il browser non permette di accedere ai progressi.' }
  }
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) maxEntries = 200

  const readAll = () => {
    if (storageError) throw new Error(storageError)
    const raw = storage.getItem(REVIEW_PRACTICE_PROGRESS_KEY)
    if (raw === null) return Object.create(null)
    let saved
    try { saved = JSON.parse(raw) } catch { throw new Error('I progressi salvati sono danneggiati.') }
    if (!saved || saved.version !== 1 || !saved.entries || typeof saved.entries !== 'object' || Array.isArray(saved.entries)) {
      throw new Error('I progressi salvati non sono validi.')
    }
    const entries = Object.create(null)
    for (const [id, row] of Object.entries(saved.entries).slice(-maxEntries)) {
      if (!invalidId(id) && validRow(row)) entries[id] = { ...row }
    }
    return entries
  }
  const result = (progress, error = null) => ({ progress, error })
  const read = id => {
    if (invalidId(id)) return result(emptyProgress(), 'Identificativo esercizio non valido.')
    try { return result(readAll()[id] ?? emptyProgress()) }
    catch (error) { return result(emptyProgress(), italianError(error, 'Impossibile leggere i progressi.')) }
  }

  return {
    read,
    record(id, { status, hints = 0 } = {}) {
      if (invalidId(id)) return result(emptyProgress(), 'Identificativo esercizio non valido.')
      const current = read(id)
      if (current.error) return current
      if (!['correct', 'incorrect', 'solution', 'skipped', 'inconclusive'].includes(status)
        || !Number.isSafeInteger(hints) || hints < 0) return result(current.progress, 'Esito o numero di suggerimenti non valido.')
      const progress = { ...current.progress, updatedAt: new Date().toISOString() }
      if (status === 'correct') { progress.attempts++; progress[hints === 0 ? 'solved' : 'assisted']++ }
      if (status === 'incorrect') { progress.attempts++; progress.mistakes++ }
      if (status === 'solution') progress.solutions++
      if (status === 'skipped') progress.skipped++
      if (status === 'inconclusive') progress.inconclusive++
      try {
        const entries = readAll()
        entries[id] = progress
        while (Object.keys(entries).length > maxEntries) delete entries[Object.keys(entries)[0]]
        storage.setItem(REVIEW_PRACTICE_PROGRESS_KEY, JSON.stringify({ version: 1, entries }))
        return result(progress)
      } catch (error) { return result(progress, italianError(error, 'Impossibile salvare i progressi.')) }
    },
    clear(id) {
      if (invalidId(id)) return result(emptyProgress(), 'Identificativo esercizio non valido.')
      let previous = emptyProgress()
      try {
        const entries = readAll()
        previous = entries[id] ?? previous
        delete entries[id]
        storage.setItem(REVIEW_PRACTICE_PROGRESS_KEY, JSON.stringify({ version: 1, entries }))
        return result(emptyProgress())
      } catch (error) { return result(previous, italianError(error, 'Impossibile salvare i progressi.')) }
    }
  }
}
