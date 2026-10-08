import { useCallback, useMemo, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useGame } from '../context/GameContext.jsx'
import { buildEngineArrowSegments, buildEngineArrows, resolveEngineForFen, resolveMoveReview } from '../lib/analysisPresentation.js'

const LIGHT_SQUARE = '#EDE6D6'
const DARK_SQUARE = '#7C6A53'

function Arrow({ arrow }) {
  const length = Math.hypot(arrow.x2 - arrow.x1, arrow.y2 - arrow.y1)
  const angle = Math.atan2(arrow.y2 - arrow.y1, arrow.x2 - arrow.x1) * 180 / Math.PI
  const neck = length - 4.2
  return <path className="engine-arrow" data-from={arrow.startSquare} data-to={arrow.endSquare}
    transform={`translate(${arrow.x1} ${arrow.y1}) rotate(${angle})`}
    d={`M0,-1.3 L${neck},-1.3 L${neck},-3.3 Q${neck},-3.6 ${neck + 0.4},-3.2 L${length},0 L${neck + 0.4},3.2 Q${neck},3.6 ${neck},3.3 L${neck},1.3 L0,1.3 A1.3,1.3 0 0 1 0,-1.3 Z`}
    fill="#81B64C" fillOpacity="0.88" />
}

export default function Board({ editorPiece = null, displayFen, onEditorSquare, analysisEntries = [], engineData = null }) {
  const { fen, moveHistorySan, navigationHistorySan, applyMove } = useGame()
  const [moveFrom, setMoveFrom] = useState(null)
  const [optionSquares, setOptionSquares] = useState({})
  const [userArrows, setUserArrows] = useState([])

  const boardFen = displayFen ?? fen
  const review = useMemo(() => editorPiece === null
    ? resolveMoveReview(boardFen, moveHistorySan, analysisEntries) : null,
  [boardFen, moveHistorySan, analysisEntries, editorPiece])
  const reviewingGame = navigationHistorySan.length > 0

  const analysisEngine = useMemo(
    () => resolveEngineForFen(boardFen, analysisEntries, engineData),
    [analysisEntries, engineData, boardFen],
  )
  const engineArrows = useMemo(() => {
    if (editorPiece !== null) return []
    if (reviewingGame) return review?.bestMove
      ? buildEngineArrows([{ multipv: 1, pv: [review.bestMove] }]) : []
    const primary = analysisEngine?.lines?.find(line => (line.multipv ?? 1) === 1)
    return buildEngineArrows(primary ? [primary] : [])
  }, [analysisEngine, review, reviewingGame, editorPiece])
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
    <div className="board-stage" data-fen={boardFen}>
      <Chessboard options={chessboardOptions} />
      {engineArrowSegments.length > 0 && (
        <svg className="engine-arrow-overlay" data-fen={reviewingGame ? review.entry.fenBefore : boardFen} viewBox="0 0 100 100" aria-label={reviewingGame ? 'Migliore mossa possibile prima della mossa giocata' : 'Migliore mossa di Stockfish'}>
          {engineArrowSegments.map(arrow => <Arrow key={arrow.markerId} arrow={arrow} />)}
        </svg>
      )}
      {engineArrowSegments.length > 0 && (
        <span className="engine-arrow-status" aria-live="polite">
          {reviewingGame ? 'Migliore alternativa alla mossa giocata' : 'Migliore mossa Stockfish'}
        </span>
      )}
    </div>
  )
}
