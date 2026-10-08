import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { parseAndValidateFen } from '../lib/positionEditor.js'
import { captureGameSnapshot, replayGame, restoreGameSnapshot } from '../lib/gameNavigation.js'

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
  const [fen, setFen] = useState(gameRef.current.fen())
  const [moveHistorySan, setMoveHistorySan] = useState([])
  const [navigationHistorySan, setNavigationHistorySan] = useState([])
  // Chat undo restores the displayed prefix AND the continuation before its move.
  const [undoStack, setUndoStack] = useState([])

  const updateTimeline = useCallback((timeline) => {
    timelineRef.current = [...timeline]
    setNavigationHistorySan(timelineRef.current)
  }, [])

  const applyMove = useCallback((sanOrMoveObj, fromChat = false) => {
    try {
      const snapshot = fromChat
        ? captureGameSnapshot(gameRef.current, baseFenRef.current, timelineRef.current)
        : null
      const move = gameRef.current.move(sanOrMoveObj)
      if (!move) return false
      setFen(gameRef.current.fen())
      setMoveHistorySan(gameRef.current.history())
      updateTimeline(gameRef.current.history())
      if (fromChat) setUndoStack((stack) => [...stack, snapshot])
      else setUndoStack([])
      return true
    } catch {
      return false
    }
  }, [updateTimeline])

  /** Usata dal chatbot: salva snapshot PRIMA di applicare la mossa suggerita. */
  const applyMoveFromChat = useCallback((san) => {
    return applyMove(san, true)
  }, [applyMove])

  const resetGame = useCallback(() => {
    importedPgnRef.current = null
    const fresh = new Chess()
    baseFenRef.current = fresh.fen()
    gameRef.current = fresh
    syncGameState(fresh, setFen, setMoveHistorySan)
    updateTimeline([])
    setUndoStack([])
  }, [updateTimeline])

  const loadFen = useCallback((nextFen) => {
    importedPgnRef.current = null
    const validated = parseAndValidateFen(nextFen)
    const next = new Chess(validated.fen)
    baseFenRef.current = next.fen()
    gameRef.current = next
    syncGameState(next, setFen, setMoveHistorySan)
    updateTimeline([])
    setUndoStack([])
  }, [updateTimeline])

  const loadMoveSequence = useCallback((moves = []) => {
    const next = replayGame(baseFenRef.current, moves)
    gameRef.current = next
    syncGameState(next, setFen, setMoveHistorySan)
    if (timelineRef.current.length < moves.length) updateTimeline(moves)
  }, [updateTimeline])

  const importPgn = useCallback((pgn) => {
    const next = new Chess()
    next.loadPgn(pgn)
    const moves = next.history()
    if (moves.length === 0) return false
    importedPgnRef.current = { pgn: next.pgn(), moves, headers: next.getHeaders() }
    baseFenRef.current = next.getHeaders().FEN ?? new Chess().fen()
    gameRef.current = next
    syncGameState(next, setFen, setMoveHistorySan)
    updateTimeline(moves)
    setUndoStack([])
    return true
  }, [updateTimeline])

  const exportPgn = useCallback(() => {
    const imported = importedPgnRef.current
    // Navigation changes the displayed prefix, never the saved continuation.
    if (imported && JSON.stringify(imported.moves) === JSON.stringify(timelineRef.current)) return imported.pgn
    const full = replayGame(baseFenRef.current, timelineRef.current)
    if (imported) {
      for (const [key, value] of Object.entries(imported.headers)) {
        if (!['FEN', 'SetUp', 'Result'].includes(key)) full.setHeader(key, value)
      }
      full.setHeader('Result', full.isCheckmate() ? (full.turn() === 'w' ? '0-1' : '1-0') : full.isDraw() ? '1/2-1/2' : '*')
    }
    return full.pgn()
  }, [])

  const undo = useCallback(() => {
    const last = undoStack.at(-1)
    if (!last) return
    gameRef.current = restoreGameSnapshot(last)
    baseFenRef.current = last.baseFen
    syncGameState(gameRef.current, setFen, setMoveHistorySan)
    updateTimeline(last.navigationHistorySan)
    setUndoStack(undoStack.slice(0, -1))
  }, [undoStack, updateTimeline])

  const value = useMemo(() => ({
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
  }), [fen, moveHistorySan, navigationHistorySan, exportPgn, applyMove, applyMoveFromChat, undo, undoStack, resetGame, importPgn, loadFen, loadMoveSequence])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame va usato dentro <GameProvider>')
  return ctx
}
