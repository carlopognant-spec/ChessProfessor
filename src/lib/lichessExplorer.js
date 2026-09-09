const LICHESS_TOKEN = import.meta.env.VITE_LICHESS_TOKEN
const BASE_URL = 'https://explorer.lichess.ovh/lichess'

const DEFAULT_SPEEDS = ['blitz', 'rapid', 'classical']
const DEFAULT_RATINGS = [1600, 1800, 2000, 2200, 2500]

export async function fetchOpeningExplorer(fen, { speeds = DEFAULT_SPEEDS, ratings = DEFAULT_RATINGS } = {}) {
  if (!LICHESS_TOKEN) {
    throw new Error('VITE_LICHESS_TOKEN non impostato: crea il token su lichess.org/account/oauth/token e aggiungilo al file .env')
  }

  const params = new URLSearchParams({
    variant: 'standard',
    fen,
    speeds: speeds.join(','),
    ratings: ratings.join(','),
    topGames: '0',
    recentGames: '0',
  })

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${LICHESS_TOKEN}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token Lichess non valido o mancante (401 Unauthorized).')
    }
    throw new Error(`Errore Opening Explorer: ${response.status}`)
  }

  return response.json()
}
