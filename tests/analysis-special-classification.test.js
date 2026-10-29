import { readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import * as core from '../src/lib/specialClassification.js'
import * as analysis from '../src/lib/analysisSpecialClassification.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'
import { collectSacrificeEvidence } from '../src/lib/sacrificeEvidence.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

const fen = 'rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQ1RK1 w - - 0 1'
const line = (multipv, evalCp, pv) => ({ multipv, evalCp, mate: null, depth: 15, pv })
function sequence(initial, sans) {
  const board = new Chess(initial)
  return sans.map(san => { const move = board.move(san); return move.from + move.to + (move.promotion ?? '') })
}
function sample({ best = 0, alternative = -400, child = 0, sacrifice = false } = {}) {
  const sans = sacrifice ? ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5', 'Re8', 'Qxf7+', 'Kh8', 'Qxe8+', 'Nxe8', 'Nf7+', 'Kg8', 'Ng5', 'Nf6']
    : ['e4', 'dxe4', 'Nxe4']
  const pv = sequence(fen, sans), board = new Chess(fen), move = board.move(sans[0])
  const first = line(1, best, pv), second = line(2, alternative, sequence(fen, [sacrifice ? 'e4' : 'a3']))
  const children = [line(1, child, pv.slice(1))]
  if (sacrifice) children.push(line(2, child, sequence(board.fen(), ['Nxh7', 'Kh1', 'Kh8'])))
  return { classification: 'best', playedMove: move.san, playedUci: pv[0], ply: 1, side: 'w', isEngineBest: true,
    fenBefore: fen, fenAfter: board.fen(), bestProbability: calculateWinProbability(best), playedProbability: calculateWinProbability(-child),
    engine: { ...first, lines: [first, second] }, playedEngine: { ...children[0], lines: children } }
}
const archived = JSON.parse(readFileSync(new URL('../agent-output/external-specials-probe-2026-10-09T14-03-37-245Z/results.json', import.meta.url)))
const sacrificeEntries = () => structuredClone(archived.entries.slice(12, 16))
const freeze = input => { if (input && typeof input === 'object' && !Object.isFrozen(input)) { Object.values(input).forEach(freeze); Object.freeze(input) } }

describe('analysis facade for the frozen special classifier', () => {
  it('covers every frozen-core export and keeps read-only formatters and policy unchanged', () => {
    expect(Object.keys(core).every(name => typeof analysis[name] !== 'undefined')).toBe(true)
    for (const name of ['SPECIAL_POLICY', 'displaySpecialMoves', 'formatSpecialAssessment']) expect(analysis[name]).toBe(core[name])
    for (const name of ['classifySpecialMove', 'reclassifySpecialMoves', 'refreshPreviousSacrifice', 'pendingGrandeRecovery', 'pendingNativeAlternatives']) {
      expect(analysis[name]).not.toBe(core[name])
    }
  })

  it.each([{ best: 100, alternative: 50, child: -100 }, {}, { best: 100, alternative: 50, child: -100, sacrifice: true }])
  ('preserves exact-score classification, engine identities and source data for %j', options => {
    const entry = sample(options), original = structuredClone(entry)
    const result = analysis.classifySpecialMove(entry)
    expect(result).toEqual(core.classifySpecialMove(entry))
    expect(result.engine).toBe(entry.engine)
    expect(result.playedEngine).toBe(entry.playedEngine)
    expect(analysis.normalizeAnalysisBounds(entry)).toBe(entry)
    expect(entry).toEqual(original)
  })

  it.each(['lowerbound', 'upperbound'])('rejects boolean %s in root and child scores through the frozen-core boundary', flag => {
    for (const target of ['root', 'child']) {
      const entry = sample(), original = structuredClone(entry)
      const score = target === 'root' ? entry.engine.lines[1] : entry.playedEngine.lines[0]
      score[flag] = true
      const expected = structuredClone(entry)
      ;(target === 'root' ? expected.engine.lines[1] : expected.playedEngine.lines[0]).bound = true
      const result = analysis.classifySpecialMove(entry)
      expect(result).toEqual(core.classifySpecialMove(expected))
      expect(result.classification).toBe('best')
      expect(score.bound).toBeUndefined()
      expect(score[flag]).toBe(true)
      expect(analysis.classifySpecialMove(original).classification).toBe('great')
    }
  })

  it('copies only changed branches, reuses aliases, and preserves contexts, versions and subproofs', () => {
    const bounded = { ...line(1, 0, ['e2e4']), lowerbound: true }, exact = line(1, 0, ['d2d4'])
    const input = { entry: { engine: { lines: [bounded] }, refinement: { version: 'prior-v1', nativeProof: { child: { specialLines: [bounded] } } } },
      previous: { engine: { lines: [exact] } }, previousOwn: { playedEngine: { specialLines: [bounded] } },
      extraEvidence: { acceptanceSearches: [{ line: bounded }], confirmations: [{ line: bounded, index: .5 }] }, untouched: { version: 'source-v1' } }
    const original = structuredClone(input); freeze(input)
    const result = analysis.normalizeAnalysisBounds(input)
    expect(result.previous).toBe(input.previous)
    expect(result.untouched).toBe(input.untouched)
    expect(result.entry.engine.lines[0]).toMatchObject({ lowerbound: true, bound: true })
    expect(result.entry.refinement.version).toBe('prior-v1')
    expect(result.entry.refinement.nativeProof.child.specialLines[0]).toBe(result.entry.engine.lines[0])
    expect(result.previousOwn.playedEngine.specialLines[0]).toBe(result.entry.engine.lines[0])
    expect(result.extraEvidence.acceptanceSearches[0].line).toBe(result.entry.engine.lines[0])
    expect(result.extraEvidence.confirmations[0].index).toBe(.5)
    expect(input).toEqual(original)
  })

  it('normalizes context and supplemental-proof arguments of both selectors without changing exact requests', () => {
    const entry = sample(), previous = sample(), own = sample(), data = { version: 'unknown-proof', root: { lines: [{ lowerbound: true }] } }
    previous.engine.lines[0].upperbound = true
    own.playedEngine.lines[0].lowerbound = true
    const originals = structuredClone([entry, previous, own, data])
    const canonical = structuredClone(originals)
    canonical[1].engine.lines[0].bound = true; canonical[2].playedEngine.lines[0].bound = true; canonical[3].root.lines[0].bound = true
    expect(analysis.pendingGrandeRecovery(entry, previous, own)).toBe(core.pendingGrandeRecovery(...canonical.slice(0, 3)))
    expect(analysis.pendingNativeAlternatives(entry, previous, own, data)).toEqual(core.pendingNativeAlternatives(...canonical))
    expect([entry, previous, own, data]).toEqual(originals)
  })

  it('passes complete exact extra evidence unchanged and normalizes bounded acceptance evidence', () => {
    const [own, previous, entry, next] = sacrificeEntries(), extra = collectSacrificeEvidence(entry, next)
    expect(analysis.classifySpecialMove(entry, previous, own, extra)).toEqual(core.classifySpecialMove(entry, previous, own, extra))
    expect(analysis.normalizeAnalysisBounds(extra)).toBe(extra)
    expect(analysis.classifySpecialMove(entry, previous, own, extra).classification).toBe('brilliant')
    extra.acceptanceLines[2].lowerbound = true
    const expected = structuredClone(extra); expected.acceptanceLines[2].bound = true
    expect(analysis.classifySpecialMove(entry, previous, own, extra)).toEqual(core.classifySpecialMove(entry, previous, own, expected))
    expect(analysis.classifySpecialMove(entry, previous, own, extra).classification).not.toBe('brilliant')
    expect(extra.acceptanceLines[2].bound).toBeUndefined()
  })

  it.each(['bound', 'lowerbound', 'upperbound'])('rejects cached confirmation index with a %s line in extra evidence', flag => {
    const [own, previous, entry, next] = sacrificeEntries(), extra = collectSacrificeEvidence(entry, next)
    expect(analysis.classifySpecialMove(entry, previous, own, extra).classification).toBe('brilliant')
    const cachedIndex = extra.confirmations[0].index
    extra.confirmations[0].line[flag] = true
    const original = structuredClone(extra)
    expect(analysis.classifySpecialMove(entry, previous, own, extra).classification).not.toBe('brilliant')
    expect(extra.confirmations[0].index).toBe(cachedIndex)
    expect(extra).toEqual(original)
  })

  it('preserves batch and incremental-refresh results and resumes from exact evidence without mutation', () => {
    const entries = sacrificeEntries(), original = structuredClone(entries)
    expect(analysis.reclassifySpecialMoves(entries)).toEqual(core.reclassifySpecialMoves(entries))
    const partial = analysis.reclassifySpecialMoves(entries.slice(0, 3))
    expect(partial[2].specialAssessment.brilliant.status).toBe('candidate')
    const resumed = analysis.refreshPreviousSacrifice([...partial, entries[3]])
    expect(resumed).toEqual(core.refreshPreviousSacrifice([...partial, entries[3]]))
    expect(resumed[2].classification).toBe('brilliant')
    expect(entries).toEqual(original)
    const bounded = structuredClone(entries); bounded[3].playedEngine.lines[0].lowerbound = true
    expect(analysis.reclassifySpecialMoves(bounded)[2].classification).not.toBe('brilliant')
    const stopped = analysis.refreshPreviousSacrifice([...partial, bounded[3]])
    expect(stopped[2].classification).not.toBe('brilliant')
    expect(analysis.refreshPreviousSacrifice([...partial, entries[3]])[2].classification).toBe('brilliant')
  })

  it('reconstructs old special labels through analysis without changing the first original decision', () => {
    const entry = analysis.classifySpecialMove(sample())
    const origin = { schemaVersion: 0, classification: 'great', policy: null }
    entry.classificationOrigin = origin; entry.engine.lines[1].upperbound = true
    const original = structuredClone(entry), result = reclassifyReviewedMoves([entry])[0]
    expect(result.classification).toBe('best')
    expect(result.classificationOrigin).toEqual(origin)
    expect(entry).toEqual(original)
    expect(reclassifyReviewedMoves([result])[0]).toEqual(result)
  })

  it('does not reinterpret false flags, malformed scores or non-JSON objects and fails closed on cycles', () => {
    const entry = sample(); entry.engine.lines[1].lowerbound = false
    expect(analysis.normalizeAnalysisBounds(entry)).toBe(entry)
    const malformed = { classification: 'best', fenBefore: 'invalid', engine: { lines: [{ lowerbound: true }] } }
    expect(analysis.classifySpecialMove(malformed).classification).toBe('best')
    expect(analysis.classifySpecialMove(malformed).specialAssessment.grande.status).not.toBe('supported')
    const date = new Date(); expect(() => analysis.normalizeAnalysisBounds(date)).toThrow('non JSON')
    const cyclic = {}; cyclic.self = cyclic
    expect(() => analysis.normalizeAnalysisBounds(cyclic)).toThrow('ciclici')
  })

  it('rejects inherited bound flags rather than letting a custom prototype bypass validation', () => {
    const entry = sample()
    entry.engine.lines[1] = Object.assign(Object.create({ lowerbound: true }), entry.engine.lines[1])
    expect(core.classifySpecialMove(entry).classification).toBe('great')
    expect(() => analysis.classifySpecialMove(entry)).toThrow('non JSON')
  })

  it('routes every runtime special-classification import through the analysis facade', () => {
    const src = fileURLToPath(new URL('../src/', import.meta.url)), facade = resolve(src, 'lib/analysisSpecialClassification.js'), violations = []
    function scan(directory) {
      for (const file of readdirSync(directory, { withFileTypes: true })) {
        const path = resolve(directory, file.name)
        if (file.isDirectory()) scan(path)
        else if (/\.(?:js|jsx)$/.test(file.name) && path !== facade) {
          const text = readFileSync(path, 'utf8')
          if (/\b(?:from\s*|import\s*\(\s*|import\s*)['"][^'"]*specialClassification\.js['"]/.test(text)) violations.push(relative(src, path))
        }
      }
    }
    scan(src)
    expect(violations).toEqual([])
  })
})
