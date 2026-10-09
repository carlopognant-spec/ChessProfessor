import { Chess } from 'chess.js'

// Display colors only: these do not participate in move classification.
export const MOVE_APPEARANCE = {
  forced: { label: 'Forzata', symbol: '=', color: '#7D91A5', light: '#C6D1DC', dark: '#879BAF' },
  brilliant: { label: 'Geniale', symbol: '!!', color: '#1BBF9F', light: '#8CD6BE', dark: '#4AAF89' },
  great: { label: 'Grande', symbol: '!', color: '#749BBF', light: '#A2C5C1', dark: '#769B8C' },
  book: { label: 'Libro', icon: 'book', color: '#D0A17B', light: '#E2CAAA', dark: '#C1A07A' },
  best: { label: 'Migliore', icon: 'star', color: '#81B64C', light: '#C5D9A4', dark: '#86B360' },
  excellent: { label: 'Ottima', icon: 'thumb', color: '#81B64C', light: '#C5D9A4', dark: '#86B360' },
  good: { label: 'Buona', icon: 'check', color: '#96B56F', light: '#CBDCAC', dark: '#98B57A' },
  inaccuracy: { label: 'Imprecisione', symbol: '?!', color: '#F7C631', light: '#DDCD63', dark: '#B8AA42' },
  mistake: { label: 'Errore', symbol: '?', color: '#FFA459', light: '#E2C08A', dark: '#BA9956' },
  missed: { label: 'Mossa mancata', icon: 'cross', color: '#FF776B', light: '#E6AC8B', dark: '#BA885E' },
  blunder: { label: 'Errore grave', symbol: '??', color: '#FF3F37', light: '#F29685', dark: '#BA6A3B' },
  unclassified: { label: 'Non valutabile', symbol: '–', color: '#7D817F', light: '#C9CDCA', dark: '#8B918D' },
}

export function getReviewedMove(entry) {
  if (!entry) return null
  try { return new Chess(entry.fenBefore).move(entry.playedMove) }
  catch { return null }
}

export function getReviewSquareStyles(entry, move = getReviewedMove(entry)) {
  const style = MOVE_APPEARANCE[entry?.classification]
  if (!style || !move) return {}
  return Object.fromEntries([move.from, move.to].map(square => {
    const light = (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 0
    return [square, { backgroundColor: light ? style.light : style.dark }]
  }))
}
