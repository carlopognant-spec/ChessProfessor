import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { StockfishEngine } from '../lib/stockfish.js'

export default function EnginePanel({ onEngineData }) {
  const { fen } = useGame()
  const engineRef = useRef(null)
  const [evalData, setEvalData] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    engineRef.current = new StockfishEngine()
    return () => engineRef.current?.destroy()
  }, [])

  useEffect(() => {
    if (!engineRef.current) return
    let cancelled = false
    setAnalyzing(true)

    engineRef.current.analyze(fen, 16).then((data) => {
      if (cancelled) return
      setEvalData(data)
      onEngineData?.(data)
      setAnalyzing(false)
    })

    return () => { cancelled = true }
  }, [fen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Normalizza l'eval (centipedoni) su una barra 0-100, dal punto di vista del Bianco.
  const barPercent = evalData?.mate != null
    ? (evalData.mate > 0 ? 100 : 0)
    : Math.min(100, Math.max(0, 50 + (evalData?.evalCp ?? 0) / 10))

  return (
    <div>
      <div className="engine-bar">
        <div className="engine-bar-fill" style={{ width: `${barPercent}%` }} />
      </div>
      <p className="engine-eval-label">
        {analyzing && 'Stockfish sta analizzando…'}
        {!analyzing && evalData?.mate != null && `Matto in ${Math.abs(evalData.mate)}`}
        {!analyzing && evalData?.mate == null && evalData?.evalCp != null &&
          `Valutazione: ${(evalData.evalCp / 100).toFixed(2)}`}
      </p>
    </div>
  )
}
