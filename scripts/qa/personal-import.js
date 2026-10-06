import { Chess } from 'chess.js'
import { labels, fixtureMoves } from './compare.js'

const categories = new Map([...Object.values(labels), 'Forzata'].map(label => [label.toLowerCase(), label]))
const aliases = { migliroe: 'migliore', erroe: 'errore' }

export function parsePersonal(pgn, text, id) {
  const game = new Chess()
  game.loadPgn(pgn)
  const moves = game.history()
  const annotations = [], corrections = []
  let ply = 0
  const category = (tokens, currentPly) => {
    const raw = tokens.join(' ').toLowerCase()
    if (!raw) return null
    const normalized = aliases[raw] ?? raw
    const result = categories.get(normalized)
    if (!result) throw new Error(`${id}: categoria sconosciuta '${raw}', ply ${currentPly}`)
    if (raw !== normalized) corrections.push({ ply: currentPly, original: raw, normalized: result })
    return result
  }
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim())) {
    const match = line.trim().match(/^(\d+)\.\s+(.+)$/)
    if (!match || Number(match[1]) !== ply / 2 + 1) throw new Error(`${id}: numerazione non valida: ${line}`)
    const tokens = match[2].trim().split(/\s+/)
    const white = tokens.shift()
    if (white !== moves[ply]) throw new Error(`${id}: SAN non corrisponde al PGN, ply ${ply + 1}: ${white}`)
    const black = moves[ply + 1]
    const split = black == null ? tokens.length : tokens.indexOf(black)
    if (split < 0) throw new Error(`${id}: manca SAN ${black}, ply ${ply + 2}`)
    const whiteCategory = category(tokens.slice(0, split), ply + 1)
    if (whiteCategory) annotations.push({ ply: ply + 1, san: white, category: whiteCategory })
    ply++
    if (black != null) {
      const blackCategory = category(tokens.slice(split + 1), ply + 1)
      if (blackCategory) annotations.push({ ply: ply + 1, san: black, category: blackCategory })
      ply++
    }
  }
  if (ply !== moves.length) throw new Error(`${id}: lista mosse incompleta (${ply}/${moves.length})`)
  if (annotations.length && annotations.length !== moves.length) throw new Error(`${id}: annotazioni parziali (${annotations.length}/${moves.length})`)
  const headers = game.getHeaders()
  const fixture = { id, label: `${headers.White} vs ${headers.Black}, ${headers.Date}`, pgn, annotations, source: 'Annotazioni chess.com trascritte da Carlo', role: annotations.length ? 'development' : 'holdout-unannotated' }
  if (annotations.length) fixtureMoves(fixture)
  return { fixture, corrections, plies: moves.length, annotated: annotations.length > 0 }
}
