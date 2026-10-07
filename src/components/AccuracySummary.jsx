import { useMemo } from 'react'
import { gameAccuracy } from '../lib/accuracy.js'

export default function AccuracySummary({ entries, totalPlies }) {
  const accuracy = useMemo(() => gameAccuracy(entries, { totalPlies }), [entries, totalPlies])
  const label = side => accuracy[side].value == null ? 'Non disponibile' : accuracy[side].value.toFixed(1)
  return <section className="accuracy-summary" aria-label="Precisione della partita">
    <h3>Precisione 0–100</h3>
    <p>Bianco: <strong>{label('white')}</strong> · Nero: <strong>{label('black')}</strong></p>
    <p className="notice">Formula pubblica Lichess; non riproduce la formula privata di chess.com.</p>
    {accuracy.partial && <p className="notice">Calcolo parziale: {accuracy.analyzedPlies}/{accuracy.totalPlies} semimosse analizzate. Valutazioni utilizzate: Bianco {accuracy.white.used}/{accuracy.white.total}, Nero {accuracy.black.used}/{accuracy.black.total}.</p>}
  </section>
}
