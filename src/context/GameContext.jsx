import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { parseAndValidateFen } from '../lib/positionEditor.js'
import { captureGameSnapshot, replayGame, restoreGameSnapshot, positionTimeline } from '../lib/gameNavigation.js'
import { detectPlayerOrientation, readBoardView, saveBoardView } from '../lib/boardOrientation.js'

const GameContext = createContext(null)

function syncGameState(game, setFen, setMoveHistorySan) {
  setFen(game.fen())
  setMoveHistorySan(game.history())
}

export function GameProvider({ children }) {
  const gameRef = useRef(new Chess())
  const baseFenRef = useRef(gameRef.current.fen())
  const timelineRef = useRef([])
  const importedPgnRef = useRef(null)
  const positionsRef = useRef([gameRef.current.fen()])
  const displayedMovesRef = useRef([])
  const lastNavigationRef = useRef(0)
  const rapidTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(rapidTimerRef.current), [])
  const [rapidNavigation, setRapidNavigation] = useState(false)
  const [isExploring, setIsExploring] = useState(false)
  const [analysisHistorySan, setAnalysisHistorySan] = useState([])
  const [fen, setFen] = useState(gameRef.current.fen())
  const [moveHistorySan, setMoveHistorySan] = useState([])
  const [navigationHistorySan, setNavigationHistorySan] = useState([])
  // Chat undo restores the displayed prefix AND the continuation before its move.
  const [undoStack, setUndoStack] = useState([])
  const [boardView, setBoardView] = useState(readBoardView)
  const [boardViewError, setBoardViewError] = useState('')
  const updateBoardView = useCallback(patch => {
    const next = { ...boardView, ...patch }
    setBoardView(next)
    setBoardViewError(saveBoardView(next) ? '' : 'Il browser non permette di salvare la preferenza. La vista resta utilizzabile.')
  }, [boardView])
  const detectedOrientation = detectPlayerOrientation(importedPgnRef.current?.headers, boardView.playerName)
  const boardOrientation = boardView.mode === 'auto' ? detectedOrientation ?? 'white' : boardView.mode

  const updateTimeline = useCallback((timeline) => {
    timelineRef.current = [...timeline]
    setNavigationHistorySan(timelineRef.current)
  }, [])

  const applyMove = useCallback((sanOrMoveObj, fromChat = false) => {
    try {
      // Navigation reads cached positions; rebuild history only when actually playing a move.
      const next = replayGame(baseFenRef.current, displayedMovesRef.current)
      if (next.isGameOver()) return false
      const snapshot = fromChat ? captureGameSnapshot(next, baseFenRef.current, timelineRef.current) : null
      const move = next.move(sanOrMoveObj)
      if (!move) return false
      const moves = [...displayedMovesRef.current, move.san]
      clearTimeout(rapidTimerRef.current)
      gameRef.current = next
      displayedMovesRef.current = moves
      setRapidNavigation(false)
      setFen(next.fen())
      setMoveHistorySan(moves)
      if (!moves.every((san, i) => timelineRef.current[i] === san)) {
        positionsRef.current = [...positionsRef.current.slice(0, moves.length), next.fen()]
        updateTimeline(moves)
        if (importedPgnRef.current) setIsExploring(true)
        else setAnalysisHistorySan(moves)
      }
      if (fromChat) setUndoStack(stack => [...stack, snapshot])
      else setUndoStack([])
      return true
    } catch { return false }
  }, [updateTimeline])

  /** Usata dal chatbot: salva snapshot PRIMA di applicare la mossa suggerita. */
  const applyMoveFromChat = useCallback((san) => {
    return applyMove(san, true)
  }, [applyMove])

  const resetGame = useCallback(() => {
    clearTimeout(rapidTimerRef.current)
    importedPgnRef.current = null
    const fresh = new Chess()
    baseFenRef.current = fresh.fen()
    gameRef.current = fresh
    positionsRef.current = [fresh.fen()]
    displayedMovesRef.current = []
    setIsExploring(false); setRapidNavigation(false); setAnalysisHistorySan([])
    syncGameState(fresh, setFen, setMoveHistorySan)
    updateTimeline([])
    setUndoStack([])
  }, [updateTimeline])

  const loadFen = useCallback((nextFen) => {
    clearTimeout(rapidTimerRef.current)
    importedPgnRef.current = null
    const validated = parseAndValidateFen(nextFen)
    const next = new Chess(validated.fen)
    baseFenRef.current = next.fen()
    gameRef.current = next
    positionsRef.current = [next.fen()]
    displayedMovesRef.current = []
    setIsExploring(false); setRapidNavigation(false); setAnalysisHistorySan([])
    syncGameState(next, setFen, setMoveHistorySan)
    updateTimeline([])
    setUndoStack([])
  }, [updateTimeline])

  const loadMoveSequence = useCallback((moves = [], { rapid = false } = {}) => {
    if (moves.length === displayedMovesRef.current.length
      && moves.every((san, i) => displayedMovesRef.current[i] === san)) return
    let nextMoves = moves
    if (!moves.every((san, i) => timelineRef.current[i] === san)) {
      const next = replayGame(baseFenRef.current, moves)
      const indexed = positionTimeline(next)
      nextMoves = indexed.moves
      positionsRef.current = indexed.fens
      updateTimeline(nextMoves)
      if (importedPgnRef.current) setIsExploring(true)
      else setAnalysisHistorySan(nextMoves)
    }
    const now = performance.now()
    setRapidNavigation(rapid || now - lastNavigationRef.current < 160)
    lastNavigationRef.current = now
    clearTimeout(rapidTimerRef.current)
    rapidTimerRef.current = setTimeout(() => setRapidNavigation(false), 180)
    displayedMovesRef.current = [...nextMoves]
    setFen(positionsRef.current[nextMoves.length])
    setMoveHistorySan(displayedMovesRef.current)
  }, [updateTimeline])

  const importPgn = useCallback((pgn) => {
    const next = new Chess()
    next.loadPgn(pgn)
    const indexed = positionTimeline(next)
    const moves = indexed.moves
    if (moves.length === 0) return false
    clearTimeout(rapidTimerRef.current)
    importedPgnRef.current = { pgn: next.pgn(), moves, fens: indexed.fens, headers: next.getHeaders() }
    baseFenRef.current = next.getHeaders().FEN ?? new Chess().fen()
    gameRef.current = next
    positionsRef.current = indexed.fens
    displayedMovesRef.current = moves
    setIsExploring(false); setRapidNavigation(false); setAnalysisHistorySan(moves)
    setFen(next.fen()); setMoveHistorySan(moves)
    updateTimeline(moves)
    setUndoStack([])
    return true
  }, [updateTimeline])

  const exportPgn = useCallback(() => {
    const imported = importedPgnRef.current
    // Navigation changes the displayed prefix, never the saved continuation.
    if (imported) return imported.pgn
    const full = replayGame(baseFenRef.current, timelineRef.current)
    return full.pgn()
  }, [])

  const returnToGame = useCallback(() => {
    const original = importedPgnRef.current
    if (!original) return
    clearTimeout(rapidTimerRef.current)
    positionsRef.current = original.fens
    displayedMovesRef.current = original.moves
    setFen(original.fens.at(-1)); setMoveHistorySan(original.moves)
    updateTimeline(original.moves)
    setUndoStack([]); setIsExploring(false); setRapidNavigation(false)
  }, [updateTimeline])

  const undo = useCallback(() => {
    const last = undoStack.at(-1)
    if (!last) return
    clearTimeout(rapidTimerRef.current)
    gameRef.current = restoreGameSnapshot(last)
    baseFenRef.current = last.baseFen
    const full = replayGame(last.baseFen, last.navigationHistorySan)
    positionsRef.current = positionTimeline(full).fens
    displayedMovesRef.current = last.moveHistorySan
    setRapidNavigation(false)
    setIsExploring(!!importedPgnRef.current && JSON.stringify(last.navigationHistorySan) !== JSON.stringify(importedPgnRef.current.moves))
    syncGameState(gameRef.current, setFen, setMoveHistorySan)
    updateTimeline(last.navigationHistorySan)
    if (!importedPgnRef.current) setAnalysisHistorySan(last.navigationHistorySan)
    setUndoStack(undoStack.slice(0, -1))
  }, [undoStack, updateTimeline])

  const value = useMemo(() => ({
    analysisHistorySan,
    isExploring,
    rapidNavigation,
    returnToGame,
    boardView,
    boardOrientation,
    updateBoardView,
    boardViewError,
    fen,
    moveHistorySan,
    navigationHistorySan,
    baseFen: baseFenRef.current,
    exportPgn,
    applyMove,
    applyMoveFromChat,
    undo,
    resetGame,
    importPgn,
    loadFen,
    loadMoveSequence,
    canUndo: undoStack.length > 0,
  }), [analysisHistorySan, isExploring, rapidNavigation, returnToGame, boardView, boardOrientation, updateBoardView, boardViewError, fen, moveHistorySan, navigationHistorySan, exportPgn, applyMove, applyMoveFromChat, undo, undoStack, resetGame, importPgn, loadFen, loadMoveSequence])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame va usato dentro <GameProvider>')
  return ctx
}
