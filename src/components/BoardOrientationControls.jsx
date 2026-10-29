import { useGame } from '../context/GameContext.jsx'

export default function BoardOrientationControls({ orientation }) {
  const { boardOrientation, boardView, updateBoardView, boardViewError } = useGame()
  const current = orientation ?? boardOrientation
  return <div className="board-view-controls">
    <label>Vista <select aria-label="Orientamento scacchiera" value={boardView.mode}
      onChange={event => updateBoardView({ mode: event.target.value })}>
      <option value="auto">Automatico{boardView.mode === 'auto' ? ` (${current === 'white' ? 'Bianco' : 'Nero'})` : ''}</option>
      <option value="white">Bianco</option><option value="black">Nero</option>
    </select></label>
    <button type="button" onClick={() => updateBoardView({ mode: current === 'white' ? 'black' : 'white' })}>Ruota scacchiera</button>
    <details><summary>Riconosci il mio colore</summary>
      <label>Nome nei PGN <input aria-label="Nome giocatore nei PGN" value={boardView.playerName} maxLength={100}
        onChange={event => updateBoardView({ playerName: event.target.value })} autoComplete="off" /></label>
      <p className="notice">In automatico confronta questo nome con White e Black del PGN. Senza una corrispondenza univoca, la partita si apre dal Bianco; il ripasso dal lato da giocare. La scelta manuale ha precedenza.</p>
    </details>
    {boardViewError && <p role="status">{boardViewError}</p>}
  </div>
}
