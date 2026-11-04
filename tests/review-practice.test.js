import { Chess } from 'chess.js'
import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { analysisMetadataKey, createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { historyKey, normalizeHistory } from '../src/lib/analysisHistory.js'
import { buildPracticeCandidates, comparePracticeMoves, createPracticeAnalyzer,
  PRACTICE_MULTI_PV, PRACTICE_POLICY_VERSION, practiceExplanation, practiceExplanationEntry, practiceHint, validPracticeSearch } from '../src/lib/reviewPractice.js'
import { buildMoveExplanation } from '../src/lib/moveExplanation.js'
import { REVIEW_POLICY_VERSION } from '../src/lib/reviewEvaluation.js'

function reviewedGame(pgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6') {
  const game = new Chess(), entries = []
  const source = new Chess(); source.loadPgn(pgn)
  for (const san of source.history()) {
    const fenBefore = game.fen(), side = game.turn()
    game.move(san)
    entries.push({ ply: entries.length + 1, side, playedMove: san, fenBefore, fenAfter: game.fen(),
      classification: 'blunder', engine: { evalCp: 9999 }, playedEngine: { evalCp: -9999 } })
  }
  return { pgn: source.pgn(), entries }
}

async function candidate() {
  return (await buildPracticeCandidates({ ...reviewedGame(), ply: 5 }))[0]
}

// Synthetic legal continuations exercise orchestration, not Stockfish accuracy.
function searchResult(c, moves = ['f1b5', 'f1c4'], scores = [300, -300], searchMoves) {
  const specialLines = moves.map((uci, i) => ({ multipv: i + 1, depth: 12, evalCp: scores[i], mate: null, pv: [uci] }))
  return { fen: c.fen, history: structuredClone(c.history), actualNodes: ENGINE_CONFIG.nodes,
    analysisMetadata: { ...createAnalysisMetadata({ multiPv: moves.length }), ...(searchMoves ? { searchMoves } : {}) },
    bestmove: moves[0], specialLines }
}

describe('review practice with fresh history-aware evidence', () => {
  it('preserves the exact legacy progress ID under the original default grading criteria', async () => {
    const c = await candidate()
    const legacyTuple = [PRACTICE_POLICY_VERSION, c.gameId, c.ply, historyKey(c.history),
      analysisMetadataKey(createAnalysisMetadata({ multiPv: 2 })), REVIEW_POLICY_VERSION]
    expect(c.id).toBe(createHash('sha256').update(JSON.stringify(legacyTuple)).digest('hex'))
  })

  it.each([
    ['classification', 'good', 6], ['missedOpportunity', 'winningProbability', .8],
  ])('separates progress when %s.%s changes without changing worker search inputs', async (group, key, value) => {
    const original = await candidate(), previous = ENGINE_CONFIG[group][key]
    const profile = createAnalysisMetadata({ multiPv: 2 })
    try {
      ENGINE_CONFIG[group][key] = value
      const changed = await candidate()
      expect(changed.id).not.toBe(original.id)
      expect(createAnalysisMetadata({ multiPv: 2 })).toEqual(profile)
      const analyzePosition = vi.fn(async () => searchResult(changed))
      expect(await createPracticeAnalyzer({ analyzePosition }).prepare(changed)).toMatchObject({ status: 'ready' })
      expect(analyzePosition).toHaveBeenCalledWith(changed.fen, ENGINE_CONFIG.nodes, 2,
        { history: changed.history, signal: undefined })
    } finally { ENGINE_CONFIG[group][key] = previous }
    expect((await candidate()).id).toBe(original.id)
  })

  it('keeps IDs stable when configuration fields are reordered under default or changed grading criteria', async () => {
    const original = await candidate(), thresholds = ENGINE_CONFIG.classification, opportunity = ENGINE_CONFIG.missedOpportunity
    const reversed = object => Object.fromEntries(Object.entries(object).reverse())
    try {
      ENGINE_CONFIG.classification = reversed(thresholds)
      ENGINE_CONFIG.missedOpportunity = reversed(opportunity)
      expect((await candidate()).id).toBe(original.id)
      ENGINE_CONFIG.classification.good++
      const changed = await candidate()
      expect(changed.id).not.toBe(original.id)
      ENGINE_CONFIG.classification = reversed(ENGINE_CONFIG.classification)
      ENGINE_CONFIG.missedOpportunity = reversed(ENGINE_CONFIG.missedOpportunity)
      expect((await candidate()).id).toBe(changed.id)
    } finally {
      ENGINE_CONFIG.classification = thresholds
      ENGINE_CONFIG.missedOpportunity = opportunity
    }
    expect((await candidate()).id).toBe(original.id)
  })

  it('selects at most five errors of the chosen color and preserves the original PGN and exact history', async () => {
    const document = reviewedGame('1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8 5. Nf3 Nf6 6. Ng1 Ng8')
    document.entries[0].classification = 'mistake'
    const before = JSON.stringify(document)
    const white = await buildPracticeCandidates(document)
    expect(white).toHaveLength(5)
    expect(white.map(c => c.ply)).toEqual([3, 5, 7, 9, 11])
    expect(white.every(c => c.side === 'w')).toBe(true)
    for (const c of white) expect(normalizeHistory(c.history, c.fen).moves).toHaveLength(c.ply - 1)
    const black = await buildPracticeCandidates({ ...document, side: 'b' })
    expect(black.every(c => c.side === 'b' && c.ply % 2 === 0)).toBe(true)
    expect(JSON.stringify(document)).toBe(before)
    expect((await buildPracticeCandidates(document)).map(c => c.id)).toEqual(white.map(c => c.id))
  })

  it('rejects archive entries with mismatching position, move or ply', async () => {
    for (const mutate of [e => { e.fenBefore = new Chess().fen() }, e => { e.fenAfter = e.fenBefore },
      e => { e.playedMove = 'Bb5' }, e => { e.ply = 99 }]) {
      const document = reviewedGame(); mutate(document.entries[4])
      expect(await buildPracticeCandidates({ ...document, ply: 5 })).toEqual([])
    }
  })

  it('prepares from a fresh engine search instead of historical archive scores', async () => {
    const c = await candidate(), analyzePosition = vi.fn(async () => searchResult(c))
    const prepared = await createPracticeAnalyzer({ analyzePosition }).prepare(c)
    expect(prepared).toMatchObject({ status: 'ready', referenceUci: 'f1b5', original: { status: 'incorrect' } })
    expect(PRACTICE_MULTI_PV).toBe(2)
    expect(ENGINE_CONFIG.multiPv).toBe(5)
    expect(analyzePosition).toHaveBeenCalledWith(c.fen, ENGINE_CONFIG.nodes, 2, { history: c.history, signal: undefined })
    expect(prepared.root.analysisMetadata).toEqual(createAnalysisMetadata({ multiPv: 2 }))
    expect(prepared.original.played.evalCp).toBe(-300)
  })

  it('excludes old alleged errors when the fresh comparison finds an equivalent original move', async () => {
    const c = await candidate(), analyzePosition = vi.fn(async () => searchResult(c, undefined, [300, 299]))
    expect(await createPracticeAnalyzer({ analyzePosition }).prepare(c)).toMatchObject({ status: 'not-applicable', original: { status: 'correct' } })
  })

  it('rejects incomplete, bounded, wrong-history, wrong-profile and illegal-PV searches', async () => {
    const c = await candidate()
    expect(validPracticeSearch(searchResult(c), c)).toBe(true)
    const mutations = [r => r.specialLines.pop(), r => { r.specialLines[1].bound = true },
      r => { r.specialLines[1].raw = 'info score cp -300 upperbound' },
      r => { r.history = { initialFen: c.fen, moves: [] } },
      r => { r.analysisMetadata.budget.value++ }, r => { r.analysisMetadata.engine.version = '18' },
      r => { r.analysisMetadata.multiPv = 5 },
      r => { r.specialLines[1].pv.push('a1a8') }, r => { r.specialLines[1].depth++ },
      r => { r.specialLines[1].pv = [...r.specialLines[0].pv] }, r => { r.actualNodes = ENGINE_CONFIG.nodes + 5001 }]
    for (const mutate of mutations) {
      const result = searchResult(c); mutate(result)
      expect(validPracticeSearch(result, c)).toBe(false)
    }
    const pair = ['f1b5', 'h2h3'], restricted = searchResult(c, pair, [300, 299], pair)
    expect(validPracticeSearch(restricted, c, 2, pair)).toBe(true)
    delete restricted.analysisMetadata.searchMoves
    expect(validPracticeSearch(restricted, c, 2, pair)).toBe(false)
  })

  it('verifies an alternative outside MultiPV with a restricted root pair and preserves history', async () => {
    const c = await candidate(), pair = ['f1b5', 'h2h3']
    const analyzePosition = vi.fn(async (_fen, _nodes, _multiPv, options) => options.searchMoves
      ? searchResult(c, pair, [300, 299], options.searchMoves) : searchResult(c))
    const analyzer = createPracticeAnalyzer({ analyzePosition }), prepared = await analyzer.prepare(c)
    const before = JSON.stringify(c.history), result = await analyzer.evaluate(prepared, 'h3')
    expect(result).toMatchObject({ status: 'correct', uci: 'h2h3', san: 'h3' })
    expect(analyzePosition.mock.calls[1]).toEqual([c.fen, ENGINE_CONFIG.nodes, 2,
      { history: c.history, signal: undefined, searchMoves: pair }])
    expect(JSON.stringify(c.history)).toBe(before)
  })

  it('accepts an equivalent covered alternative and rejects an illegal attempt without a search', async () => {
    const c = await candidate(), analyzePosition = vi.fn(async (_fen, _nodes, _multiPv, options) => options.searchMoves
      ? searchResult(c, options.searchMoves, [300, -300], options.searchMoves)
      : searchResult(c, ['f1b5', 'd2d4'], [300, 299]))
    const analyzer = createPracticeAnalyzer({ analyzePosition }), prepared = await analyzer.prepare(c)
    expect(analyzePosition).toHaveBeenCalledTimes(2)
    expect(analyzePosition.mock.calls[1][3].searchMoves).toEqual(['f1b5', c.originalUci])
    expect(await analyzer.evaluate(prepared, 'd4')).toMatchObject({ status: 'correct', uci: 'd2d4' })
    expect(await analyzer.evaluate(prepared, 'Qa8')).toEqual({ status: 'illegal' })
    expect(analyzePosition).toHaveBeenCalledTimes(2)
  })

  it('preserves underpromotion, castling and en passant when validating and executing a chosen move', async () => {
    const examples = [
      { fen: '7k/P7/8/8/8/8/8/7K w - - 0 1', reference: 'a7a8n', original: 'a7a8q',
        input: { from: 'a7', to: 'a8', promotion: 'n' }, san: 'a8=N', square: 'a8', type: 'n' },
      { fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', reference: 'e1g1', original: 'e1c1',
        input: 'O-O', san: 'O-O', square: 'f1', type: 'r' },
      { fen: '7k/8/8/3pP3/8/8/8/7K w - d6 0 2', reference: 'e5d6', original: 'e5e6',
        input: 'exd6', san: 'exd6', square: 'd6', type: 'p' },
    ]
    for (const example of examples) {
      const board = new Chess(example.fen), c = { fen: board.fen(), originalUci: example.original,
        history: { initialFen: board.fen(), moves: [] } }
      const root = searchResult(c, [example.reference, example.original])
      expect(validPracticeSearch(root, c)).toBe(true)
      const analyzer = createPracticeAnalyzer({ analyzePosition: async () => root })
      const prepared = await analyzer.prepare(c), result = await analyzer.evaluate(prepared, example.input)
      expect(result).toMatchObject({ status: 'correct', uci: example.reference, san: example.san })
      const after = new Chess(result.fenAfter)
      expect(after.get(example.square)).toMatchObject({ type: example.type, color: 'w' })
      if (example.reference === 'e5d6') expect(after.get('d5')).toBeUndefined()
    }
  })

  it('returns inconclusive instead of incorrect for uncertain or contradictory evidence', async () => {
    const c = await candidate(), analyzePosition = vi.fn(async (_fen, _nodes, _multiPv, options) => {
      const result = options.searchMoves ? searchResult(c, options.searchMoves, [300, 299], options.searchMoves) : searchResult(c)
      if (options.searchMoves) result.specialLines[1].upperbound = true
      return result
    })
    const analyzer = createPracticeAnalyzer({ analyzePosition }), prepared = await analyzer.prepare(c)
    expect(await analyzer.evaluate(prepared, 'h3')).toMatchObject({ status: 'inconclusive' })
    expect(comparePracticeMoves(searchResult(c, ['f1b5', 'h2h3'], [-300, 300]).specialLines, 'f1b5', 'h2h3')).toEqual({ status: 'inconclusive' })
  })

  it('does not accept losing a forced mate or entering a forced mate despite a small probability difference', () => {
    const lines = [{ pv: ['f1b5'], mate: 3, evalCp: null }, { pv: ['f1c4'], mate: null, evalCp: 2000 }]
    expect(comparePracticeMoves(lines, 'f1b5', 'f1c4')).toMatchObject({ status: 'incorrect', mateLost: true })
    lines[0] = { pv: ['f1b5'], mate: null, evalCp: -2000 }
    lines[1] = { pv: ['f1c4'], mate: -3, evalCp: null }
    expect(comparePracticeMoves(lines, 'f1b5', 'f1c4')).toMatchObject({ status: 'incorrect', newlyMated: true })
  })

  it('ignores aborted late results and never caches them', async () => {
    const c = await candidate(), controller = new AbortController()
    let finish
    const analyzePosition = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
      .mockImplementation(async () => searchResult(c))
    const analyzer = createPracticeAnalyzer({ analyzePosition })
    const pending = analyzer.prepare(c, { signal: controller.signal })
    controller.abort(); finish(searchResult(c))
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(await analyzer.prepare(c)).toMatchObject({ status: 'ready' })
    expect(analyzePosition).toHaveBeenCalledTimes(2)
    await expect(analyzer.prepare(c, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(analyzePosition).toHaveBeenCalledTimes(2)
  })

  it('reuses only exact valid cached searches and separates different histories', async () => {
    const c = await candidate(), analyzePosition = vi.fn(async (fen, _nodes, _multiPv, options) =>
      searchResult({ ...c, fen, history: options.history }))
    const analyzer = createPracticeAnalyzer({ analyzePosition })
    await analyzer.prepare(c); await analyzer.prepare(structuredClone(c))
    expect(analyzePosition).toHaveBeenCalledTimes(1)
    const other = { ...c, history: { initialFen: c.fen, moves: [] } }
    expect(historyKey(other.history)).not.toBe(historyKey(c.history))
    await analyzer.prepare(other)
    expect(analyzePosition).toHaveBeenCalledTimes(2)
    const invalid = vi.fn().mockResolvedValueOnce({}).mockResolvedValue(searchResult(c))
    const retry = createPracticeAnalyzer({ analyzePosition: invalid })
    expect(await retry.prepare(c)).toMatchObject({ status: 'inconclusive' })
    expect(await retry.prepare(c)).toMatchObject({ status: 'ready' })
    expect(invalid).toHaveBeenCalledTimes(2)
  })

  it('bases hints and explanations on legal moves in the actual position', async () => {
    const c = await candidate(), root = searchResult(c)
    root.specialLines[0].pv.push('a7a6', 'b5a4')
    const prepared = await createPracticeAnalyzer({ analyzePosition: async () => root }).prepare(c)
    expect(practiceHint(prepared, 1)).toContain('scacchi')
    expect(practiceHint(prepared, 2)).toContain('f1')
    expect(practiceHint(prepared, 3)).toContain('Bb5')
    const explanation = practiceExplanation(prepared)
    expect(explanation).toContain('Bc4')
    expect(explanation).toContain('Bb5 a6 Ba4')
    const verdict = await createPracticeAnalyzer({ analyzePosition: async () => root }).evaluate(prepared, 'Bb5')
    expect(practiceExplanation(prepared, verdict)).toContain('Bb5 a6 Ba4')
    expect(explanation).toContain('Stockfish')
  })

  it('explains only the move actually displayed in the active continuation without reusing root scores', async () => {
    const c = await candidate(), root = searchResult(c)
    root.specialLines[0].pv.push('a7a6')
    const analyzePosition = vi.fn(async () => root)
    const prepared = await createPracticeAnalyzer({ analyzePosition }).prepare(c)
    const before = structuredClone(prepared), calls = analyzePosition.mock.calls.length
    const board = new Chess(c.fen)
    expect(practiceExplanationEntry(prepared, board.fen())).toBeNull()
    board.move('Bb5')
    const entry = practiceExplanationEntry(prepared, board.fen())
    expect(entry).toMatchObject({ fenBefore: c.fen, fenAfter: board.fen(), playedUci: 'f1b5', playedMove: 'Bb5' })
    expect(entry.engine).toBeUndefined()
    board.move('a6')
    const reply = practiceExplanationEntry(prepared, board.fen())
    expect(reply.playedMove).toBe('a6')
    expect(buildMoveExplanation(reply).punishment).toBe('')
    const stale = new Chess(c.fen); stale.move(c.originalSan)
    expect(practiceExplanationEntry(prepared, stale.fen())).toBeNull()
    const alternative = new Chess(c.fen); alternative.move('a3'); alternative.move('a6')
    expect(practiceExplanationEntry(prepared, alternative.fen(), { status: 'correct', played: { pv: ['a2a3', 'a7a6'] } }).playedMove).toBe('a6')
    expect(practiceExplanationEntry(prepared, alternative.fen())).toBeNull()
    expect(practiceExplanationEntry({ ...prepared, original: { reference: { pv: ['invalid'] } } }, alternative.fen())).toBeNull()
    expect(analyzePosition).toHaveBeenCalledTimes(calls)
    expect(prepared).toEqual(before)
  })
})
