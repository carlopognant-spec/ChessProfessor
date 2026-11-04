import { useEffect, useMemo, useRef } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { buildMoveNavigation } from '../lib/analysisPresentation.js'

export default function MoveList({ entries = [] }) {
  const { moveHistorySan, navigationHistorySan, analysisHistorySan, loadMoveSequence, baseFen } = useGame()
  const moves = useMemo(() => buildMoveNavigation(navigationHistorySan, baseFen), [navigationHistorySan, baseFen])
  const turns = useMemo(() => {
    const rows = []
    for (const move of moves) {
      let row = rows.at(-1)
      if (!row || row.number !== move.moveNumber) { row = { number: move.moveNumber }; rows.push(row) }
      row[move.side] = move
    }
    return rows
  }, [moves])
  const byPly = useMemo(() => new Map(entries.map(entry => [entry.ply, entry])), [entries])
  const classifiedPrefix = useMemo(() => {
    let ply = 0
    while (ply < navigationHistorySan.length && navigationHistorySan[ply] === analysisHistorySan[ply]) ply++
    return ply
  }, [navigationHistorySan, analysisHistorySan])
  const list = useRef(null)
  useEffect(() => {
    const button = list.current?.querySelector('[aria-current="step"]')
    if (button) {
      const container = list.current, bounds = button.getBoundingClientRect()
      container.scrollTop += bounds.top - container.getBoundingClientRect().top - container.clientHeight / 2 + bounds.height / 2
    }
  }, [moveHistorySan.length])

  if (navigationHistorySan.length === 0) {
    return <p className="move-list">Nessuna mossa ancora giocata.</p>
  }

  return (
    <div className="move-list" ref={list} aria-label="Notazione completa">
      <table className="notation-table">
        <thead><tr><th scope="col">Turno</th><th scope="col">Bianco</th><th scope="col">Nero</th></tr></thead>
        <tbody>{turns.map(turn => <tr key={turn.number} data-turn={turn.number}>
          <th scope="row">{turn.number}.</th>
          {['w', 'b'].map(side => {
            const move = turn[side], entry = move && move.ply <= classifiedPrefix ? byPly.get(move.ply) : null
            return <td key={side}>{move && <button type="button"
              className={`move-button${entry ? ' analysis-row-button' : ''}`}
              aria-label={`${move.moveNumber}${side === 'w' ? '.' : '...'} ${move.san}`}
              aria-current={move.ply === moveHistorySan.length ? 'step' : undefined}
              aria-pressed={move.ply === moveHistorySan.length}
              data-ply={move.ply} data-classification={entry?.classification}
              onClick={() => loadMoveSequence(move.moves)} title={`Vai alla posizione dopo ${move.san}`}>
              {move.san}
            </button>}</td>
          })}
        </tr>)}</tbody>
      </table>
    </div>
  )
}
