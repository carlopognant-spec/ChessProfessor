import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'
import { webcrypto } from 'node:crypto'
import { Chess } from 'chess.js'
import { createGameArchive, archiveAnalysisStatus, describePgn, validatedAnalysis } from '../src/lib/gameArchive.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'

const pgn = '[White "Carlo"]\n[Black "Nero"]\n[Date "2026.10.07"]\n[Result "*"]\n\n1. e4 {Commento} e5 *'
const makeArchive = () => createGameArchive({ indexedDB: new IDBFactory(), crypto: webcrypto })
function entriesFor(pgnText) {
  const { baseFen, moves } = describePgn(pgnText)
  const game = new Chess(baseFen)
  return moves.map((playedMove, index) => {
    const fenBefore = game.fen()
    game.move(playedMove)
    const analysisMetadata = createAnalysisMetadata()
    return { ply: index + 1, playedMove, fenBefore, fenAfter: game.fen(), analysisMetadata,
      engine: { evalCp: 20, mate: null, lines: [], analysisMetadata },
      playedEngine: { evalCp: -15, mate: null, lines: [], analysisMetadata }, classification: 'book' }
  })
}
afterEach(() => vi.restoreAllMocks())

describe('local game archive with simulated IndexedDB', () => {
  it('can reopen while a previous connection is still opening (React StrictMode cleanup)', async () => {
    const archive = makeArchive()
    await archive.save({ pgn })
    await archive.close()
    const discardedRead = archive.list().catch(() => [])
    const closing = archive.close()
    expect(await archive.list()).toHaveLength(1)
    await Promise.all([discardedRead, closing])
    expect(await archive.list()).toHaveLength(1)
    await archive.close()
  })
  it('deduplicates canonical PGN, preserves metadata, comments and analysis after reopening, renames and removes', async () => {
    const indexedDB = new IDBFactory()
    const options = { indexedDB, crypto: webcrypto }
    const archive = createGameArchive(options)
    const analysisEntries = entriesFor(pgn)
    const first = await archive.save({ pgn, analysisEntries })
    expect(first.duplicate).toBe(false)
    expect(first.record.id).toMatch(/^[0-9a-f]{64}$/)
    expect(first.record).toMatchObject({ players: { white: 'Carlo', black: 'Nero' }, date: '2026.10.07', result: '*' })
    const second = await archive.save({ pgn: pgn.replace('1. e4', '1.   e4') })
    expect(second.duplicate).toBe(true)
    expect(second.record.importedAt).toBe(first.record.importedAt)
    expect(second.record.analysisEntries).toEqual(analysisEntries)
    expect(second.record.pgn).toContain('{Commento}')
    await archive.save({ pgn, analysisEntries: analysisEntries.slice(0, 1) })
    expect((await archive.list())[0].analysisEntries).toHaveLength(2)
    await archive.rename(first.record.id, 'Partita di Carlo')
    await archive.close()
    const reopened = createGameArchive(options)
    expect((await reopened.get(first.record.id)).title).toBe('Partita di Carlo')
    expect(archiveAnalysisStatus(await reopened.get(first.record.id))).toBe('current')
    await reopened.remove(first.record.id)
    expect(await reopened.list()).toEqual([])
    await reopened.close()
  })

  it('marks incompatible schema, engine, budget and mixed searches obsolete without destroying the saved data', async () => {
    const archive = makeArchive()
    const { record } = await archive.save({ pgn, analysisEntries: entriesFor(pgn) })
    for (const mutate of [r => { r.analysisSchemaVersion++ }, r => { r.analysisMetadata.engine.build = 'lite-single' },
      r => { r.analysisMetadata.budget.value = 800000 }, r => { r.analysisEntries[1].playedEngine.analysisMetadata.budget.value = 800000 },
      r => { r.analysisEntries[1].fenAfter = new Chess().fen() }]) {
      const stale = structuredClone(record)
      mutate(stale)
      expect(archiveAnalysisStatus(stale)).toBe('stale')
      expect(stale.analysisEntries).toHaveLength(2)
    }
    expect(archiveAnalysisStatus({})).toBe('none')
    expect(archiveAnalysisStatus({ ...record, pgn: 'invalid' })).toBe('stale')
    await archive.close()
  })

  it('rejects mismatched analysis and invalid PGN, leaving previous records intact', async () => {
    const archive = makeArchive()
    const first = await archive.save({ pgn })
    const entries = entriesFor(pgn)
    entries[0].playedMove = 'd4'
    await expect(archive.save({ pgn, analysisEntries: entries })).rejects.toThrow('non corrisponde')
    await expect(archive.save({ pgn: '1. e5 *' })).rejects.toThrow()
    expect(await archive.list()).toEqual([first.record])
    await archive.close()
  })

  it.each(['playedUci', 'uci'])('rejects a mismatching %s despite correct SAN and FEN, preserving the saved archive', async field => {
    const archive = makeArchive()
    const { record } = await archive.save({ pgn, analysisEntries: entriesFor(pgn) })
    const invalid = structuredClone(record)
    invalid.analysisEntries[0][field] = 'd2d4'
    const before = structuredClone(invalid)
    expect(validatedAnalysis(pgn, invalid.analysisEntries)).toEqual([])
    expect(archiveAnalysisStatus(invalid)).toBe('stale')
    await expect(archive.save({ pgn, analysisEntries: invalid.analysisEntries })).rejects.toThrow('non corrisponde')
    expect(invalid).toEqual(before)
    expect(await archive.get(record.id)).toEqual(record)
    await archive.close()
  })

  it('accepts legacy entries without UCI fields and matching underpromotion UCI fields', async () => {
    const legacy = entriesFor(pgn)
    expect(legacy.every(entry => !Object.hasOwn(entry, 'playedUci') && !Object.hasOwn(entry, 'uci'))).toBe(true)
    expect(validatedAnalysis(pgn, legacy)).toBe(legacy)
    const archive = makeArchive()
    const { record: legacyRecord } = await archive.save({ pgn, analysisEntries: legacy })
    expect(archiveAnalysisStatus(legacyRecord)).toBe('current')
    const game = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1')
    game.move({ from: 'a7', to: 'a8', promotion: 'n' })
    const promotionPgn = game.pgn(), promoted = entriesFor(promotionPgn)
    promoted[0].playedUci = 'a7a8n'
    promoted[0].uci = 'a7a8n'
    expect(validatedAnalysis(promotionPgn, promoted)).toBe(promoted)
    const { record } = await archive.save({ pgn: promotionPgn, analysisEntries: promoted })
    expect(archiveAnalysisStatus(record)).toBe('current')
    expect(record.analysisEntries[0]).toMatchObject({ playedUci: 'a7a8n', uci: 'a7a8n' })
    for (const field of ['playedUci', 'uci']) {
      const incorrectPromotion = structuredClone(promoted)
      incorrectPromotion[0][field] = 'a7a8q'
      expect(validatedAnalysis(promotionPgn, incorrectPromotion)).toEqual([])
    }
    await archive.close()
  })

  it('reports unavailable/private storage and missing secure hashing instead of pretending to save', async () => {
    await expect(createGameArchive({ indexedDB: null }).list()).rejects.toThrow('non disponibile')
    await expect(createGameArchive({ indexedDB: { open: () => { throw new DOMException('Denied', 'SecurityError') } } }).list()).rejects.toThrow()
    await expect(createGameArchive({ crypto: null }).save({ pgn })).rejects.toThrow('HTTPS')
  })

  it('reports quota errors, and resolves saves only after the write transaction commits', async () => {
    const archive = makeArchive()
    const { record } = await archive.save({ pgn })
    const put = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError') })
    await expect(archive.save({ pgn, title: 'Non salvato' })).rejects.toThrow('Spazio del browser esaurito')
    expect((await archive.get(record.id)).title).toBe(record.title)
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(function (value) {
      const request = put.call(this, value)
      request.onsuccess = () => this.transaction.abort()
      return request
    })
    await expect(archive.save({ pgn, title: 'Transazione annullata' })).rejects.toThrow('non disponibile')
    expect((await archive.get(record.id)).title).toBe(record.title)
    await archive.close()
  })

  it('preserves custom FEN starts in PGN and analysis chains', async () => {
    const game = new Chess()
    game.move('e4')
    const custom = new Chess(game.fen())
    custom.move('c5')
    const archive = makeArchive()
    const { record } = await archive.save({ pgn: custom.pgn(), analysisEntries: entriesFor(custom.pgn()) })
    expect(describePgn(record.pgn).baseFen).toBe(game.fen())
    expect(record.analysisEntries[0].fenBefore).toBe(game.fen())
    expect(archiveAnalysisStatus(record)).toBe('current')
    await archive.close()
  })
})
