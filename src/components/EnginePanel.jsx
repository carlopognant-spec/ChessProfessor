import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { formatMateLabel, normalizeEvalToWhite } from '../lib/evaluation.js'
import { StockfishEngine } from '../lib/stockfish.js'
import { analyzeGame, createGameAnalysisSession, buildAnalysisProgress } from '../lib/gameAnalysis.js'
import { ENGINE_CONFIG } from '../lib/engineConfig.js'
import { fetchOpeningExplorer } from '../lib/lichessExplorer.js'
import { resolveEngineForFen } from '../lib/analysisPresentation.js'

export default function EnginePanel({ onEngineData, onAnalysisData }) {
  const { fen, moveHistorySan } = useGame()
  const engineRef = useRef(null)
  const analysisSessionRef = useRef(createGameAnalysisSession())
  const analysisEntriesRef = useRef([])
  const fenRef = useRef(fen)
  const gameAnalyzingRef = useRef(false)
  const [evalData, setEvalData] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [engineError, setEngineError] = useState('')
  const [engineFailed, setEngineFailed] = useState(false)
  const [engineGeneration, setEngineGeneration] = useState(0)
  const onEngineDataRef = useRef(onEngineData)

  fenRef.current = fen
  onEngineDataRef.current = onEngineData

  const applyEngineData = useCallback((data, positionFen) => {
    if (!data || positionFen !== fenRef.current) return
    const normalized = {
      ...data,
      fen: positionFen,
      evalCp: normalizeEvalToWhite(data?.evalCp, positionFen.split(' ')[1] === 'b' ? 'black' : 'white'),
      mate: normalizeEvalToWhite(data?.mate, positionFen.split(' ')[1] === 'b' ? 'black' : 'white'),
    }
    setEvalData(normalized)
    onEngineData?.(normalized)
  }, [onEngineData])

  const fetchExplorerSafely = async (positionFen) => {
    try {
      return await fetchOpeningExplorer(positionFen)
    } catch {
      return null
    }
  }

  useEffect(() => {
    let engine = null
    let disposed = false
    const reportFailure = (error) => {
      if (disposed) return
      setEngineFailed(true)
      setEngineError(error.message)
      setAnalyzing(false)
      setEvalData(null)
      onEngineDataRef.current?.(null)
    }
    try {
      engine = new StockfishEngine({ onFailure: reportFailure })
      engineRef.current = engine
      setEngineFailed(false)
      setEngineError('')
    } catch (error) {
      engineRef.current = null
      reportFailure(error)
    }
    return () => {
      disposed = true
      engine?.destroy()
      if (engineRef.current === engine) engineRef.current = null
    }
  }, [engineGeneration])

  const analyzeCurrentPosition = useCallback((positionFen) => engineRef.current.analyze(
    positionFen,
    ENGINE_CONFIG.defaultDepth,
    ENGINE_CONFIG.multiPv,
  ), [])

  useEffect(() => {
    if (!engineRef.current || engineRef.current.failure) return

    analysisEntriesRef.current = []
    onAnalysisData?.([])
    setEngineError('')

    if (moveHistorySan.length === 0) {
      analysisSessionRef.current.clear()
      analysisEntriesRef.current = []
      onAnalysisData?.([])
      return
    }

    const controller = new AbortController()
    let cancelled = false
    gameAnalyzingRef.current = true
    setAnalyzing(true)
    setProgress(0)

    analyzeGame({
      moves: moveHistorySan,
      analyzePosition: analyzeCurrentPosition,
      analyzePlayedPosition: analyzeCurrentPosition,
      fetchExplorer: fetchExplorerSafely,
      session: analysisSessionRef.current,
      signal: controller.signal,
      onProgress: ({ current, total }) => {
        if (!cancelled) setProgress(buildAnalysisProgress({ current, total }))
      },
      onEntry: (_entry, results) => {
        if (cancelled) return
        analysisEntriesRef.current = results
        onAnalysisData?.(results)
        const cached = resolveEngineForFen(fenRef.current, results)
        if (cached) applyEngineData(cached, fenRef.current)
      },
    })
      .then((entries) => {
        if (cancelled) return
        analysisEntriesRef.current = entries
        onAnalysisData?.(entries)
        const cached = resolveEngineForFen(fenRef.current, entries)
        if (cached) applyEngineData(cached, fenRef.current)
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError') {
          setEngineError(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          gameAnalyzingRef.current = false
          setAnalyzing(false)
        }
      })

    return () => {
      cancelled = true
      gameAnalyzingRef.current = false
      controller.abort()
    }
  }, [moveHistorySan, applyEngineData, onAnalysisData, engineGeneration])

  useEffect(() => {
    if (!engineRef.current || engineRef.current.failure) return

    setEvalData(null)
    onEngineData?.(null)
    setEngineError('')

    if (moveHistorySan.length > 0) {
      const cached = resolveEngineForFen(fen, analysisEntriesRef.current)
      if (cached?.lines?.length) {
        applyEngineData(cached, fen)
        return
      }
      if (gameAnalyzingRef.current) return
    }

    let cancelled = false
    setAnalyzing(true)

    engineRef.current.analyze(fen, ENGINE_CONFIG.defaultDepth, ENGINE_CONFIG.multiPv)
      .then((data) => {
        if (!cancelled) applyEngineData(data, fen)
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError' && error?.message !== 'analysis superseded') {
          setEngineError(error.message)
        }
      })
      .finally(() => {
        if (!cancelled && !gameAnalyzingRef.current) setAnalyzing(false)
      })

    return () => {
      cancelled = true
    }
  }, [fen, moveHistorySan, applyEngineData, onEngineData, engineGeneration])

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
        {engineFailed && ' Il motore è fermo. Puoi riavviarlo senza perdere la partita.'}
        {!engineError && !analyzing && evalData?.lines?.length > 0 &&
          `${evalData.lines.length} linee MultiPV disponibili. `}
        {analyzing && (moveHistorySan.length > 0
          ? `Analisi partita: ${Math.round(progress)}%`
          : 'Stockfish sta analizzando…')}
        {!analyzing && evalData?.mate != null && (evalData.mate === 0 ? 'Scacco matto' : `Matto in ${Math.abs(evalData.mate)}`)}
        {!analyzing && evalData?.mate == null && evalData?.evalCp != null &&
          `Valutazione: ${(evalData.evalCp / 100).toFixed(2)}`}
        {!analyzing && evalData?.mate == null && evalData?.evalCp == null && 'Nessuna valutazione disponibile.'}
        {!analyzing && evalData?.mate != null && evalData?.mate && <span> ({formatMateLabel(evalData.mate)})</span>}
      </p>
      {engineFailed && (
        <button type="button" onClick={() => setEngineGeneration(generation => generation + 1)}>
          Riavvia motore
        </button>
      )}
    </div>
  )
}
