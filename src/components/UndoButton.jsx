import { useGame } from '../context/GameContext.jsx'

export default function UndoButton() {
  const { undo, canUndo } = useGame()

  return (
    <button onClick={undo} disabled={!canUndo}>
      ← Torna indietro
    </button>
  )
}
