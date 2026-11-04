import { memo, useMemo, useState } from 'react'
import { buildAnalysisSummary } from '../lib/gameAnalysis.js'
import { useGame } from '../context/GameContext.jsx'
import { formatAnalysisScore, formatMateComparison } from '../lib/mateComparison.js'
import { formatMoveOpportunity } from '../lib/moveOpportunities.js'
import { formatSpecialAssessment } from '../lib/analysisSpecialClassification.js'
import { formatEvaluationEvidence } from '../lib/reviewEvaluation.js'
import AccuracySummary from './AccuracySummary.jsx'
import ClassificationDetails from './ClassificationDetails.jsx'
import MoveList from './MoveList.jsx'
import MoveNavigation from './MoveNavigation.jsx'
import MoveExplanation from './MoveExplanation.jsx'

const CATEGORY_LABELS = {
  book: 'Libro',
  forced: 'Forzata',
  brilliant: 'Geniale',
  great: 'Grande',
  best: 'Migliore',
  excellent: 'Ottima',
  good: 'Buona',
  inaccuracy: 'Imprecisione',
  mistake: 'Errore',
  blunder: 'Errore grave',
  missed: 'Mossa mancata',
  unclassified: 'Non valutabile',
}

const Totals = memo(function Totals({ entries, totalPlies, categories }) {
  return <details className="game-totals">
    <summary>Resoconto partita e precisione</summary>
    <AccuracySummary entries={entries} totalPlies={totalPlies} />
    <table className="summary-table" aria-label="Conteggi classificazioni">
      <thead><tr className="summary-row"><th scope="col">Categoria</th><th scope="col">Bianco</th><th scope="col">Nero</th></tr></thead>
      <tbody>{categories.map(category => <tr className="summary-row" key={category.key}>
        <th scope="row">{CATEGORY_LABELS[category.key]}</th><td>{category.white}</td><td>{category.black}</td>
      </tr>)}</tbody>
    </table>
  </details>
})

function Traceability({ row }) {
  const [open, setOpen] = useState(false)
  return <details className="traceability" onToggle={event => { if (event.target === event.currentTarget) setOpen(event.currentTarget.open) }}><summary>Tracciabilità dell’analisi</summary>
    {open && <>
            <div className="selected-move-score">
            <span>
              {formatAnalysisScore(row.playedEval, row.playedMate, { delivered: row.playedMate === 0 })}
              {row.bestEval != null || row.bestMate != null ? ` / Migliore: ${formatAnalysisScore(row.bestEval, row.bestMate)}` : ''}
              {row.mateComparison && <small className="mate-distance-note" title="Distanze confrontate dalla posizione prima della mossa">{formatMateComparison(row.mateComparison)}</small>}
              {row.missedOpportunity && <small className="mate-distance-note">{formatMoveOpportunity(row.missedOpportunity)}</small>}
              {formatSpecialAssessment(row) && <small className="mate-distance-note">{formatSpecialAssessment(row)}</small>}
              {row.moveFacts?.forced && <small className="mate-distance-note">Unica mossa legale nella posizione.</small>}
              {row.moveFacts?.book && row.numericalClassification && <small className="mate-distance-note">Libro · Valutazione: {CATEGORY_LABELS[row.numericalClassification]}</small>}
              {formatEvaluationEvidence(row) && <small className="mate-distance-note">{formatEvaluationEvidence(row)}</small>}
              {row.refinementComparison?.examined && <small className="mate-distance-note">
                Iniziale: {CATEGORY_LABELS[row.refinementComparison.initialClassification]} ({formatAnalysisScore(row.refinementComparison.initialEval, row.refinementComparison.initialMate, { delivered: row.refinementComparison.initialMate === 0 })})
                {' → '}Approfondita: {CATEGORY_LABELS[row.refinementComparison.refinedClassification]} ({formatAnalysisScore(row.refinementComparison.refinedEval, row.refinementComparison.refinedMate, { delivered: row.refinementComparison.refinedMate === 0 })})
                {row.refinementComparison.changed ? ' · Valutazione aggiornata.' : ' · Valutazione invariata.'}
              </small>}
              {row.refinementComparison?.rootComparisonChoice && <small className="mate-distance-note">
                Confronto iniziale più profondo conservato.
              </small>}
            </span>
            </div>
            <ClassificationDetails entry={row} labels={CATEGORY_LABELS} />
    </>}
  </details>
}

export default function AnalysisSummary({ entries = [], onPractice }) {
  const { fen, moveHistorySan, analysisHistorySan, isExploring, rapidNavigation } = useGame()
  const summary = useMemo(() => buildAnalysisSummary(entries), [entries])
  const row = !isExploring && summary.rows.find(entry => entry.ply === moveHistorySan.length && entry.fenAfter === fen)
  return <section className="analysis-summary" aria-label="Resoconto analisi">
        <section className="selected-move" aria-label="Mossa selezionata" tabIndex={-1}>
          {row ? <div key={row.ply}>
            <h3>{row.label} · {CATEGORY_LABELS[row.classification] ?? 'Non classificata'}</h3>

            {rapidNavigation ? <p className="notice">Navigazione in corso…</p> : <MoveExplanation entry={row} />}
            {onPractice && ['mistake', 'blunder', 'missed'].includes(row.classification) &&
              <button type="button" onClick={() => onPractice({ ply: row.ply, side: row.side })}>Riprova posizione {row.ply}</button>}
            {!rapidNavigation && <Traceability row={row} />}
          </div> : <div className="explanation-empty"><h2>{moveHistorySan.length === 0 ? 'Posizione iniziale' : 'Mossa selezionata'}</h2>
            <p className="notice">{isExploring ? 'Continuazione ipotetica: nessuna classificazione della partita originale viene applicata alle nuove mosse.' : moveHistorySan.length === 0 ? 'Scegli una mossa della partita per scoprirne le idee.' : 'Avvia o completa l’analisi per leggere la spiegazione di questa mossa.'}</p></div>}
        </section>
        <h2 className="notation-heading">Partita</h2>
        <MoveList entries={entries} />
        <MoveNavigation />
        {entries.length > 0 && <Totals entries={entries} totalPlies={analysisHistorySan.length} categories={summary.categories} />}
  </section>
}
