import { buildAnalysisSummary } from '../lib/gameAnalysis.js'
import { useGame } from '../context/GameContext.jsx'

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
}

export default function AnalysisSummary({ entries = [] }) {
  const { loadMoveSequence } = useGame()
  if (entries.length === 0) return null

  const summary = buildAnalysisSummary(entries)

  return (
    <section className="analysis-summary" aria-label="Resoconto analisi">
      <h2>Resoconto partita</h2>
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
              {row.playedEval != null ? `Eval ${(row.playedEval / 100).toFixed(2)}` : 'Eval n/d'}
              {row.bestEval != null ? ` / Best ${(row.bestEval / 100).toFixed(2)}` : ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
