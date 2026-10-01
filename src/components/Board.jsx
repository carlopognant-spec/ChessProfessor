import { useCallback, useMemo, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useGame } from '../context/GameContext.jsx'
import { buildEngineArrowSegments, buildEngineArrows, resolveEngineForFen } from '../lib/analysisPresentation.js'

const LIGHT_SQUARE = '#EDE6D6'
const DARK_SQUARE = '#7C6A53'

export default function Board({ editorPiece = null, displayFen, onEditorSquare, analysisEntries = [], engineData = null }) {
  const { fen, applyMove } = useGame()
  const [moveFrom, setMoveFrom] = useState(null)
  const [optionSquares, setOptionSquares] = useState({})
  const [userArrows, setUserArrows] = useState([])

  const boardFen = displayFen ?? fen

  const analysisEngine = useMemo(
    () => resolveEngineForFen(boardFen, analysisEntries) ?? engineData,
    [analysisEntries, engineData, boardFen],
  )
  const engineArrows = useMemo(() => buildEngineArrows(analysisEngine?.lines ?? []), [analysisEngine])
  const engineArrowSegments = useMemo(() => buildEngineArrowSegments(engineArrows), [engineArrows])

  const game = useMemo(() => {
    try {
      return new Chess(fen)
    } catch {
      return new Chess()
    }
  }, [fen])

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
    if (editorPiece !== null) {
      onEditorSquare?.(square, editorPiece || null)
      return
    }
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
  }, [editorPiece, onEditorSquare, moveFrom, getMoveOptions, applyMove, clearSelection])

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
    if (!targetSquare) return false
    if (editorPiece !== null) {
      onEditorSquare?.(targetSquare, editorPiece || null)
      return true
    }
    const result = applyMove({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    if (result) clearSelection()
    return !!result
  }, [editorPiece, onEditorSquare, applyMove, clearSelection])

  const onArrowsChange = useCallback(({ arrows: nextArrows }) => {
    setUserArrows(nextArrows)
  }, [])

  const chessboardOptions = {
    position: boardFen,
    onPieceDrop,
    onSquareClick,
    squareStyles: optionSquares,
    arrows: userArrows,
    onArrowsChange,
    allowDrawingArrows: true,
    clearArrowsOnPositionChange: false,
    boardOrientation: 'white',
    id: 'study-board',
    lightSquareStyle: { backgroundColor: LIGHT_SQUARE },
    darkSquareStyle: { backgroundColor: DARK_SQUARE },
    boardStyle: { borderRadius: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' },
  }

  return (
    <div className="board-stage">
      <Chessboard options={chessboardOptions} />
      {engineArrowSegments.length > 0 && (
        <svg className="engine-arrow-overlay" viewBox="0 0 100 100" aria-label="Linee migliori di Stockfish">
          <defs>
            {engineArrowSegments.map((arrow) => (
              <marker
                key={arrow.markerId}
                id={arrow.markerId}
                markerWidth="4"
                markerHeight="4"
                refX="3.2"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L4,2 L0,4 Z" fill={arrow.color} />
              </marker>
            ))}
          </defs>
          {engineArrowSegments.map((arrow) => (
            <line
              key={`${arrow.startSquare}-${arrow.endSquare}`}
              x1={arrow.x1}
              y1={arrow.y1}
              x2={arrow.x2}
              y2={arrow.y2}
              stroke={arrow.color}
              markerEnd={`url(#${arrow.markerId})`}
            />
          ))}
        </svg>
      )}
      {engineArrowSegments.length > 0 && (
        <span className="engine-arrow-status" aria-live="polite">
          {engineArrowSegments.length} frecce Stockfish
        </span>
      )}
    </div>
  )
}
