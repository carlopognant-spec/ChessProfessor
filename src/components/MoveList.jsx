import { useGame } from '../context/GameContext.jsx'
import { buildMoveNavigation } from '../lib/analysisPresentation.js'

export default function MoveList() {
  const { moveHistorySan, loadMoveSequence, baseFen } = useGame()

  if (moveHistorySan.length === 0) {
    return <p className="move-list">Nessuna mossa ancora giocata.</p>
  }

  return (
    <div className="move-list">
      {buildMoveNavigation(moveHistorySan, baseFen).map((move) => (
        <button
          type="button"
          key={move.ply}
          className="move-button"
          onClick={() => loadMoveSequence(move.moves)}
          title={`Vai alla posizione dopo ${move.san}`}
        >
          {move.side === 'w' ? `${move.moveNumber}.` : `${move.moveNumber}...`} {move.san}
        </button>
      ))}
    </div>
  )
}
