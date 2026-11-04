import React, { useMemo } from 'react'
import { buildMoveExplanation } from '../lib/moveExplanation.js'
import './MoveExplanation.css'

const fields = [
  ['why', 'La mossa'],
  ['opportunity', 'Occasione'],
  ['punishment', 'Risposta dell’avversario'],
  ['alternative', 'Alternativa'],
]

export default function MoveExplanation({ entry }) {
  const explanation = useMemo(() => buildMoveExplanation(entry), [entry])
  const visibleFields = fields.filter(([key]) => explanation[key])
  if (!visibleFields.length) return null
  const variants = [
    explanation.punishment && explanation.lines.punishment,
    explanation.alternative && explanation.lines.alternative,
  ].filter(Boolean)
  return <section className="move-explanation" aria-label="Spiegazione scacchistica" tabIndex={0}>
    <dl>{visibleFields.map(([key, label]) => <div key={key}>
      <dt><strong>{label}</strong></dt><dd>{explanation[key]}</dd>
    </div>)}</dl>
    {variants.length > 0 && <details className="explanation-variants"><summary>Varianti del motore</summary>
      {variants.map(line => <p key={line.uci.join(' ')}>{line.san.join(' ')}.</p>)}
    </details>}
  </section>
}
