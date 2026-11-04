import { Chess } from 'chess.js'
import { normalizeHistory, playUci, uciOf } from './analysisHistory.js'
import { classifyReviewedMove } from './reviewEvaluation.js'

const pieces = { p: 'pedone', n: 'cavallo', b: 'alfiere', r: 'torre', q: 'donna', k: 're' }
const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const colorName = color => color === 'w' ? 'Bianchi' : 'Neri'
const primary = engine => (Array.isArray(engine?.lines) ? engine.lines.find(line => line?.multipv === 1) : null) ?? engine
const exact = line => line && !line.bound && !line.lowerbound && !line.upperbound
  && !/\b(?:lowerbound|upperbound)\b/.test(line.raw ?? '')
  && (Number.isFinite(line.evalCp) || Number.isSafeInteger(line.mate) && line.mate !== 0)
const material = (board, side) => board.board().flat().filter(Boolean)
  .reduce((sum, piece) => sum + (piece.color === side ? 1 : -1) * values[piece.type], 0)

function validateLine(fen, line, source) {
  try {
    if (!exact(line) || !Number.isSafeInteger(line.depth) || line.depth < 1 || line.fen && line.fen !== fen
      || !Array.isArray(line.pv) || !line.pv.length || line.pv.length > 256) return null
    const board = new Chess(fen), side = board.turn(), initialMaterial = material(board, side), events = []
    for (const uci of line.pv) {
      const move = playUci(board, uci)
      events.push({ uci, san: move.san, color: move.color, captured: move.captured ?? null, to: move.to })
    }
    const endsInMate = board.isCheckmate()
    if (line.mate != null && (!Number.isSafeInteger(line.mate) || !line.mate || !endsInMate
      || line.pv.length !== 2 * Math.abs(line.mate) - Number(line.mate > 0)
      || (board.turn() !== side) !== (line.mate > 0))) return null
    return { uci: [...line.pv], san: events.map(event => event.san), events, source, illustrative: true, forced: false,
      endsInMate, winner: endsInMate ? (board.turn() === 'w' ? 'b' : 'w') : null,
      materialDelta: material(board, side) - initialMaterial, evalCp: line.evalCp ?? null, mate: line.mate ?? null }
  } catch { return null }
}

function validOwner(engine, fen) {
  if (!engine || engine.fen && engine.fen !== fen) return false
  try { if (engine.history) normalizeHistory(engine.history, fen); return true } catch { return false }
}

function rootEvidence(entry, legalMoves, limitations) {
  const engine = entry.engine
  if (!validOwner(engine, entry.fenBefore)) {
    limitations.push('Ricerca di riferimento assente o non coerente con la posizione.'); return { lines: [], coherent: false }
  }
  if (engine.specialLines !== undefined) {
    const raw = engine.specialLines, requested = engine.analysisMetadata?.multiPv
    const expected = Math.min(requested, engine.analysisMetadata?.searchMoves?.length ?? legalMoves)
    const lines = Array.isArray(raw) ? raw.map(line => validateLine(entry.fenBefore, line, 'completed-root')) : []
    if (!Number.isSafeInteger(requested) || requested < 1 || !lines.length || lines.length !== expected
      || lines.some((line, index) => !line || raw[index].multipv !== index + 1 || raw[index].depth !== raw[0].depth)
      || new Set(lines.map(line => line?.uci[0])).size !== lines.length
      || (engine.bestmove ?? entry.bestUci ?? raw[0]?.pv?.[0]) !== lines[0]?.uci[0]
      || engine.analysisMetadata?.searchMoves && lines.some(line => !engine.analysisMetadata.searchMoves.includes(line.uci[0]))) {
      limitations.push('Snapshot incompleto, limitato, incoerente o con una variante non verificabile.'); return { lines: [], coherent: false }
    }
    if (!engine.fen) limitations.push('La ricerca non registra la FEN di origine; la verifica della variante è solo legale.')
    return { lines, coherent: !!engine.fen }
  }
  limitations.push('Analisi legacy senza snapshot completo: le varianti non dimostrano un’alternativa migliore.')
  const raw = engine.lines ?? (engine.pv ? [engine] : [])
  const lines = Array.isArray(raw) ? raw.map(line => validateLine(entry.fenBefore, line, 'legacy-root')).filter(Boolean) : []
  return { lines, coherent: false }
}

export function buildMoveExplanation(entry = {}) {
  const limitations = [], result = { why: '', opportunity: '', punishment: '', alternative: '', limitations,
    status: 'limited', lines: { alternative: null, punishment: null }, facts: { played: null, material: null } }
  let before, after, move, playedUci
  try {
    before = new Chess(entry.fenBefore); after = new Chess(entry.fenBefore)
    if (typeof entry.fenBefore !== 'string' || typeof entry.fenAfter !== 'string') throw Error('Missing FEN')
    move = entry.playedUci || entry.uci ? playUci(after, entry.playedUci ?? entry.uci) : after.move(entry.playedMove ?? entry.san)
    playedUci = uciOf(move)
    if (after.fen() !== entry.fenAfter || entry.playedUci != null && entry.playedUci !== playedUci
      || entry.uci != null && entry.uci !== playedUci) throw Error('Position mismatch')
    if (entry.playedMove || entry.san) {
      const named = new Chess(entry.fenBefore).move(entry.playedMove ?? entry.san)
      if (uciOf(named) !== playedUci) throw Error('Move mismatch')
    }
  } catch {
    result.status = 'invalid'
    limitations.push('FEN iniziale, mossa e FEN finale devono descrivere la stessa continuazione legale.'); return result
  }
  const side = before.turn(), initialMaterial = material(before, side), recaptures = after.moves({ verbose: true })
    .filter(reply => reply.to === move.to && reply.captured === (move.promotion ?? move.piece))
  result.facts.played = { uci: playedUci, san: move.san, fenAfter: after.fen(), color: side,
    captured: move.captured ?? null, promotion: move.promotion ?? null, recaptures: recaptures.map(reply => ({ uci: uciOf(reply), san: reply.san })) }
  result.facts.material = { afterPlayedDelta: material(after, side) - initialMaterial, playedLineDelta: null, alternativeLineDelta: null }
  const roots = rootEvidence(entry, before.moves().length, limitations)
  const reference = roots.lines[0], played = roots.lines.find(line => line.uci[0] === playedUci)
  let continuation = roots.coherent && played && (played.uci.length >= 2 || played.endsInMate) ? played : null
  if (!continuation && entry.playedEngine?.fen === entry.fenAfter && validOwner(entry.playedEngine, entry.fenAfter)) {
    const child = validateLine(entry.fenAfter, primary(entry.playedEngine), 'played-child')
    if (child) continuation = { ...child, uci: [playedUci, ...child.uci], san: [move.san, ...child.san],
      events: [{ uci: playedUci, san: move.san, color: side, captured: move.captured ?? null, to: move.to }, ...child.events],
      materialDelta: material(after, side) - initialMaterial - child.materialDelta }
  }
  let reviewed = {}
  if (roots.coherent) {
    try { reviewed = classifyReviewedMove(entry) }
    catch { limitations.push('Il confronto numerico registrato non è ricostruibile dai dati disponibili.') }
  }
  const better = roots.coherent && reference && played && reference.uci[0] !== playedUci
    && reviewed.evaluationEvidence?.status === 'coherent' && reviewed.evaluationEvidence.source === 'completed-snapshot'
    && ['inaccuracy', 'mistake', 'blunder', 'missed'].includes(reviewed.numericalClassification)
    && Number.isFinite(reviewed.bestProbability) && Number.isFinite(reviewed.playedProbability)
    && reviewed.bestProbability > reviewed.playedProbability
  if (better) {
    result.lines.alternative = reference; result.facts.material.alternativeLineDelta = reference.materialDelta
    result.alternative = `Il confronto del motore preferisce ${reference.san[0]} a ${move.san}.`
    if (reference.endsInMate && reference.winner === side) {
      result.opportunity = `Nella variante con ${reference.san[0]}, ${reference.san.at(-1)} dà matto.`
    }
  }
  if (continuation) {
    result.lines.punishment = continuation; result.facts.material.playedLineDelta = continuation.materialDelta
    const reply = continuation.events[1]
    if (continuation.endsInMate && continuation.winner !== side) {
      result.punishment = `Nella variante dopo ${move.san}, ${continuation.san.at(-1)} dà matto a favore dei ${colorName(continuation.winner)}.`
    } else if (reply?.captured) {
      result.punishment = `Nella variante, l’avversario risponde ${reply.san} e cattura ${['r', 'q'].includes(reply.captured) ? 'una' : 'un'} ${pieces[reply.captured]}.`
    }
  }
  if (after.isCheckmate()) result.why = `${move.san} dà scacco matto.`
  else if (before.moves().length === 1) result.why = `${move.san} è l’unica mossa disponibile.`
  else if (move.captured) {
    result.why = `${move.san} cattura ${['r', 'q'].includes(move.captured) ? 'una' : 'un'} ${pieces[move.captured]}${move.flags.includes('e') ? ' en passant' : ` in ${move.to}`}.`
    if (recaptures.length) result.why += ` Può seguire la ripresa ${recaptures[0].san}.`
  }
  else {
    const homeRank = side === 'w' ? '1' : '8', bishopRank = side === 'w' ? '2' : '7', pawnRank = side === 'w' ? '3' : '6'
    const central = ['d4', 'e4', 'd5', 'e5'].filter(square => after.attackers(square, side).includes(move.to)
      && !before.attackers(square, side).includes(move.from))
    const pawn = after.get(move.to[0] + pawnRank)
    if (move.piece === 'b' && ['b', 'g'].includes(move.to[0]) && move.to[1] === bishopRank
      && pawn?.type === 'p' && pawn.color === side) {
      result.why = `${move.san} colloca l’alfiere in fianchetto, dietro il pedone ${move.to[0] + pawnRank}.`
    } else if (['n', 'b'].includes(move.piece) && move.from[1] === homeRank && move.to[1] !== homeRank && central.length) {
      result.why = `${move.san} porta ${move.piece === 'b' ? 'l’alfiere' : 'il cavallo'} in ${move.to}, da dove controlla ${central.join(' e ')}.`
    } else if (move.piece === 'p' && ['d4', 'e4', 'd5', 'e5'].includes(move.to) && central.length) {
      result.why = `${move.san} occupa il centro e controlla ${central.join(' e ')}.`
    }
  }
  if (move.promotion) result.why += `${result.why ? ' ' : ''}${move.san} promuove il pedone a ${pieces[move.promotion]}.`
  if (result.why || result.opportunity || result.punishment || result.alternative) result.status = 'explained'
  if (reference || continuation) limitations.push('Le varianti sono illustrative: una PV legale non dimostra risposte obbligate né verifica tutte le difese.')
  if (reference?.materialDelta || continuation?.materialDelta || move.captured) limitations.push('Il saldo materiale usa pedone 1, cavallo e alfiere 3, torre 5, donna 9; non misura da solo il vantaggio complessivo.')
  if (!roots.coherent) limitations.push('Manca un confronto completo e verificato fra le mosse nella stessa ricerca.')
  return result
}
