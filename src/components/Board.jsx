import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useGame } from '../context/GameContext.jsx'

// Colori scelti in tema con la palette dell'app (legno chiaro/scuro),
// invece dei verdi di default.
const LIGHT_SQUARE = '#EDE6D6'
const DARK_SQUARE = '#7C6A53'

export default function Board() {
  const { fen, applyMove } = useGame()

  function onPieceDrop(sourceSquare, targetSquare) {
    // Verifica di legalità delegata a chess.js dentro applyMove.
    const moved = applyMove({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    return moved
  }

  return (
    <div>
      <Chessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        customLightSquareStyle={{ backgroundColor: LIGHT_SQUARE }}
        customDarkSquareStyle={{ backgroundColor: DARK_SQUARE }}
        customBoardStyle={{ borderRadius: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
      />
    </div>
  )
}

// Esportata per riuso (es. validare una mossa senza toccare lo stato globale)
export function isLegalMoveFromFen(fen, move) {
  try {
    return Boolean(new Chess(fen).move(move))
  } catch {
    return false
  }
}
