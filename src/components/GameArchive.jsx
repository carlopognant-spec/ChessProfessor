import { useEffect, useMemo, useState } from 'react'
import { archiveAnalysisStatus, createGameArchive } from '../lib/gameArchive.js'

export default function GameArchive({ getPgn, analysisEntries, onOpen }) {
  const archive = useMemo(() => createGameArchive(), [])
  const [records, setRecords] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = async () => setRecords(await archive.list())
  useEffect(() => {
    let disposed = false
    archive.list().then(items => { if (!disposed) setRecords(items) })
      .catch(error => { if (!disposed) setMessage(error.message) })
    return () => { disposed = true; archive.close() }
  }, [archive])
  const perform = async action => {
    setBusy(true)
    setMessage('')
    try { await action(); await refresh() }
    catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  const exportPgn = record => {
    const url = URL.createObjectURL(new Blob([record.pgn], { type: 'application/x-chess-pgn;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${record.title.replace(/[^\p{L}\p{N}_ -]/gu, '_').slice(0, 80) || 'partita'}.pgn`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <details className="game-archive">
    <summary>Partite salvate ({records.length})</summary>
    <p className="notice">Solo in questo browser e su questo dispositivo, senza sincronizzazione. In modalità privata i dati possono essere cancellati alla chiusura. Esporta i PGN per conservarli.</p>
    <button disabled={busy} onClick={() => perform(async () => {
      const result = await archive.save({ pgn: getPgn(), analysisEntries })
      setMessage(result.duplicate ? 'Partita già presente: salvata senza duplicati.' : 'Partita salvata.')
    })}>Salva partita e analisi</button>
    <label className="archive-import">Importa file PGN
      <input type="file" accept=".pgn,text/plain,application/x-chess-pgn" disabled={busy} onChange={event => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file) perform(async () => {
          const result = await archive.save({ pgn: await file.text() })
          onOpen(result.record)
          setMessage(result.duplicate ? 'Partita già presente, aperta.' : 'PGN importato e salvato.')
        })
      }} />
    </label>
    <p role="status">{message}</p>
    <ul className="archive-list">{records.map(record => {
      const status = archiveAnalysisStatus(record)
      return <li key={record.id}>
        <strong>{record.title}</strong>
        <div>{record.players.white} / {record.players.black} · {record.date} · {record.result}</div>
        <div>Importata: {new Date(record.importedAt).toLocaleDateString('it-IT')}. {status === 'none' ? 'Senza analisi.' : status === 'stale' ? 'Analisi obsoleta: da ricalcolare.' : `Analisi salvata: ${record.analysisEntries.length} mosse.`}</div>
        <div className="archive-actions">
          <button disabled={busy} onClick={() => perform(async () => {
            const latest = await archive.get(record.id)
            if (!latest) throw new Error('Partita non più presente nell’archivio.')
            onOpen(latest)
            setMessage(status === 'stale' ? 'Partita aperta. Analisi obsoleta conservata; avvia l’analisi per aggiornarla.' : 'Partita aperta.')
          })}>Apri</button>
          <button disabled={busy} onClick={() => {
            const title = window.prompt('Nome della partita', record.title)
            if (title?.trim()) perform(() => archive.rename(record.id, title))
          }}>Rinomina</button>
          <button disabled={busy} onClick={() => exportPgn(record)}>Esporta PGN</button>
          <button disabled={busy} onClick={() => {
            if (window.confirm(`Eliminare “${record.title}” dall’archivio di questo browser?`)) perform(() => archive.remove(record.id))
          }}>Elimina</button>
        </div>
      </li>
    })}</ul>
  </details>
}
