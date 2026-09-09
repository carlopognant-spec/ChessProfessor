import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { fetchOpeningExplorer } from '../lib/lichessExplorer.js'

function toOpeningView(data) {
  const totalGames = (data.white ?? 0) + (data.draws ?? 0) + (data.black ?? 0)
  if (totalGames === 0) return null

  return {
    eco: data.opening?.eco ?? null,
    name: data.opening?.name ?? null,
    white: data.white ?? 0,
    draws: data.draws ?? 0,
    black: data.black ?? 0,
    moves: (data.moves ?? []).slice(0, 5).map((m) => ({
      san: m.san,
      white: m.white,
      draws: m.draws,
      black: m.black,
    })),
  }
}

export default function OpeningPanel({ onOpeningData }) {
  const { fen } = useGame()
  const [opening, setOpening] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchOpeningExplorer(fen)
      .then((raw) => {
        if (cancelled) return
        const data = toOpeningView(raw)
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
