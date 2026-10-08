import React, { useMemo } from 'react'
import { getReviewedMove, MOVE_APPEARANCE } from '../lib/moveReviewPresentation.js'

function ClassificationIcon({ icon }) {
  return <g data-icon={icon} transform="translate(-1.65 -1.65) scale(0.165)" fill="#FFFFFF">
    {icon === 'book' && <>
      <path d="M0,2 Q5,0 9,3 V18 Q5,15 0,16 Z M11,3 Q15,0 20,2 V16 Q15,15 11,18 Z" />
      <path d="M10,3 V18" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
    </>}
    {icon === 'star' && <path d="M10,0 L13,6.5 L20,7.3 L15,12 L16.5,19 L10,15.5 L3.5,19 L5,12 L0,7.3 L7,6.5 Z" />}
    {icon === 'thumb' && <path d="M0,9 H3 V20 H0 Z M5,9 L9,5 L10,0 Q14,0 14,4 L13,8 H18 Q20,8 20,10 L18,18 Q17.5,20 15,20 H8 L5,18 Z" />}
    {icon === 'check' && <path d="M1,10 L7,16 L19,3" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinejoin="round" />}
    {icon === 'cross' && <path d="M3,3 L17,17 M17,3 L3,17" fill="none" stroke="#FFFFFF" strokeWidth="4.5" />}
  </g>
}

export default function MoveClassificationBadge({ entry, move }) {
  const square = useMemo(() => (move ?? getReviewedMove(entry))?.to ?? null, [entry, move])
  const style = MOVE_APPEARANCE[entry?.classification]
  if (!square || !style) return null
  const x = (square.charCodeAt(0) - 97 + 0.5) * 12.5 + 3.5
  const y = (8.5 - Number(square[1])) * 12.5 - 3.5
  const label = `${entry.playedMove}: ${style.label}`
  return (
    <svg className="move-classification-overlay" viewBox="0 0 100 100" role="img"
      aria-label={label} data-move-square={square} data-classification={entry.classification}>
      <title>{label}</title>
      <g transform={`translate(${x} ${y})`}>
        <circle r="2.4" fill={style.color} stroke="#000000" strokeOpacity="0.12" strokeWidth="0.12" />
        {style.icon ? <ClassificationIcon icon={style.icon} /> : <text textAnchor="middle" dominantBaseline="central" fill="#FFFFFF"
          fontFamily="Arial, sans-serif" fontWeight="900" fontSize={style.symbol.length > 1 ? '3' : '3.8'}>
          {style.symbol}
        </text>}
      </g>
    </svg>
  )
}
