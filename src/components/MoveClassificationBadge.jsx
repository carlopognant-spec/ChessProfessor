import React, { useMemo } from 'react'
import { Chess } from 'chess.js'

const STYLES = {
  brilliant: { label: 'Geniale', symbol: '!!', color: '#26BFA5' },
  great: { label: 'Grande', symbol: '!', color: '#5C8FB5' },
  book: { label: 'Libro', symbol: '▤', color: '#B89674' },
  best: { label: 'Migliore', symbol: '★', color: '#81B64C' },
  excellent: { label: 'Ottima', symbol: '✓', color: '#81B64C' },
  good: { label: 'Buona', symbol: '✓', color: '#96AF8B' },
  inaccuracy: { label: 'Imprecisione', symbol: '?!', color: '#F7C631' },
  mistake: { label: 'Errore', symbol: '?', color: '#FFA459' },
  missed: { label: 'Mossa mancata', symbol: '×', color: '#EF6B65' },
  blunder: { label: 'Errore grave', symbol: '??', color: '#F24B43' },
  unclassified: { label: 'Non valutabile', symbol: '–', color: '#7D817F' },
}

export default function MoveClassificationBadge({ entry }) {
  const square = useMemo(() => {
    if (!entry) return null
    try { return new Chess(entry.fenBefore).move(entry.playedMove)?.to ?? null }
    catch { return null }
  }, [entry])
  const style = STYLES[entry?.classification]
  if (!square || !style) return null
  const x = (square.charCodeAt(0) - 97 + 0.5) * 12.5 + 3.5
  const y = (8.5 - Number(square[1])) * 12.5 - 3.5
  const label = `${entry.playedMove}: ${style.label}`
  return (
    <svg className="move-classification-overlay" viewBox="0 0 100 100" role="img"
      aria-label={label} data-move-square={square} data-classification={entry.classification}>
      <title>{label}</title>
      <g transform={`translate(${x} ${y})`}>
        <circle r="2.6" fill={style.color} stroke="#EDE6D6" strokeWidth="0.35" />
        <text textAnchor="middle" dominantBaseline="central" fill="#FFFFFF"
          fontFamily="Arial, sans-serif" fontWeight="800" fontSize={style.symbol.length > 1 ? '2.7' : '3.5'}>
          {style.symbol}
        </text>
      </g>
    </svg>
  )
}
