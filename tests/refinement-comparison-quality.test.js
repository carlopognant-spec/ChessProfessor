import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { selectRefinementView } from '../src/lib/analysisRefinement.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

function packet(fen, played, nodes, depth, selected) {
  const legal = new Chess(fen).moves({ verbose: true }).map(m => m.from + m.to)
  const other = legal.find(uci => uci !== played), order = selected ? [played, other] : [other, played]
  order.push(...legal.filter(uci => !order.includes(uci)).slice(0, 3))
  const lines = order.map((uci, i) => ({ multipv: i + 1, depth,
    evalCp: selected ? 500 - i * 100 : 120 - i * 70, mate: null, pv: [uci] }))
  return { ...lines[0], fen, bestmove: order[0], lines: structuredClone(lines), specialLines: lines,
    analysisMetadata: createAnalysisMetadata({ nodes }), actualNodes: nodes }
}
function example() {
  const board = new Chess(), raw = ['e4', 'e5'].map((san, i) => {
    const fenBefore = board.fen(), m = board.move(san)
    return { ply: i + 1, playedMove: san, playedUci: m.from + m.to, fenBefore, fenAfter: board.fen(),
      analysisMetadata: createAnalysisMetadata(), isBookMove: false }
  })
  const initialRoot = packet(raw[1].fenBefore, 'e7e5', 200000, 15, false)
  const deepRoot = packet(raw[1].fenBefore, 'e7e5', 1000000, 5, true)
  const entries = reclassifyReviewedMoves(raw.map((e, i) => ({ ...e,
    engine: i === 1 ? initialRoot : packet(e.fenBefore, 'e2e4', 200000, 15, true),
    playedEngine: i === 0 ? initialRoot : packet(e.fenAfter, 'g1f3', 200000, 15, true) })))
  return { initialRoot, deepRoot, entries: entries.map((e, i) => ({ ...e,
    refinement: { version: 'optional-refinement-v1', selected: true,
      engine: i === 1 ? deepRoot : packet(e.fenBefore, 'e2e4', 1000000, 15, true),
      playedEngine: i === 0 ? deepRoot : packet(e.fenAfter, 'g1f3', 1000000, 15, true) } })) }
}

describe('refinement preserves a deeper completed comparison', () => {
  it('shares the chosen packet across adjacent FENs and preserves both raw profiles', () => {
    const { entries, initialRoot, deepRoot } = example(), original = JSON.stringify(entries)
    const view = selectRefinementView(entries, true)
    expect(view[1].engine).toBe(initialRoot)
    expect(view[0].playedEngine).toBe(view[1].engine)
    expect(view[1].classification).toBe(entries[1].classification)
    expect(view[1].refinementComparison.rootComparisonChoice).toEqual({ source: 'initial-deeper-snapshot', keptDepth: 15, proposedDepth: 5 })
    expect(view[1].refinement.engine).toBe(deepRoot)
    expect(selectRefinementView(entries, false)).toBe(entries)
    expect(JSON.stringify(entries)).toBe(original)
  })

  it.each([
    ['equally deep', e => { for (const line of [...e.deepRoot.lines, ...e.deepRoot.specialLines]) line.depth = 15 }],
    ['deeper', e => { for (const line of [...e.deepRoot.lines, ...e.deepRoot.specialLines]) line.depth = 16 }],
    ['incomplete initial snapshot', e => { e.initialRoot.specialLines.pop() }],
    ['bounded initial snapshot', e => { e.initialRoot.specialLines[0].bound = true; e.initialRoot.lines[0].bound = true }],
  ])('does not override a %s comparison', (_, mutate) => {
    const data = example(); mutate(data)
    const view = selectRefinementView(data.entries, true)
    expect(view[1].engine).toBe(data.deepRoot)
    expect(view[1].refinementComparison.rootComparisonChoice).toBeNull()
  })
})
