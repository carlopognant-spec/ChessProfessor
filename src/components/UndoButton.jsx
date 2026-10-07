import { useGame } from '../context/GameContext.jsx'

export default function UndoButton() {
  const { undo, canUndo } = useGame()

  return (
    <button onClick={undo} disabled={!canUndo} title="Annulla l'ultima mossa della chat e ripristina la continuazione precedente">
      ← Torna indietro
    </button>
  )
}
