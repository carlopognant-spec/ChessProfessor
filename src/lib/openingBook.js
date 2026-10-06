// Ignore move counters, but preserve turn, castling and legal en-passant rights.
export function openingPositionKey(fen) {
  return fen.split(' ').slice(0, 4).join(' ')
}

export function createOpeningBook(positions = []) {
  const known = new Set(positions.map(openingPositionKey))
  return { hasPosition: (fen) => known.has(openingPositionKey(fen)) }
}

let bookPromise

export function loadOpeningBook() {
  bookPromise ??= import('../data/openingPositions.json').then(({ default: data }) => (
    createOpeningBook(data.positions)
  ))
  return bookPromise
}
