import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useGame } from '../context/GameContext.jsx'
import MoveClassificationBadge from './MoveClassificationBadge.jsx'
import { getReviewedMove, getReviewSquareStyles } from '../lib/moveReviewPresentation.js'
import { buildEngineArrowSegments, buildEngineArrows, resolveEngineForFen, resolveMoveReview } from '../lib/analysisPresentation.js'

const LIGHT_SQUARE = '#EDE6D6'
const DARK_SQUARE = '#7C6A53'

function Arrow({ arrow }) {
  if (arrow.bend) {
    const dx = Math.sign(arrow.x2 - arrow.bend.x), dy = Math.sign(arrow.y2 - arrow.bend.y)
    const nx = arrow.x2 - dx * 4.2, ny = arrow.y2 - dy * 4.2
    return <g className="engine-arrow" data-from={arrow.startSquare} data-to={arrow.endSquare} data-kind="knight" opacity="0.88" fill="#81B64C">
      <path data-arrow-shaft="knight" d={`M${arrow.x1},${arrow.y1} L${arrow.bend.x},${arrow.bend.y} L${nx},${ny}`}
        fill="none" stroke="#81B64C" strokeWidth="2.6" strokeLinejoin="miter" strokeLinecap="round" />
      <path d={`M${arrow.x2},${arrow.y2} L${nx - dy * 3.3},${ny + dx * 3.3} L${nx + dy * 3.3},${ny - dx * 3.3} Z`} />
    </g>
  }
  const length = Math.hypot(arrow.x2 - arrow.x1, arrow.y2 - arrow.y1)
  const angle = Math.atan2(arrow.y2 - arrow.y1, arrow.x2 - arrow.x1) * 180 / Math.PI
  const neck = length - 4.2
  return <path className="engine-arrow" data-from={arrow.startSquare} data-to={arrow.endSquare}
    transform={`translate(${arrow.x1} ${arrow.y1}) rotate(${angle})`}
    d={`M0,-1.3 L${neck},-1.3 L${neck},-3.3 Q${neck},-3.6 ${neck + 0.4},-3.2 L${length},0 L${neck + 0.4},3.2 Q${neck},3.6 ${neck},3.3 L${neck},1.3 L0,1.3 A1.3,1.3 0 0 1 0,-1.3 Z`}
    fill="#81B64C" fillOpacity="0.88" />
}

export default function Board({ id = 'study-board', editorPiece = null, displayFen, onEditorSquare, analysisEntries = [], engineData = null, evaluationSlot = null }) {
  const { fen, moveHistorySan, navigationHistorySan, applyMove, boardOrientation, rapidNavigation, isExploring } = useGame()
  const [moveFrom, setMoveFrom] = useState(null)
  const [optionSquares, setOptionSquares] = useState({})
  const [userArrows, setUserArrows] = useState([])
  const [promotion, setPromotion] = useState(null)
  const promotionDialog = useRef(null)
  const boardStage = useRef(null)

  const boardFen = displayFen ?? fen
  useEffect(() => {
    boardStage.current?.removeAttribute('data-dragging')
    setUserArrows(arrows => arrows.length ? [] : arrows)
    setMoveFrom(null)
    setOptionSquares(squares => Object.keys(squares).length ? {} : squares)
    setPromotion(null)
  }, [boardFen, moveHistorySan, navigationHistorySan, editorPiece])
  useEffect(() => {
    const dialog = promotionDialog.current
    if (promotion) dialog.showModal()
    else if (dialog.open) dialog.close()
  }, [promotion])
  const review = useMemo(() => {
    if (rapidNavigation || isExploring || editorPiece !== null || boardFen !== fen) return null
    const entry = analysisEntries.find(candidate => candidate.ply === moveHistorySan.length && candidate.fenAfter === boardFen)
    const presented = entry && !entry.moveHistorySan
      ? { ...entry, moveHistorySan: moveHistorySan.slice(0, -1) } : entry
    return resolveMoveReview(boardFen, moveHistorySan, presented ? [presented] : [])
  }, [boardFen, fen, moveHistorySan, analysisEntries, editorPiece, isExploring, rapidNavigation])
  const reviewingGame = navigationHistorySan.length > 0
  const reviewedMove = useMemo(() => getReviewedMove(review?.entry), [review?.entry])
  const reviewSquareStyles = useMemo(() => getReviewSquareStyles(review?.entry, reviewedMove), [review?.entry, reviewedMove])
  const squareStyles = useMemo(() => ({ ...reviewSquareStyles, ...optionSquares }), [reviewSquareStyles, optionSquares])

  const analysisEngine = useMemo(
    () => resolveEngineForFen(boardFen, analysisEntries, engineData),
    [analysisEntries, engineData, boardFen],
  )
  const engineArrows = useMemo(() => {
    if (rapidNavigation || isExploring || editorPiece !== null) return []
    if (reviewingGame && review?.entry.isBookMove && !['mistake', 'blunder'].includes(review.entry.classification)) return []
    const primary = analysisEngine?.lines?.find(line => (line.multipv ?? 1) === 1)
    return buildEngineArrows(primary ? [primary] : [])
  }, [analysisEngine, review, reviewingGame, editorPiece, isExploring, rapidNavigation])
  const arrowFen = boardFen
  const engineArrowSegments = useMemo(() => buildEngineArrowSegments(engineArrows, arrowFen, boardOrientation), [engineArrows, arrowFen, boardOrientation])

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

  const requestPromotion = useCallback((from, to) => {
    const choices = game.moves({ square: from, verbose: true })
      .filter(move => move.to === to && move.promotion).map(move => move.promotion)
    if (!choices.length) return false
    clearSelection()
    setPromotion({ from, to, choices, fen, history: moveHistorySan })
    return true
  }, [game, clearSelection, fen, moveHistorySan])

  const onSquareClick = useCallback(({ square }) => {
    if (promotion) return
    if (editorPiece !== null) {
      onEditorSquare?.(square, editorPiece || null)
      return
    }
    if (!moveFrom) {
      const hasMoves = getMoveOptions(square)
      if (hasMoves) setMoveFrom(square)
      return
    }

    if (requestPromotion(moveFrom, square)) return
    const result = applyMove({ from: moveFrom, to: square })

    if (!result) {
      const hasMoves = getMoveOptions(square)
      setMoveFrom(hasMoves ? square : null)
      return
    }

    clearSelection()
  }, [editorPiece, onEditorSquare, moveFrom, getMoveOptions, applyMove, clearSelection, promotion, requestPromotion])

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
    boardStage.current?.removeAttribute('data-dragging')
    if (!targetSquare || promotion) return false
    if (editorPiece !== null) {
      onEditorSquare?.(targetSquare, editorPiece || null)
      return true
    }
    if (requestPromotion(sourceSquare, targetSquare)) return false
    const result = applyMove({ from: sourceSquare, to: targetSquare })
    if (result) clearSelection()
    return !!result
  }, [editorPiece, onEditorSquare, applyMove, clearSelection, promotion, requestPromotion])

  const onArrowsChange = useCallback(({ arrows: nextArrows }) => {
    setUserArrows(nextArrows)
  }, [])

  const chessboardOptions = {
    position: boardFen,
    onPieceDrop,
    onPieceDrag: () => boardStage.current?.setAttribute('data-dragging', 'true'),
    onPieceDragCancel: () => boardStage.current?.removeAttribute('data-dragging'),
    allowDragging: !promotion,
    onSquareClick,
    squareStyles,
    arrows: userArrows,
    onArrowsChange,
    allowDrawingArrows: true,
    clearArrowsOnPositionChange: true,
    boardOrientation,
    animationDurationInMs: rapidNavigation ? 0 : 120,
    id,
    lightSquareStyle: { backgroundColor: LIGHT_SQUARE },
    darkSquareStyle: { backgroundColor: DARK_SQUARE },
    boardStyle: { borderRadius: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' },
  }

  return (
    <>
    <div className="board-with-evaluation">
    {evaluationSlot}
    <div className="board-stage" ref={boardStage} tabIndex={-1} aria-label="Scacchiera di analisi" data-fen={boardFen} data-orientation={boardOrientation}>
      <Chessboard options={chessboardOptions} />
      {engineArrowSegments.length > 0 && (
        <svg className="engine-arrow-overlay" data-fen={boardFen} viewBox="0 0 100 100" aria-label="Migliore mossa nella posizione mostrata">
          {engineArrowSegments.map(arrow => <Arrow key={arrow.markerId} arrow={arrow} />)}
        </svg>
      )}
      {review && boardFen === review.entry.fenAfter && <MoveClassificationBadge entry={review.entry} move={reviewedMove} orientation={boardOrientation} />}
    </div>
    </div>
    <dialog className="promotion-dialog" ref={promotionDialog} aria-labelledby={`${id}-promotion-title`}
      onCancel={() => setPromotion(null)} onClose={() => {
        setPromotion(null)
        boardStage.current?.focus({ preventScroll: true })
      }}>
      <h2 id={`${id}-promotion-title`}>Scegli la promozione</h2>
      <div className="controls-row">
        {promotion?.choices.map(piece => <button type="button" key={piece} onClick={() => {
          if (promotion.fen === fen && promotion.history === moveHistorySan) {
            applyMove({ from: promotion.from, to: promotion.to, promotion: piece })
          }
          setPromotion(null)
        }}>{{ q: 'Donna', r: 'Torre', b: 'Alfiere', n: 'Cavallo' }[piece]}</button>)}
      </div>
      <button type="button" onClick={() => setPromotion(null)}>Annulla promozione</button>
    </dialog>
    </>
  )
}
