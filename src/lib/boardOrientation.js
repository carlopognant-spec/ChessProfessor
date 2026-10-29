export const BOARD_VIEW_KEY = 'chessprofessor.board-view.v1'
const modes = ['auto', 'white', 'black']
const defaults = () => ({ mode: 'auto', playerName: '' })

export function readBoardView(storage) {
  try {
    const saved = JSON.parse((storage ?? globalThis.localStorage).getItem(BOARD_VIEW_KEY))
    return saved && modes.includes(saved.mode) && typeof saved.playerName === 'string' && saved.playerName.length <= 100
      ? { mode: saved.mode, playerName: saved.playerName } : defaults()
  } catch { return defaults() }
}

export function saveBoardView(view, storage) {
  try { (storage ?? globalThis.localStorage).setItem(BOARD_VIEW_KEY, JSON.stringify(view)); return true }
  catch { return false }
}

export function detectPlayerOrientation(headers = {}, playerName = '') {
  const normalize = name => typeof name === 'string' ? name.trim().normalize('NFC').toLowerCase() : ''
  const name = normalize(playerName)
  if (!name || ['?', '-', 'nn', 'anonymous'].includes(name)) return null
  const white = normalize(headers.White) === name, black = normalize(headers.Black) === name
  return white === black ? null : white ? 'white' : 'black'
}
