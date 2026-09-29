import { Chess } from 'chess.js'

function sideName(color) {
  return color === 'w' ? 'white' : 'black'
}

export function getPositionFacts(fen) {
  const game = new Chess(fen)
  const pieces = game.board().flat().filter(Boolean)
  const facts = {
    pawns: { white: { count: 0, files: [] }, black: { count: 0, files: [] } },
    kings: { white: { square: null, inCheck: false }, black: { square: null, inCheck: false } },
    development: {
      white: { minorPiecesDeveloped: 0, piecesOffBackRank: 0 },
      black: { minorPiecesDeveloped: 0, piecesOffBackRank: 0 },
    },
    kingSafety: { sideToMove: sideName(game.turn()), sideToMoveInCheck: game.isCheck() },
  }

  for (const piece of pieces) {
    const side = sideName(piece.color)
    if (piece.type === 'p') {
      facts.pawns[side].count += 1
      facts.pawns[side].files.push(piece.square[0])
    }
    if (piece.type === 'k') {
      facts.kings[side].square = piece.square
    }
    if (piece.type === 'n' || piece.type === 'b') {
      const homeRank = piece.color === 'w' ? '1' : '8'
      if (piece.square[1] !== homeRank) facts.development[side].minorPiecesDeveloped += 1
    }
    if (piece.type !== 'p' && piece.type !== 'k') {
      const homeRank = piece.color === 'w' ? '1' : '8'
      if (piece.square[1] !== homeRank) facts.development[side].piecesOffBackRank += 1
    }
  }

  facts.kings.white.inCheck = game.isAttacked(facts.kings.white.square, 'b')
  facts.kings.black.inCheck = game.isAttacked(facts.kings.black.square, 'w')
  return facts
}