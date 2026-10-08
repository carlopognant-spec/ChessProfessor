import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifyMissedOpportunity } from '../src/lib/missedOpportunity.js'
import { classifySimpleSpecial } from './stockfish-specials-simple.js'

const labels = { book: 'Libro', brilliant: 'Geniale', great: 'Grande', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', missed: 'Mossa mancata', unclassified: 'Non valutabile' }

export function validateFrozenModel(model) {
  if (model?.schemaVersion !== 1 || model.version !== 'grande-prudent-candidate-v1' || model.category !== 'great') throw Error('Unsupported frozen model')
  const e = model.eligibility
  if (e?.commonClassification !== 'best' || e.playedIsPv1 !== true || e.isBookMove !== false || e.deliveredMate !== false
    || e.minimumLegalMoves !== 2 || e.preserveBrilliantV1 !== true) throw Error('Unsupported eligibility contract')
  if (model.model?.rules?.length !== 1) throw Error('Unsupported frozen rule count')
  const predicates = model.model.rules[0].predicates
  if (!Array.isArray(predicates) || predicates.length !== 2
    || !predicates.some(p => p.name === 'afterError' && p.value === true)
    || !predicates.some(p => p.name === 'capture' && p.value === false)) throw Error('Frozen rule changed')
}

export function applyFrozenGrande(entry, previousRawNumerical, model) {
  validateFrozenModel(model)
  const finish = (reason, status = 'rejected') => ({ ...entry, frozenVersion: model.version, frozenReason: reason, frozenStatus: status })
  if (entry.classification === 'unclassified') return finish('missing-current-score', 'insufficient')
  if (entry.classification === 'brilliant') return finish('preserve-brilliant', 'protected')
  if (entry.classification !== 'best' || entry.isBookMove) return finish('protected-or-not-best', 'protected')
  if (entry.isEngineBest == null) return finish('missing-primary-move', 'insufficient')
  if (!entry.isEngineBest) return finish('not-root-best')
  let move, before, after
  try {
    before = new Chess(entry.fenBefore); after = new Chess(entry.fenBefore)
    const uci = entry.playedUci
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid UCI')
    move = after.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    if (after.fen() !== entry.fenAfter) throw Error('Invalid chain')
  } catch { return finish('invalid-position-or-move', 'insufficient') }
  if (after.isCheckmate() || before.moves().length < 2) return finish('terminal-or-forced', 'protected')
  if (previousRawNumerical) {
    try {
      const prior = new Chess(previousRawNumerical.fenBefore), uci = previousRawNumerical.playedUci
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid preceding UCI')
      const priorMove = prior.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      if (previousRawNumerical.fenAfter !== entry.fenBefore || prior.fen() !== entry.fenBefore || priorMove.color === move.color) throw Error('Nonadjacent history')
    } catch { return finish('invalid-previous-context', 'insufficient') }
    if (!['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'].includes(previousRawNumerical.classification)) return finish('missing-previous-score', 'insufficient')
  }
  const features = { afterError: ['mistake', 'blunder'].includes(previousRawNumerical?.classification), capture: Boolean(move.captured) }
  const matches = model.model.rules.some(rule => rule.predicates.every(p => features[p.name] === p.value))
  return { ...finish(matches ? 'frozen-rule-match' : 'frozen-rule-no-match', matches ? 'candidate' : 'rejected'),
    classification: matches ? 'great' : entry.classification, frozenFeatures: features }
}

export function evaluateFrozenGame(fixture, cache, model, book) {
  validateFrozenModel(model)
  if (!fixture?.pgn || fixture.pgn !== cache?.pgn || !Array.isArray(cache.entries)) throw Error('Fixture/cache PGN mismatch')
  if (cache.packageVersion !== '19.0.0' || cache.searchLimit?.kind !== 'nodes' || cache.searchLimit.value !== 200000
    || cache.multiPv !== 5 || cache.threads !== 1 || cache.hashMb !== 16
    || cache.scorePerspective !== 'side-to-move at each FEN') throw Error('Unsupported engine cache configuration')
  const full = new Chess(); full.loadPgn(fixture.pgn)
  const moves = full.history(), game = new Chess(full.getHeaders().FEN)
  if (cache.entries.length !== moves.length) throw Error('Incomplete cache')
  const annotations = new Map()
  for (const a of fixture.annotations ?? []) {
    if (!Number.isInteger(a.ply) || a.ply < 1 || a.ply > moves.length || annotations.has(a.ply)
      || a.san !== moves[a.ply - 1] || ![...Object.values(labels), 'Forzata'].includes(a.category)) throw Error('Invalid reference annotation')
    annotations.set(a.ply, a)
  }
  let previous = null, previousRaw = null, bookActive = true
  const rows = []
  for (const [index, e] of cache.entries.entries()) {
    if (e.ply !== index + 1 || e.fenBefore !== game.fen() || e.san !== moves[index]) throw Error('Invalid cache chain')
    const move = game.move(e.san), playedUci = `${move.from}${move.to}${move.promotion ?? ''}`
    if (e.fenAfter !== game.fen() || playedUci !== e.uci) throw Error('Invalid cached move')
    const deliveredMate = game.isCheckmate(), isBookMove = bookActive && !deliveredMate && book.hasPosition(e.fenAfter)
    if (!isBookMove) bookActive = false
    const fields = moveEvaluationFields(e.engine ?? {}, e.playedEngine ?? {}, playedUci, { isCheckmate: deliveredMate })
    const numerical = classifyAnalysisEntries([{ ...e, ...fields, isBookMove }])[0]
    const rawNumerical = classifyAnalysisEntries([{ ...e, ...fields, isBookMove: false }])[0]
    const common = classifyMissedOpportunity(numerical, previous)
    const simple = classifySimpleSpecial(common, previous)
    const protectedEntry = simple.classification === 'brilliant' ? simple : common
    const result = applyFrozenGrande(protectedEntry, previousRaw, model)
    // References never enter the detector; absent labels remain absent.
    const reference = annotations.get(e.ply)
    rows.push({ gameId: fixture.id ?? null, ply: e.ply, san: e.san, expected: reference?.category ?? null,
      predicted: labels[result.classification], base: labels[common.classification], status: result.frozenStatus,
      reason: result.frozenReason, features: result.frozenFeatures ?? null, deliveredMate,
      excluded: reference?.category === 'Forzata' || deliveredMate })
    previous = numerical; previousRaw = rawNumerical
  }
  return rows
}

export function frozenMetrics(rows) {
  const included = rows.filter(r => !r.excluded), labelled = included.filter(r => r.expected != null)
  const assigned = labelled.filter(r => r.predicted === 'Grande'), expected = labelled.filter(r => r.expected === 'Grande')
  const tp = assigned.filter(r => r.expected === 'Grande').length
  return { plies: rows.length, included: included.length, labelled: labelled.length, unlabelled: included.length - labelled.length,
    expectedGrande: expected.length, scoredAssignments: assigned.length, tp, fp: assigned.length - tp, fn: expected.length - tp,
    precision: assigned.length ? tp / assigned.length : null, recall: expected.length ? tp / expected.length : null,
    unlabelledGrande: included.filter(r => r.expected == null && r.predicted === 'Grande').length,
    insufficient: included.filter(r => r.status === 'insufficient').length }
}
