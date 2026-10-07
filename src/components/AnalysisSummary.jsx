import { buildAnalysisSummary } from '../lib/gameAnalysis.js'
import { useGame } from '../context/GameContext.jsx'
import { formatAnalysisScore, formatMateComparison } from '../lib/mateComparison.js'
import { formatMissedOpportunity } from '../lib/missedOpportunity.js'
import AccuracySummary from './AccuracySummary.jsx'

const CATEGORY_LABELS = {
  book: 'Libro',
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

export default function AnalysisSummary({ entries = [] }) {
  const { loadMoveSequence, navigationHistorySan } = useGame()
  if (entries.length === 0) return null

  const summary = buildAnalysisSummary(entries)

  return (
    <section className="analysis-summary" aria-label="Resoconto analisi">
      <h2>Resoconto partita</h2>
      <AccuracySummary entries={entries} totalPlies={navigationHistorySan.length} />
      <div className="summary-table" role="table" aria-label="Conteggi classificazioni">
        <div className="summary-row summary-header" role="row">
          <span>Categoria</span>
          <span>Bianco</span>
          <span>Nero</span>
        </div>
        {summary.categories.map((category) => (
          <div className="summary-row" role="row" key={category.key}>
            <span>{CATEGORY_LABELS[category.key]}</span>
            <span>{category.white}</span>
            <span>{category.black}</span>
          </div>
        ))}
      </div>
      <div className="analysis-rows" aria-label="Semimosse analizzate">
        {summary.rows.map((row) => (
          <button
            type="button"
            className="analysis-row-button"
            key={row.ply}
            onClick={() => loadMoveSequence(row.moveHistorySan ?? [])}
            title="Vai alla posizione prima della mossa"
          >
            <span>{row.label}</span>
            <span>{CATEGORY_LABELS[row.classification] ?? 'Non classificata'}</span>
            <span>
              {formatAnalysisScore(row.playedEval, row.playedMate, { delivered: row.playedMate === 0 })}
              {row.bestEval != null || row.bestMate != null ? ` / Migliore: ${formatAnalysisScore(row.bestEval, row.bestMate)}` : ''}
              {row.mateComparison && <small className="mate-distance-note" title="Distanze confrontate dalla posizione prima della mossa">{formatMateComparison(row.mateComparison)}</small>}
              {row.missedOpportunity && <small className="mate-distance-note">{formatMissedOpportunity(row.missedOpportunity)}</small>}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
