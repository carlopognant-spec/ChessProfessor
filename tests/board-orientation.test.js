import { describe, expect, it } from 'vitest'
import { BOARD_VIEW_KEY, detectPlayerOrientation, readBoardView, saveBoardView } from '../src/lib/boardOrientation.js'

describe('board view preferences', () => {
  it('matches a configured identity exactly and never guesses from turn or result', () => {
    expect(detectPlayerOrientation({ White: 'Other', Black: 'BUMCestinait0', Result: '1-0' }, ' bumcestinait0 ')).toBe('black')
    expect(detectPlayerOrientation({ White: 'BUMCestinait0', Black: 'Other' }, 'BUMCestinait0')).toBe('white')
    for (const headers of [{}, { White: 'Someone', Black: 'Other' }, { White: 'BUMCestinait0', Black: 'bumcestinait0' }]) {
      expect(detectPlayerOrientation(headers, 'BUMCestinait0')).toBeNull()
    }
    expect(detectPlayerOrientation({ White: '?' }, '?')).toBeNull()
    expect(detectPlayerOrientation({ White: 'BUMCestinait0' })).toBeNull()
  })
  it('persists manual choice separately from identity and tolerates unavailable storage', () => {
    const rows = new Map(), storage = { getItem: key => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, value) }
    const view = { mode: 'black', playerName: 'BUMCestinait0' }
    expect(saveBoardView(view, storage)).toBe(true)
    expect(readBoardView(storage)).toEqual(view)
    rows.set(BOARD_VIEW_KEY, '{broken')
    expect(readBoardView(storage)).toEqual({ mode: 'auto', playerName: '' })
    rows.set(BOARD_VIEW_KEY, JSON.stringify({ mode: 'wrong', playerName: 'User' }))
    expect(readBoardView(storage).mode).toBe('auto')
    const denied = { getItem() { throw Error('Denied') }, setItem() { throw Error('Denied') } }
    expect(readBoardView(denied).mode).toBe('auto')
    expect(saveBoardView(view, denied)).toBe(false)
  })
})
