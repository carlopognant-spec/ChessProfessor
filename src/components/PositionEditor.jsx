import { useMemo, useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { parseAndValidateFen } from '../lib/positionEditor.js'

const PIECES = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p']
const CASTLING_FLAGS = ['K', 'Q', 'k', 'q']

export default function PositionEditor({ draft, onDraftChange, selectedPiece, onPieceSelect }) {
  const { fen, loadFen } = useGame()
  const [error, setError] = useState('')

  const fields = useMemo(() => draft.trim().split(/\s+/), [draft])
  const castling = fields[2] ?? '-'

  function updateField(index, value) {
    const next = [...fields]
    while (next.length < 6) next.push(index === 2 ? '-' : index === 3 ? '-' : '0')
    next[index] = value
    onDraftChange(next.join(' '))
  }

  function toggleCastling(flag) {
    const next = castling === '-' ? '' : castling
    const updated = next.includes(flag) ? next.replace(flag, '') : `${next}${flag}`
    updateField(2, updated || '-')
  }

  function applyPosition() {
    try {
      const validated = parseAndValidateFen(draft)
      loadFen(validated.fen)
      setError('')
      onPieceSelect?.(null)
    } catch (validationError) {
      setError(validationError.message)
    }
  }

  async function copyFen() {
    const currentFen = fen
    onDraftChange(currentFen)
    if (navigator.clipboard) await navigator.clipboard.writeText(currentFen)
  }

  return (
    <section className="position-editor" aria-label="Editor posizione FEN">
      <div className="position-editor-heading">
        <h2>Editor posizione</h2>
        <button type="button" onClick={copyFen} title="Copia la FEN corrente">Copia FEN</button>
      </div>
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        rows={2}
        aria-label="FEN"
      />
      <div className="editor-controls">
        <label>
          Lato al tratto
          <select value={fields[1] ?? 'w'} onChange={(event) => updateField(1, event.target.value)}>
            <option value="w">Bianco</option>
            <option value="b">Nero</option>
          </select>
        </label>
        <label>
          En passant
          <input value={fields[3] ?? '-'} onChange={(event) => updateField(3, event.target.value || '-')} />
        </label>
      </div>
      <div className="castling-controls" aria-label="Arrocchi">
        {CASTLING_FLAGS.map((flag) => (
          <label key={flag}>
            <input type="checkbox" checked={castling.includes(flag)} onChange={() => toggleCastling(flag)} />
            {flag}
          </label>
        ))}
      </div>
      <div className="piece-palette" aria-label="Palette pezzi">
        {PIECES.map((piece) => (
          <button
            type="button"
            key={piece}
            className={selectedPiece === piece ? 'selected-piece' : ''}
            onClick={() => onPieceSelect?.(selectedPiece === piece ? null : piece)}
            title={`Seleziona ${piece}`}
          >
            {piece}
          </button>
        ))}
        <button type="button" className={selectedPiece === '' ? 'selected-piece' : ''} onClick={() => onPieceSelect?.('')}>
          Cancella
        </button>
      </div>
      <button type="button" onClick={applyPosition}>Applica posizione</button>
      {error && <p className="notice">{error}</p>}
    </section>
  )
}
