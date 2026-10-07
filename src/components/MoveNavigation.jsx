import { useGame } from '../context/GameContext.jsx'
import { getButtonNavigationTarget } from '../lib/analysisPresentation.js'

const BUTTONS = [
  ['first', 'Primo'],
  ['previous', 'Indietro'],
  ['next', 'Avanti'],
  ['last', 'Ultimo'],
]

export default function MoveNavigation() {
  const { moveHistorySan, navigationHistorySan, loadMoveSequence } = useGame()
  const current = moveHistorySan.length
  const total = navigationHistorySan.length
  return (
    <nav className="move-navigation" aria-label="Navigazione mosse">
      {BUTTONS.map(([action, label], index) => (
        <button
          type="button"
          key={action}
          disabled={index < 2 ? current === 0 : current === total}
          onClick={() => loadMoveSequence(getButtonNavigationTarget(action, current, navigationHistorySan))}
        >
          {label}
        </button>
      ))}
      <span className="move-navigation-position" aria-live="polite">{current} / {total}</span>
    </nav>
  )
}
