import { useMemo } from 'react'
import { buildMoveExplanation } from '../lib/moveExplanation.js'
import './MoveExplanation.css'

const fields = [
  ['why', 'Perché questa scelta è problematica'],
  ['opportunity', 'Minaccia o opportunità'],
  ['punishment', 'Come può rispondere l’avversario'],
  ['alternative', 'Perché considerare l’alternativa'],
]

export default function MoveExplanation({ entry }) {
  const explanation = useMemo(() => buildMoveExplanation(entry), [entry])
  return <section className="move-explanation" aria-label="Spiegazione scacchistica">
    <dl>{fields.map(([key, label]) => <div key={key}>
      <dt><strong>{label}</strong></dt><dd>{explanation[key]}</dd>
    </div>)}</dl>
    {explanation.lines.punishment && <p>Variante dopo la mossa: {explanation.lines.punishment.san.slice(0, 8).join(' ')}.</p>}
    {explanation.lines.alternative && <p>Variante alternativa: {explanation.lines.alternative.san.slice(0, 8).join(' ')}.</p>}
    {explanation.limitations.map((text, index) => <p className="notice" key={index}>{text}</p>)}
  </section>
}
