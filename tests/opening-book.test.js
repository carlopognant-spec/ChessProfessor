import fs from 'node:fs'
import { Chess } from 'chess.js'
import { describe, expect, it, vi } from 'vitest'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook, loadOpeningBook, openingPositionKey } from '../src/lib/openingBook.js'

function originalPgn(number) {
  const folder = new URL(`../Partite/${number}/`, import.meta.url)
  const filename = fs.readdirSync(folder).find(name => name.endsWith('.pgn'))
  if (!filename) throw new Error(`Missing original PGN: Partite/${number}`)
  return fs.readFileSync(new URL(filename, folder), 'utf8')
}

const engine = async () => ({ evalCp: 0, mate: null, pv: [] })

describe('local opening repertoire', () => {
  it('ignores counters while preserving side, castling and en-passant rights', () => {
    const fen = new Chess().fen()
    const book = createOpeningBook([fen])
    expect(book.hasPosition(fen.replace('0 1', '12 25'))).toBe(true)
    expect(book.hasPosition(fen.replace(' w ', ' b '))).toBe(false)
    expect(book.hasPosition(fen.replace('KQkq', '-'))).toBe(false)
    expect(openingPositionKey('8/8/8/3pP3/8/8/8/K6k w - d6 0 4'))
      .not.toBe(openingPositionKey('8/8/8/3pP3/8/8/8/K6k w - - 0 4'))
  })

  it('loads the bundled book once and includes the two documented continuations', async () => {
    const book = await loadOpeningBook()
    expect(await loadOpeningBook()).toBe(book)
    for (const pgn of [
      '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d4 Nxe4',
      '1. e4 c5 2. Nf3 Nc6 3. Bc4 e6 4. O-O a6',
    ]) {
      const game = new Chess()
      game.loadPgn(pgn)
      expect(book.hasPosition(game.fen())).toBe(true)
    }
  })

  it.each([1, 2, 3, 4, 5, 6])('matches every annotated book flag in original game %i', async number => {
    const game = new Chess()
    game.loadPgn(originalPgn(number))
    const fixture = JSON.parse(fs.readFileSync(new URL(
      `./fixtures/qa/personal-${String(number).padStart(2, '0')}.json`, import.meta.url,
    ), 'utf8'))
    const entries = await analyzeGame({ moves: game.history(), analyzePosition: engine, analyzePlayedPosition: engine })
    const expected = fixture.annotations.map(annotation => annotation.category === 'Libro')
    expect(entries.map(entry => entry.isBookMove)).toEqual(expected)
    expect(entries.map(entry => entry.classification === 'book')).toEqual(expected)
    for (const side of ['w', 'b']) {
      expect(entries.filter(entry => entry.side === side && entry.isBookMove)).toHaveLength(
        fixture.annotations.filter(annotation => annotation.category === 'Libro'
          && (annotation.ply % 2 === 1 ? 'w' : 'b') === side).length,
      )
    }
  })

  it('recognizes exactly three book moves per side in the fixed Sicilian line even without headers or Explorer', async () => {
    const pgn = '[Event "Book regression"]\n\n1. e4 c5 2. Nf3 Nc6 3. Bc4 e6 4. c3 g6'
    const original = new Chess()
    original.loadPgn(pgn)
    const headerless = new Chess()
    headerless.loadPgn(pgn.replace(/^\[.*\]\s*$/gm, ''))
    expect(headerless.getHeaders().ECOUrl).toBeUndefined()
    const analyze = moves => analyzeGame({ moves, analyzePosition: engine, analyzePlayedPosition: engine })
    const entries = await analyze(original.history())
    expect(await analyze(headerless.history())).toEqual(entries)
    expect(entries.slice(0, 6).map(entry => entry.isBookMove)).toEqual(Array(6).fill(true))
    expect(entries.slice(6).every(entry => !entry.isBookMove && entry.classification !== 'book')).toBe(true)
    expect(entries.filter(entry => entry.side === 'w' && entry.isBookMove)).toHaveLength(3)
    expect(entries.filter(entry => entry.side === 'b' && entry.isBookMove)).toHaveLength(3)
    expect(entries[6]).toMatchObject({ playedMove: 'c3', isFirstBookDeviation: true })
  })

  it('recognizes known theory when Explorer fails or has already stopped', async () => {
    const fetchExplorer = vi.fn(async () => { throw new Error('401 Unauthorized') })
    const entries = await analyzeGame({
      moves: ['e4', 'c5', 'Nf3', 'Nc6', 'Bc4', 'e6'],
      analyzePosition: engine,
      analyzePlayedPosition: engine,
      fetchExplorer,
    })
    expect(fetchExplorer).toHaveBeenCalled()
    expect(entries.every(entry => entry.isBookMove && entry.classification === 'book')).toBe(true)
    expect(entries.every(entry => entry.explorer === null)).toBe(true)
    const stopped = await analyzeGame({
      moves: ['e4', 'c5', 'Nf3', 'Nc6', 'Bc4', 'e6'],
      analyzePosition: engine,
      analyzePlayedPosition: engine,
      fetchExplorer: async () => ({ white: 1, draws: 0, black: 0, moves: [] }),
    })
    expect(stopped.every(entry => entry.isBookMove && entry.classification === 'book')).toBe(true)
  })
})
