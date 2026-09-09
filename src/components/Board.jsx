import { useCallback, useMemo, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useGame } from '../context/GameContext.jsx'

const LIGHT_SQUARE = '#EDE6D6'
const DARK_SQUARE = '#7C6A53'

export default function Board() {
  const { fen, applyMove } = useGame()
  const [moveFrom, setMoveFrom] = useState(null)
  const [optionSquares, setOptionSquares] = useState({})
  const [arrows, setArrows] = useState([])

  const game = useMemo(() => new Chess(fen), [fen])

  const getMoveOptions = useCallback((square) => {
    const moves = game.moves({ square, verbose: true })
    if (moves.length === 0) {
      setOptionSquares({})
      return false
    }
    const newSquares = {}
    moves.forEach((move) => {
      const dest = game.get(move.to)
      const origin = game.get(square)
      newSquares[move.to] = {
        background:
          dest && origin && dest.color !== origin.color
            ? 'radial-gradient(circle, rgba(0,0,0,.35) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.2) 25%, transparent 25%)',
        borderRadius: '50%',
      }
    })
    newSquares[square] = { background: 'rgba(255,255,0,0.4)' }
    setOptionSquares(newSquares)
    return true
  }, [game])

  const clearSelection = useCallback(() => {
    setMoveFrom(null)
    setOptionSquares({})
  }, [])

  const onSquareClick = useCallback(({ square }) => {
    if (!moveFrom) {
      const hasMoves = getMoveOptions(square)
      if (hasMoves) setMoveFrom(square)
      return
    }

    const result = applyMove({ from: moveFrom, to: square, promotion: 'q' })

    if (!result) {
      const hasMoves = getMoveOptions(square)
      setMoveFrom(hasMoves ? square : null)
      return
    }

    clearSelection()
  }, [moveFrom, getMoveOptions, applyMove, clearSelection])

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (!targetSquare) return false
    const result = applyMove({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    if (result) clearSelection()
    return !!result
  }, [applyMove, clearSelection])

  const onArrowsChange = useCallback(({ arrows: nextArrows }) => {
    setArrows(nextArrows)
  }, [])

  const chessboardOptions = {
    position: fen,
    onPieceDrop,
    onSquareClick,
    squareStyles: optionSquares,
    arrows,
    onArrowsChange,
    allowDrawingArrows: true,
    boardOrientation: 'white',
    id: 'study-board',
    lightSquareStyle: { backgroundColor: LIGHT_SQUARE },
    darkSquareStyle: { backgroundColor: DARK_SQUARE },
    boardStyle: { borderRadius: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' },
  }

  return (
    <div>
      <Chessboard options={chessboardOptions} />
    </div>
  )
}

export function isLegalMoveFromFen(fen, move) {
  try {
    return Boolean(new Chess(fen).move(move))
  } catch {
    return false
  }
}
