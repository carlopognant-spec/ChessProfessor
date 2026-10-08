import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { formatMateLabel, normalizeEvalToWhite } from '../lib/evaluation.js'
import { analyzeGame, createGameAnalysisSession, buildAnalysisProgress } from '../lib/gameAnalysis.js'
import { ENGINE_CONFIG } from '../lib/engineConfig.js'
import { resolveEngineForFen } from '../lib/analysisPresentation.js'
import { engineAssetsCached, prepareEngineCache } from '../lib/engineAssets.js'
import { analysisMetadataKey } from '../lib/analysisMetadata.js'

export default function EnginePanel({ onEngineData, onAnalysisData, savedAnalysis = null }) {
  const { fen, moveHistorySan, navigationHistorySan, baseFen } = useGame()
  const [useSaved, setUseSaved] = useState(true)
  const savedMatches = useSaved && savedAnalysis?.baseFen === baseFen
    && JSON.stringify(savedAnalysis.moves) === JSON.stringify(navigationHistorySan)
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
  const [analysisEnabled, setAnalysisEnabled] = useState(false)
  const [engineReady, setEngineReady] = useState(false)
  const [engineLoading, setEngineLoading] = useState(false)
  const [assetsCached, setAssetsCached] = useState(false)
  const [cacheNote, setCacheNote] = useState('')
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

  useEffect(() => {
    let disposed = false
    engineAssetsCached().then(cached => { if (!disposed) setAssetsCached(cached) })
    return () => { disposed = true }
  }, [])

  useEffect(() => {
    if (!analysisEnabled) return
    let engine = null
    let disposed = false
    const reportFailure = (error) => {
      if (disposed) return
      setEngineFailed(true)
      setEngineReady(false)
      setEngineLoading(false)
      setEngineError(error.message)
      setAnalyzing(false)
      setEvalData(null)
      onEngineDataRef.current?.(null)
    }
    setEngineReady(false)
    setEngineLoading(true)
    setEngineFailed(false)
    setEngineError('')
    Promise.all([import('../lib/stockfish.js'), prepareEngineCache()]).then(async ([{ StockfishEngine }, cache]) => {
      if (disposed) return
      setCacheNote(cache.note)
      engine = new StockfishEngine({ onFailure: reportFailure })
      engineRef.current = engine
      await engine.waitUntilReady()
      if (disposed) return
      setEngineLoading(false)
      setEngineReady(true)
      engineAssetsCached().then(cached => { if (!disposed) setAssetsCached(cached) })
    }).catch(reportFailure)
    return () => {
      disposed = true
      engine?.destroy()
      if (engineRef.current === engine) engineRef.current = null
    }
  }, [analysisEnabled, engineGeneration])

  const analyzeCurrentPosition = useCallback((positionFen) => engineRef.current.analyze(
    positionFen,
    ENGINE_CONFIG.nodes,
    ENGINE_CONFIG.multiPv,
  ), [])

  useEffect(() => {
    if (!savedMatches) {
      if (!engineReady) { onAnalysisData?.([]); setEvalData(null); onEngineData?.(null) }
      return
    }
    analysisEntriesRef.current = savedAnalysis.entries
    onAnalysisData?.(savedAnalysis.entries)
    setEvalData(null)
    onEngineData?.(null)
    const cached = resolveEngineForFen(fen, savedAnalysis.entries)
    if (cached) applyEngineData(cached, fen)
  }, [savedMatches, savedAnalysis, fen, engineReady, onAnalysisData, onEngineData, applyEngineData])

  useEffect(() => {
    if (savedMatches || !engineReady || !engineRef.current || engineRef.current.failure) return

    analysisEntriesRef.current = []
    onAnalysisData?.([])
    setEngineError('')

    if (navigationHistorySan.length === 0) {
      analysisSessionRef.current.clear()
      return
    }

    const controller = new AbortController()
    let cancelled = false
    gameAnalyzingRef.current = true
    setAnalyzing(true)
    setProgress(0)

    analyzeGame({
      moves: navigationHistorySan,
      baseFen,
      analyzePosition: analyzeCurrentPosition,
      analyzePlayedPosition: analyzeCurrentPosition,
      session: analysisSessionRef.current,
      analysisKey: analysisMetadataKey(),
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
  }, [navigationHistorySan, baseFen, savedMatches, applyEngineData, onAnalysisData, engineReady])

  useEffect(() => {
    if (savedMatches || !engineReady || !engineRef.current || engineRef.current.failure) return

    setEvalData(null)
    onEngineData?.(null)
    setEngineError('')

    if (navigationHistorySan.length > 0) {
      const cached = resolveEngineForFen(fen, analysisEntriesRef.current)
      if (cached?.lines?.length) {
        applyEngineData(cached, fen)
        return
      }
      if (gameAnalyzingRef.current) return
    }

    let cancelled = false
    setAnalyzing(true)

    engineRef.current.analyze(fen, ENGINE_CONFIG.nodes, ENGINE_CONFIG.multiPv)
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
  }, [fen, navigationHistorySan, savedMatches, applyEngineData, onEngineData, engineReady])

  const displayedData = evalData?.fen === fen ? evalData : null
  const barPercent = displayedData?.mate != null
    ? (displayedData.mate > 0 ? 100 : 0)
    : Math.min(100, Math.max(0, 50 + (displayedData?.evalCp ?? 0) / 10))

  return (
    <div>
      <div className="engine-bar">
        <div className="engine-bar-fill" style={{ width: `${barPercent}%` }} />
      </div>
      <p className="engine-eval-label" data-fen={displayedData?.fen}>
        {!analysisEnabled && (savedMatches ? 'Analisi salvata. ' : 'Analisi non avviata.')}
        {engineLoading && 'Caricamento di Stockfish…'}
        {engineError && `Stockfish: ${engineError}`}
        {engineFailed && ' Il motore è fermo. Puoi riavviarlo senza perdere la partita.'}
        {!engineError && !analyzing && displayedData?.lines?.length > 0 &&
          `${displayedData.lines.length} linee MultiPV disponibili. `}
        {analyzing && (moveHistorySan.length > 0
          ? `Analisi partita: ${Math.round(progress)}%`
          : 'Stockfish sta analizzando…')}
        {!analyzing && displayedData?.mate != null && (displayedData.mate === 0 ? 'Scacco matto' : `Matto in ${Math.abs(displayedData.mate)}`)}
        {!analyzing && displayedData?.mate == null && displayedData?.evalCp != null &&
          `Valutazione: ${(displayedData.evalCp / 100).toFixed(2)}`}
        {analysisEnabled && !engineLoading && !engineError && !analyzing && displayedData?.mate == null && displayedData?.evalCp == null && 'Nessuna valutazione disponibile.'}
        {!analyzing && displayedData?.mate != null && displayedData?.mate && <span> ({formatMateLabel(displayedData.mate)})</span>}
      </p>
      {!analysisEnabled && (
        <div>
          {!assetsCached && <p className="notice">La prima analisi scarica circa 100 MB. Il motore viene conservato nella cache di questo browser, se disponibile.</p>}
          <button type="button" onClick={() => { setUseSaved(false); setAnalysisEnabled(true) }}>Avvia analisi</button>
        </div>
      )}
      {cacheNote && <p className="notice">{cacheNote}</p>}
      {engineFailed && (
        <button type="button" onClick={() => {
          analysisSessionRef.current.clear()
          analysisEntriesRef.current = []
          onAnalysisData?.([])
          setEngineGeneration(generation => generation + 1)
        }}>
          Riavvia motore
        </button>
      )}
    </div>
  )
}
