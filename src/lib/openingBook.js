// Ignore move counters, but preserve turn, castling and legal en-passant rights.
export function openingPositionKey(fen) {
  return fen.split(' ').slice(0, 4).join(' ')
}

export function createOpeningBook(positions = [], metadata = null) {
  const known = new Set(positions.map(openingPositionKey))
  return { hasPosition: (fen) => known.has(openingPositionKey(fen)), metadata }
}

let bookPromise

export function loadOpeningBook() {
  bookPromise ??= import('../data/openingPositions.json').then(({ default: data }) => {
    const { positions, ...metadata } = data
    return createOpeningBook(positions, metadata)
  })
  return bookPromise
}
