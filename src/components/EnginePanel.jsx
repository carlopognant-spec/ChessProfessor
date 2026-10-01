import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { formatMateLabel, normalizeEvalToWhite } from '../lib/evaluation.js'
import { StockfishEngine } from '../lib/stockfish.js'
import { analyzeGame, createGameAnalysisSession, buildAnalysisProgress } from '../lib/gameAnalysis.js'
import { ENGINE_CONFIG } from '../lib/engineConfig.js'
import { fetchOpeningExplorer } from '../lib/lichessExplorer.js'

export default function EnginePanel({ onEngineData, onAnalysisData }) {
  const { fen, moveHistorySan } = useGame()
  const engineRef = useRef(null)
  const analysisSessionRef = useRef(createGameAnalysisSession())
  const [evalData, setEvalData] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [engineError, setEngineError] = useState('')

  const fetchExplorerSafely = async (positionFen) => {
    try {
      return await fetchOpeningExplorer(positionFen)
    } catch {
      return null
    }
  }

  useEffect(() => {
    try {
      engineRef.current = new StockfishEngine()
      setEngineError('')
    } catch (error) {
      engineRef.current = null
      setEngineError(error.message)
    }
    return () => engineRef.current?.destroy()
  }, [])

  useEffect(() => {
    if (!engineRef.current) return
    const controller = new AbortController()
    let cancelled = false
    setAnalyzing(true)
    setProgress(0)

    const finish = (data) => {
      if (cancelled || !data) return
      const normalized = {
        ...data,
        evalCp: normalizeEvalToWhite(data?.evalCp),
      }
      setEvalData(normalized)
      onEngineData?.(normalized)
      setAnalyzing(false)
    }

    if (moveHistorySan.length > 0) {
      analyzeGame({
        moves: moveHistorySan,
        analyzePosition: (positionFen) => engineRef.current.analyze(
          positionFen,
          ENGINE_CONFIG.defaultDepth,
          ENGINE_CONFIG.multiPv,
        ),
        analyzePlayedPosition: (positionFen) => engineRef.current.analyze(
          positionFen,
          ENGINE_CONFIG.defaultDepth,
          ENGINE_CONFIG.multiPv,
        ),
        fetchExplorer: fetchExplorerSafely,
        session: analysisSessionRef.current,
        signal: controller.signal,
        onProgress: ({ current, total }) => setProgress(buildAnalysisProgress({ current, total })),
      })
        .then((entries) => {
          onAnalysisData?.(entries)
          finish(entries.at(-1)?.playedEngine ?? entries.at(-1)?.engine)
        })
        .catch((error) => {
          if (!cancelled) {
            setEngineError(error.message)
            setAnalyzing(false)
          }
        })

      return () => {
        cancelled = true
        controller.abort()
      }
    }

    engineRef.current.analyze(fen, ENGINE_CONFIG.defaultDepth, ENGINE_CONFIG.multiPv)
      .then(finish)
      .catch((error) => {
        if (!cancelled) {
          setEngineError(error.message)
          setAnalyzing(false)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [fen, moveHistorySan]) // eslint-disable-line react-hooks/exhaustive-deps

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
        {engineError && `Stockfish: ${engineError}`}
        {!engineError && !analyzing && evalData?.lines?.length > 0 &&
          `${evalData.lines.length} linee MultiPV disponibili. `}
        {analyzing && (moveHistorySan.length > 0
          ? `Analisi partita: ${Math.round(progress)}%`
          : 'Stockfish sta analizzando…')}
        {!analyzing && evalData?.mate != null && `Matto in ${Math.abs(evalData.mate)}`}
        {!analyzing && evalData?.mate == null && evalData?.evalCp != null &&
          `Valutazione: ${(evalData.evalCp / 100).toFixed(2)}`}
        {!analyzing && evalData?.mate == null && evalData?.evalCp == null && 'Nessuna valutazione disponibile.'}
        {!analyzing && evalData?.mate != null && evalData?.mate && <span> ({formatMateLabel(evalData.mate)})</span>}
      </p>
    </div>
  )
}
