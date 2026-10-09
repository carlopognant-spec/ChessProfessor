import { Chess } from 'chess.js'

const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const play = (game, uci) => {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid UCI')
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}
function replay(entry) {
  const game = new Chess(entry.fenBefore), move = play(game, entry.playedUci)
  if (game.fen() !== entry.fenAfter) throw Error('Incoherent move')
  return { game, move }
}

// This describes actual material realization, not its difficulty or quality.
// A geometric attack is never used as proof against unplayed defenses.
export function detectMaterialRealization(entry, previous, previousOwn) {
  try {
    if (!previous || previous.fenAfter !== entry.fenBefore || previous.ply !== entry.ply - 1) return null
    const current = replay(entry), opponent = replay(previous)
    const move = current.move, prior = opponent.move
    if (!move.captured || move.color === prior.color || move.promotion) return null
    if (prior.captured && move.to === prior.to && move.captured === prior.piece
      && !prior.promotion && values[move.captured] >= values[prior.captured]) {
      return { kind: 'immediate-material-recovery', previousPly: previous.ply, target: move.to }
    }
    if (!previousOwn || previousOwn.fenAfter !== previous.fenBefore || previousOwn.ply !== entry.ply - 2) return null
    const earlier = replay(previousOwn), first = earlier.move
    if (first.color !== move.color || first.to !== move.from || first.piece !== move.piece || first.promotion) return null
    // The opponent must have moved the king, leaving the previously attacked
    // target untouched. Actual legal replay verifies the final capture.
    if (prior.piece !== 'k' || !earlier.game.isCheck()) return null
    const target = earlier.game.get(move.to)
    if (target?.color !== prior.color || target.type !== move.captured) return null
    if (!earlier.game.attackers(prior.from, move.color).includes(first.to)
      || !earlier.game.attackers(move.to, move.color).includes(first.to)) return null
    return { kind: 'checking-fork-realization', previousPly: previousOwn.ply,
      initiatingMove: first.san, target: move.to }
  } catch { return null }
}
