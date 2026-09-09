// Client per la Opening Explorer API di Lichess.
// Endpoint pubblico, nessuna chiave richiesta.
// Docs: https://lichess.org/api#tag/Opening-Explorer

const BASE_URL = 'https://explorer.lichess.ovh/lichess'

/**
 * Recupera nome apertura (ECO), statistiche e mosse più giocate per una posizione FEN.
 * @param {string} fen
 * @returns {Promise<{eco: string|null, name: string|null, moves: Array, white: number, draws: number, black: number} | null>}
 *          null se la posizione non ha dati (fuori teoria / troppo rara).
 */
export async function fetchOpeningData(fen) {
  const params = new URLSearchParams({
    variant: 'standard',
    fen,
    topGames: '0',
    recentGames: '0',
  })

  const res = await fetch(`${BASE_URL}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Lichess Opening Explorer ha risposto ${res.status}`)
  }

  const data = await res.json()

  const totalGames = (data.white ?? 0) + (data.draws ?? 0) + (data.black ?? 0)
  if (totalGames === 0) {
    // Posizione fuori dal database: nessuna statistica disponibile.
    return null
  }

  return {
    eco: data.opening?.eco ?? null,
    name: data.opening?.name ?? null,
    white: data.white ?? 0,
    draws: data.draws ?? 0,
    black: data.black ?? 0,
    moves: (data.moves ?? []).slice(0, 5).map((m) => ({
      san: m.san,
      white: m.white,
      draws: m.draws,
      black: m.black,
    })),
  }
}
