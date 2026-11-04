export function evaluationBarState(data, fen, orientation) {
  const white = data?.mate != null
    ? (data.mate === 0 ? (fen.split(' ')[1] === 'b' ? 100 : 0) : data.mate > 0 ? 100 : 0)
    : Math.min(100, Math.max(0, 50 + (data?.evalCp ?? 0) / 10))
  return {
    bottomPercent: orientation === 'black' ? 100 - white : white,
    score: data?.mate != null ? `${data.mate < 0 || data.mate === 0 && fen.split(' ')[1] === 'w' ? '-' : ''}M${Math.abs(data.mate)}`
      : data?.evalCp != null ? (data.evalCp / 100).toFixed(1) : '—',
  }
}
