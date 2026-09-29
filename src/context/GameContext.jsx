import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { parsePgnMoves } from '../lib/pgn.js'
import { parseAndValidateFen } from '../lib/positionEditor.js'

const GameContext = createContext(null)

function syncGameState(game, setFen, setMoveHistorySan) {
  setFen(game.fen())
  setMoveHistorySan(game.history())
}

export function GameProvider({ children }) {
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [moveHistorySan, setMoveHistorySan] = useState([])
  // Stack di snapshot { fen, moveHistorySan } salvati PRIMA di ogni mossa
  // applicata dalla chat, per poter tornare indietro con un pulsante.
  const [undoStack, setUndoStack] = useState([])

  const snapshotBeforeChange = useCallback(() => {
    setUndoStack((stack) => [...stack, { fen, moveHistorySan }])
  }, [fen, moveHistorySan])

  const applyMove = useCallback((sanOrMoveObj) => {
    try {
      const move = gameRef.current.move(sanOrMoveObj)
      if (!move) return false
      setFen(gameRef.current.fen())
      setMoveHistorySan(gameRef.current.history())
      return true
    } catch {
      return false
    }
  }, [])

  /** Usata dal chatbot: salva snapshot PRIMA di applicare la mossa suggerita. */
  const applyMoveFromChat = useCallback((san) => {
    snapshotBeforeChange()
    const ok = applyMove(san)
    if (!ok) {
      // Mossa illegale o non riconosciuta: annulla lo snapshot inutilizzato.
      setUndoStack((stack) => stack.slice(0, -1))
    }
    return ok
  }, [applyMove, snapshotBeforeChange])

  const resetGame = useCallback(() => {
    const fresh = new Chess()
    gameRef.current = fresh
    syncGameState(fresh, setFen, setMoveHistorySan)
    setUndoStack([])
  }, [])

  const loadFen = useCallback((nextFen) => {
    const validated = parseAndValidateFen(nextFen)
    const next = new Chess(validated.fen)
    gameRef.current = next
    syncGameState(next, setFen, setMoveHistorySan)
    setUndoStack([])
  }, [])

  const loadMoveSequence = useCallback((moves = []) => {
    const next = new Chess()
    for (const san of moves) next.move(san)
    gameRef.current = next
    syncGameState(next, setFen, setMoveHistorySan)
    setUndoStack([])
  }, [])

  const importPgn = useCallback((pgn) => {
    const moves = parsePgnMoves(pgn)
    if (moves.length === 0) return false

    const next = new Chess()
    for (const [index, san] of moves.entries()) {
      const move = next.move(san)
      if (!move) {
        throw new Error(`Mossa PGN illegale al passo ${index + 1}: ${san}`)
      }
    }

    gameRef.current = next
    syncGameState(next, setFen, setMoveHistorySan)
    setUndoStack([])
    return true
  }, [])

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack
      const last = stack[stack.length - 1]
      gameRef.current = new Chess(last.fen)
      setFen(last.fen)
      setMoveHistorySan(last.moveHistorySan)
      return stack.slice(0, -1)
    })
  }, [])

  const value = useMemo(() => ({
    fen,
    moveHistorySan,
    applyMove,
    applyMoveFromChat,
    undo,
    resetGame,
    importPgn,
    loadFen,
    loadMoveSequence,
    canUndo: undoStack.length > 0,
    isGameOver: gameRef.current.isGameOver(),
  }), [fen, moveHistorySan, applyMove, applyMoveFromChat, undo, undoStack, resetGame, importPgn, loadFen, loadMoveSequence])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame va usato dentro <GameProvider>')
  return ctx
}
