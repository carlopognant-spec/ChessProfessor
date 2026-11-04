import { useMemo, useState } from 'react'
import { annotateClassification, explainClassification, replayNumericalDecision } from '../lib/classificationDecision.js'
import MoveExplanation from './MoveExplanation.jsx'

const sources = { coherent: 'Confronto coerente tra varianti della stessa ricerca.', independent: 'Analisi separate: giudizio indicativo.',
  conflicting: 'Valutazioni discordanti: giudizio provvisorio.', unavailable: 'Evidenze insufficienti.', terminal: 'Esito terminale verificato sulla scacchiera.' }

export default function ClassificationDetails({ entry, labels }) {
  const [showData, setShowData] = useState(false)
  const [showChess, setShowChess] = useState(false)
  const displayed = useMemo(() => entry.classificationDecision?.classification === entry.classification
    ? entry : annotateClassification(entry), [entry])
  const decision = displayed.classificationDecision, policy = decision?.policy
  const replay = useMemo(() => replayNumericalDecision(decision), [decision])
  const origin = entry.classificationOrigin
  return <details className="classification-details">
    <summary>Perché questa classificazione?</summary>
    <p>{explainClassification(displayed)}</p>
    <p>{sources[decision?.evidence?.status] ?? 'Affidabilità del confronto non registrata.'}</p>
    {policy?.thresholds && <p>Fasce dell’indice locale, in punti percentuali: {Object.entries(policy.thresholds)
      .map(([category, limit]) => `${labels[category] ?? category} fino a ${limit}`).join('; ')}; Errore grave oltre {policy.thresholds.mistake}.</p>}
    <p>Criteri utilizzati: {policy?.version ?? 'non registrati'} · {policy?.numericalVersion ?? 'versione numerica sconosciuta'}
      {' · '}{policy?.reviewVersion ?? 'versione del confronto sconosciuta'}
      {decision?.reasons?.specialPolicy ? ` · ${decision.reasons.specialPolicy}` : ''}.</p>
    <p>Storia della partita: {decision?.evidence?.historyMode === 'game-history' ? 'inclusa nelle ricerche'
      : decision?.evidence?.historyMode === 'fen-only' ? 'assente, ricerche dalla sola FEN' : 'non documentata'}.</p>
    {origin && <p>Etichetta originaria: {labels[origin.classification] ?? origin.classification ?? 'sconosciuta'}.
      {origin.policy ? ` Criteri originali: ${origin.policy.version}.` : ' I criteri originali non erano registrati.'}</p>}
    <p>{replay.status === 'reproduced' ? 'Il giudizio numerico si riproduce dai dati e dai criteri registrati.'
      : replay.status === 'mismatch' ? 'Il giudizio registrato non coincide con la riproduzione numerica: richiede una verifica.'
        : 'La riproduzione numerica non certifica questa regola o questa versione.'}</p>
    {[entry.classification, entry.numericalClassification].some(label => ['inaccuracy', 'mistake', 'blunder', 'missed'].includes(label)) &&
      <details onToggle={event => { if (event.target === event.currentTarget) setShowChess(event.currentTarget.open) }}>
        <summary>Spiegazione scacchistica</summary>
        {showChess && <MoveExplanation entry={entry} />}
      </details>}
    <details onToggle={event => { if (event.target === event.currentTarget) setShowData(event.currentTarget.open) }}>
      <summary>Dati e criteri per la riproduzione</summary>
      {showData && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(decision, null, 2)}</pre>}
    </details>
  </details>
}
