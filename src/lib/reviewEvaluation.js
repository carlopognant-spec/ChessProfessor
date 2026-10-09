import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from './classification.js'

export const REVIEW_POLICY_VERSION = 'review-reliability-v1'
const uciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/
const primary = engine => engine?.lines?.find(line => line.multipv === 1) ?? engine
const exactScore = line => line && !line.bound && !line.lowerbound && !line.upperbound
  && !/\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')
  && (Number.isFinite(line.mate) || Number.isFinite(line.evalCp))
const sameDepth = (a, b) => a?.depth === b?.depth
const scoreOrder = line => Number.isFinite(line.mate)
  ? line.mate > 0 ? 1e9 - line.mate : -1e9 - line.mate : line.evalCp
function play(game, uci) {
  if (!uciPattern.test(uci ?? '')) throw Error('Invalid UCI')
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}
function legalLine(fen, line) {
  if (!exactScore(line) || !line.pv?.length) return false
  try {
    const game = new Chess(fen)
    for (const uci of line.pv) play(game, uci)
    return true
  } catch { return false }
}
function snapshot(entry, legalCount) {
  const lines = entry.engine?.specialLines, latest = primary(entry.engine)
  if (!lines?.length || lines[0].pv?.[0] !== (entry.engine.bestmove ?? latest?.pv?.[0])) return null
  const requested = entry.engine.analysisMetadata?.multiPv
  if (!Number.isInteger(requested) || requested < 1
    || lines.length !== Math.min(requested, legalCount)) return null
  if (lines.some((line, i) => line.multipv !== i + 1 || !Number.isInteger(line.depth) || line.depth < 1
    || !sameDepth(line, lines[0]) || !legalLine(entry.fenBefore, line)
    || i > 0 && scoreOrder(line) > scoreOrder(lines[i - 1]))) return null
  return new Set(lines.map(line => line.pv[0])).size === lines.length ? lines : null
}

// A snapshot is a pairwise comparison at one completed iteration. Independent
// searches remain useful estimates but are explicitly marked as provisional.
export function classifyReviewedMove(input) {
  if (!input.engine || !input.playedEngine) return input
  let game, move, legalCount
  try {
    game = new Chess(input.fenBefore)
    legalCount = game.moves().length
    move = input.playedUci || input.uci ? play(game, input.playedUci ?? input.uci)
      : game.move(input.playedMove ?? input.san)
    if (game.fen() !== input.fenAfter) return input
  } catch { return input }
  const playedUci = `${move.from}${move.to}${move.promotion ?? ''}`
  const entry = { ...input, playedUci }
  const completed = snapshot(entry, legalCount)
  const latest = primary(entry.engine)
  const roots = completed ?? entry.engine.lines ?? (latest?.pv ? [latest] : [])
  const best = completed?.[0] ?? latest
  const candidates = roots.filter(line => line.pv?.[0] === playedUci && sameDepth(line, best))
  const ambiguous = roots.filter(line => line.pv?.[0] === best?.pv?.[0] && sameDepth(line, best)).length !== 1
  const validRoot = !ambiguous && candidates.length === 1 && legalLine(entry.fenBefore, best)
    && legalLine(entry.fenBefore, candidates[0])
    && scoreOrder(candidates[0]) <= scoreOrder(best)
  const sameSearch = validRoot && !game.isCheckmate()
  const rootPositionMatches = !entry.engine.fen || entry.engine.fen === entry.fenBefore
  const childPositionMatches = !entry.playedEngine.fen || entry.playedEngine.fen === entry.fenAfter
  const safeBest = rootPositionMatches && exactScore(best)
    && (!best.pv?.length || legalLine(entry.fenBefore, best)) ? best : { evalCp: null, mate: null }
  const child = primary(entry.playedEngine)
  const safeChild = childPositionMatches && exactScore(child)
    && (game.isCheckmate() || !child.pv?.length || legalLine(entry.fenAfter, child))
    ? child : { evalCp: null, mate: null }
  const fields = moveEvaluationFields({ ...safeBest, lines: sameSearch && rootPositionMatches ? roots : [] },
    safeChild, playedUci, { isCheckmate: game.isCheckmate() })
  const numerical = classifyAnalysisEntries([{ ...entry, ...fields, isBookMove: false }])[0]
  const source = fields.evaluationSource
  const rawDrop = numerical.bestProbability == null || numerical.playedProbability == null
    ? null : 100 * (numerical.bestProbability - numerical.playedProbability)
  const status = game.isCheckmate() ? 'terminal' : rawDrop == null ? 'unavailable'
    : source === 'root-pv' ? 'coherent' : rawDrop < 0 ? 'conflicting' : 'independent'
  const classification = input.isBookMove && !game.isCheckmate() ? 'book' : numerical.classification
  return { ...numerical, isBookMove: Boolean(input.isBookMove) && !game.isCheckmate(),
    comparisonPv: safeBest.pv ?? [],
    classification, baseClassification: classification, numericalClassification: numerical.classification,
    moveFacts: { forced: legalCount === 1, legalMoves: legalCount, book: Boolean(input.isBookMove) && !game.isCheckmate() },
    evaluationEvidence: { version: REVIEW_POLICY_VERSION, status,
      source: source === 'root-pv' ? completed ? 'completed-snapshot' : 'legacy-root-pair' : source,
      rootDepth: safeBest.depth ?? null, playedDepth: source === 'root-pv' ? candidates[0]?.depth ?? null : safeChild.depth ?? null,
      unclampedDropPct: rawDrop,
      snapshotAvailable: Boolean(entry.engine.specialLines?.length), snapshotUsed: Boolean(completed && source === 'root-pv') } }
}

export function applyMoveFacts(entry) {
  return entry.moveFacts?.forced ? { ...entry, classification: 'forced' } : entry
}

export function formatEvaluationEvidence(entry) {
  const status = entry.evaluationEvidence?.status
  if (status === 'conflicting') return 'Valutazioni discordanti: classificazione provvisoria.'
  if (status === 'independent') return 'Classificazione indicativa: confronto tra analisi separate.'
  if (status === 'unavailable') return 'Dati insufficienti per valutare la qualità della mossa.'
  return ''
}
