import { Chess } from 'chess.js'

function validateBoard(boardFen) {
  const ranks = boardFen.split('/')
  if (ranks.length !== 8) throw new Error('FEN invalida: la scacchiera deve avere 8 traverse.')

  let whiteKings = 0
  let blackKings = 0
  for (const [rankIndex, rank] of ranks.entries()) {
    let files = 0
    for (const symbol of rank) {
      if (/\d/.test(symbol)) {
        files += Number(symbol)
        continue
      }
      if (!/[prnbqkPRNBQK]/.test(symbol)) {
        throw new Error('FEN invalida: pezzo sconosciuto.')
      }
      files += 1
      if (symbol === 'K') whiteKings += 1
      if (symbol === 'k') blackKings += 1
      if ((rankIndex === 0 || rankIndex === 7) && symbol.toLowerCase() === 'p') {
        throw new Error('Posizione invalida: un pedone non può stare sulla prima o ottava traversa.')
      }
    }
    if (files !== 8) throw new Error('FEN invalida: una traversa non contiene 8 case.')
  }

  if (whiteKings !== 1 || blackKings !== 1) {
    throw new Error('Posizione invalida: deve esserci esattamente un re per colore.')
  }
}

export function parseAndValidateFen(fen) {
  if (typeof fen !== 'string' || fen.trim().split(/\s+/).length !== 6) {
    throw new Error('FEN invalida: servono sei campi separati da spazi.')
  }

  const normalizedFen = fen.trim().replace(/\s+/g, ' ')
  const fields = normalizedFen.split(' ')
  validateBoard(fields[0])
  if (!/^[wb]$/.test(fields[1])) throw new Error('FEN invalida: lato al tratto non valido.')
  if (!/^(?:-|[KQkq]+)$/.test(fields[2])) throw new Error('FEN invalida: arrocco non valido.')
  if (!/^(?:-|[a-h][36])$/.test(fields[3])) throw new Error('FEN invalida: en passant non valido.')
  if (!/^\d+$/.test(fields[4]) || !/^\d+$/.test(fields[5])) throw new Error('FEN invalida: contatori non validi.')

  try {
    const game = new Chess(normalizedFen)
    const oppositeTurn = fields[1] === 'w' ? 'b' : 'w'
    const oppositeFen = [...fields]
    oppositeFen[1] = oppositeTurn
    if (new Chess(oppositeFen.join(' ')).isCheck()) {
      throw new Error('Posizione invalida: il lato non al tratto è sotto scacco.')
    }
    return { fen: game.fen() }
  } catch (error) {
    if (error.message.startsWith('Posizione invalida')) throw error
    throw new Error(`FEN invalida: ${error.message}`)
  }
}

export function exportFen(fen) {
  return parseAndValidateFen(fen).fen
}

export function setPieceAtFen(fen, square, piece = null) {
  if (!/^[a-h][1-8]$/.test(square)) throw new Error('Casa non valida.')
  if (piece !== null && !/^[prnbqkPRNBQK]$/.test(piece)) throw new Error('Pezzo non valido.')

  const fields = fen.trim().split(/\s+/)
  const board = fields[0].split('/').map((rank) => {
    const expanded = []
    for (const symbol of rank) {
      if (/\d/.test(symbol)) expanded.push(...Array(Number(symbol)).fill(null))
      else expanded.push(symbol)
    }
    return expanded
  })
  const file = square.charCodeAt(0) - 97
  const rank = 8 - Number(square[1])
  board[rank][file] = piece

  fields[0] = board.map((currentRank) => {
    let result = ''
    let empty = 0
    for (const symbol of currentRank) {
      if (!symbol) {
        empty += 1
      } else {
        if (empty) result += empty
        empty = 0
        result += symbol
      }
    }
    if (empty) result += empty
    return result
  }).join('/')

  return fields.join(' ')
}
