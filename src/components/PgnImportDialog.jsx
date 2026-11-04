import { useEffect, useRef, useState } from 'react'

export default function PgnImportDialog({ open, draft, error, busy, onDraftChange, onImport, onClose }) {
  const dialog = useRef(null)
  const field = useRef(null)
  const request = useRef(0)
  const [reading, setReading] = useState(false)
  const [fileError, setFileError] = useState('')
  const [fromFile, setFromFile] = useState(false)
  useEffect(() => {
    if (open) {
      dialog.current.showModal()
      field.current.focus()
    } else {
      request.current++
      setReading(false)
      dialog.current.close()
    }
    return () => { request.current++ }
  }, [open])
  const message = fileError || error
  return <dialog ref={dialog} className="pgn-import-dialog" aria-labelledby="pgn-import-title"
    onKeyDown={event => {
      if (event.key !== 'Tab') return
      const fields = [...dialog.current.querySelectorAll('textarea:not(:disabled), input:not(:disabled), button:not(:disabled)')]
      const first = fields[0], last = fields.at(-1)
      if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus() }
    }}
    onCancel={event => { event.preventDefault(); if (!busy) onClose() }} onClose={onClose}>
    <form className="pgn-import" aria-busy={busy || reading} onSubmit={event => {
      event.preventDefault()
      if (!busy && !reading) onImport(fromFile)
    }}>
      <h2 id="pgn-import-title">Importa partita</h2>
      <p className="notice" id="pgn-draft-help">Testo e file restano una bozza finché non confermi. Il file importato viene anche salvato nell’archivio.</p>
      <label htmlFor="pgn-draft">PGN da importare</label>
      <textarea id="pgn-draft" ref={field} value={draft} rows={8} disabled={busy || reading}
        aria-describedby={message ? 'pgn-draft-help pgn-import-error' : 'pgn-draft-help'} aria-invalid={!!message}
        onChange={event => { setFileError(''); setFromFile(false); onDraftChange(event.target.value) }} />
      <label>Carica file PGN<input type="file" accept=".pgn,text/plain,application/x-chess-pgn" disabled={busy || reading}
        onChange={async event => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          const token = ++request.current
          setReading(true); setFileError('')
          try {
            const text = await file.text()
            if (token !== request.current) return
            onDraftChange(text); setFromFile(true)
          } catch {
            if (token === request.current) setFileError('Impossibile leggere il file PGN. La bozza precedente è conservata.')
          } finally { if (token === request.current) setReading(false) }
        }} /></label>
      {reading && <p role="status">Lettura del file PGN…</p>}
      {message && <p id="pgn-import-error" role="alert">{message}</p>}
      <div className="controls-row">
        <button type="button" disabled={busy} onClick={onClose}>Annulla</button>
        <button type="submit" disabled={busy || reading || !draft.trim()}>Importa PGN</button>
      </div>
    </form>
  </dialog>
}
