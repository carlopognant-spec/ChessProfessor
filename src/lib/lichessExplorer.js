const LICHESS_TOKEN = import.meta.env.VITE_LICHESS_TOKEN
const BASE_URL = 'https://explorer.lichess.ovh/lichess'

const DEFAULT_SPEEDS = ['blitz', 'rapid', 'classical']
const DEFAULT_RATINGS = [1600, 1800, 2000, 2200, 2500]

export async function fetchOpeningExplorer(
  fen,
  {
    speeds = DEFAULT_SPEEDS,
    ratings = DEFAULT_RATINGS,
    token = LICHESS_TOKEN,
    fetchImpl = fetch,
  } = {},
) {
  const params = new URLSearchParams({
    variant: 'standard',
    fen,
    speeds: speeds.join(','),
    ratings: ratings.join(','),
    topGames: '0',
    recentGames: '0',
  })

  const headers = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetchImpl(`${BASE_URL}?${params.toString()}`, {
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Lichess Explorer richiede un token valido. Configura VITE_LICHESS_TOKEN nel file .env.')
    }
    throw new Error(`Errore Opening Explorer: ${response.status}`)
  }

  return response.json()
}
