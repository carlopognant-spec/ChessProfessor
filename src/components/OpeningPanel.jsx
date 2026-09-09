import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { fetchOpeningData } from '../lib/lichessExplorer.js'

export default function OpeningPanel({ onOpeningData }) {
  const { fen } = useGame()
  const [opening, setOpening] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchOpeningData(fen)
      .then((data) => {
        if (cancelled) return
        setOpening(data)
        onOpeningData?.(data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        onOpeningData?.(null)
      })
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [fen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <p className="notice">Consulto il database Lichess…</p>
  if (error) return <p className="notice">Dati Lichess non disponibili al momento.</p>
  if (!opening) return <p className="notice">Posizione fuori teoria: nessun dato Lichess per questa posizione.</p>

  return (
    <div>
      <span className="eco-label">{opening.eco ?? '—'}</span>
      <h2 className="opening-name">{opening.name ?? 'Apertura senza nome noto'}</h2>
      <div className="stat-row">
        <span>Bianco {opening.white}</span>
        <span>Patta {opening.draws}</span>
        <span>Nero {opening.black}</span>
      </div>
    </div>
  )
}
