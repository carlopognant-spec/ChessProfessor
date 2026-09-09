import { useGame } from '../context/GameContext.jsx'

export default function MoveList() {
  const { moveHistorySan } = useGame()

  if (moveHistorySan.length === 0) {
    return <p className="move-list">Nessuna mossa ancora giocata.</p>
  }

  const pairs = []
  for (let i = 0; i < moveHistorySan.length; i += 2) {
    pairs.push([moveHistorySan[i], moveHistorySan[i + 1]])
  }

  return (
    <div className="move-list">
      {pairs.map(([white, black], i) => (
        <span key={i}>
          {i + 1}. {white}{black ? ` ${black}` : ''}{' '}
        </span>
      ))}
    </div>
  )
}
