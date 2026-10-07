import { Chess } from 'chess.js'
import { isAnalysisCurrent } from './analysisMetadata.js'

export const ARCHIVE_SCHEMA_VERSION = 1
export const ANALYSIS_SCHEMA_VERSION = 1

export function describePgn(pgn) {
  const game = new Chess()
  game.loadPgn(pgn)
  const moves = game.history()
  if (!moves.length) throw new Error('La partita non contiene mosse.')
  const headers = game.getHeaders()
  return { pgn: game.pgn(), moves, headers, baseFen: headers.FEN ?? new Chess().fen() }
}

export function validatedAnalysis(pgn, entries = []) {
  const { baseFen, moves } = describePgn(pgn)
  const game = new Chess(baseFen)
  if (!Array.isArray(entries) || entries.length > moves.length) return []
  for (const [index, entry] of entries.entries()) {
    const before = game.fen()
    game.move(moves[index])
    if (entry?.ply !== index + 1 || entry.playedMove !== moves[index]
      || entry.fenBefore !== before || entry.fenAfter !== game.fen()) return []
  }
  return entries
}

export function archiveAnalysisStatus(record) {
  if (!record.analysisEntries?.length) return 'none'
  try {
    if (record.analysisSchemaVersion !== ANALYSIS_SCHEMA_VERSION || !isAnalysisCurrent(record)
      || validatedAnalysis(record.pgn, record.analysisEntries).length !== record.analysisEntries.length
      || !record.analysisEntries.every(entry => isAnalysisCurrent(entry)
        && isAnalysisCurrent({ analysisMetadata: entry.engine?.analysisMetadata })
        && isAnalysisCurrent({ analysisMetadata: entry.playedEngine?.analysisMetadata }))) return 'stale'
    return 'current'
  } catch { return 'stale' }
}

function storageError(error) {
  if (error?.name === 'QuotaExceededError') return new Error('Spazio del browser esaurito. Esporta o elimina alcune partite e riprova.')
  return new Error(`Archivio locale non disponibile: ${error?.message ?? 'IndexedDB non accessibile'}. Nessuna partita è stata salvata.`)
}

export function createGameArchive(options = {}) {
  let indexedDB
  try { indexedDB = Object.hasOwn(options, 'indexedDB') ? options.indexedDB : globalThis.indexedDB }
  catch { indexedDB = null }
  const { crypto = globalThis.crypto, databaseName = 'chessprofessor-games' } = options
  let databasePromise
  const open = () => {
    if (!indexedDB) return Promise.reject(storageError())
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      let blocked = false
      const request = indexedDB.open(databaseName, ARCHIVE_SCHEMA_VERSION)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('games')) request.result.createObjectStore('games', { keyPath: 'id' })
      }
      request.onerror = () => reject(request.error)
      request.onblocked = () => { blocked = true; reject(new Error('Archivio occupato: chiudi le altre schede di ChessProfessor e riprova.')) }
      request.onsuccess = () => {
        const db = request.result
        if (blocked) { db.close(); return }
        db.onversionchange = () => { db.close(); databasePromise = undefined }
        resolve(db)
      }
    }).catch(error => { databasePromise = undefined; throw storageError(error) })
    return databasePromise
  }
  const transaction = async (mode, work) => {
    const db = await open()
    return new Promise((resolve, reject) => {
      let result
      let tx
      try {
        tx = db.transaction('games', mode)
        tx.oncomplete = () => resolve(result)
        tx.onabort = () => reject(storageError(tx.error))
        tx.onerror = () => {} // Abort is the final outcome; never report a save on request success.
        work(tx.objectStore('games'), value => { result = value }, error => { tx.abort(); reject(storageError(error)) })
      } catch (error) { tx?.abort(); reject(storageError(error)) }
    })
  }
  return {
    list: () => transaction('readonly', (store, done) => {
      const request = store.getAll()
      request.onsuccess = () => done(request.result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    }),
    get: id => transaction('readonly', (store, done) => {
      const request = store.get(id)
      request.onsuccess = () => done(request.result ?? null)
    }),
    async save({ pgn, title, analysisEntries = [] }) {
      const document = describePgn(pgn)
      if (!crypto?.subtle) throw new Error('Per salvare le partite apri l’app tramite HTTPS o localhost.')
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(document.pgn))
      const id = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
      const entries = validatedAnalysis(document.pgn, analysisEntries)
      if (entries.length !== analysisEntries.length) throw new Error('L’analisi non corrisponde alla partita: salvataggio annullato.')
      return transaction('readwrite', (store, done, fail) => {
        const request = store.get(id)
        request.onsuccess = () => {
          try {
            const previous = request.result
            const now = new Date().toISOString()
            const record = {
              ...previous, id, schemaVersion: ARCHIVE_SCHEMA_VERSION, pgn: document.pgn,
              title: title?.trim() || previous?.title || `${document.headers.White || 'Bianco'} – ${document.headers.Black || 'Nero'}`,
              players: { white: document.headers.White ?? '?', black: document.headers.Black ?? '?' },
              date: document.headers.Date ?? '?', result: document.headers.Result ?? '*',
              importedAt: previous?.importedAt ?? now, updatedAt: now,
            }
            // Saving without analysis never deletes a previously stored analysis.
            if (entries.length && !(archiveAnalysisStatus(previous ?? {}) === 'current'
              && entries.length < previous.analysisEntries.length && entries.every(isAnalysisCurrent))) {
              record.analysisEntries = structuredClone(entries)
              record.analysisMetadata = structuredClone(entries[0].analysisMetadata)
              record.analysisSchemaVersion = ANALYSIS_SCHEMA_VERSION
            }
            store.put(record)
            done({ record, duplicate: Boolean(previous) })
          } catch (error) { fail(error) }
        }
      })
    },
    rename: (id, title) => transaction('readwrite', (store, done, fail) => {
      const request = store.get(id)
      request.onsuccess = () => {
        try {
          const record = request.result
          if (record && title.trim()) store.put({ ...record, title: title.trim(), updatedAt: new Date().toISOString() })
          done(Boolean(record))
        } catch (error) { fail(error) }
      }
    }),
    remove: id => transaction('readwrite', (store, done) => { store.delete(id); done(true) }),
    async close() {
      const pending = databasePromise
      databasePromise = undefined
      try { if (pending) (await pending).close() }
      catch { /* Unavailable storage has already been reported. */ }
    },
  }
}
