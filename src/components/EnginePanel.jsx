import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { normalizeEvalToWhite } from '../lib/evaluation.js'
import { analyzeGame, createGameAnalysisSession, buildAnalysisProgress } from '../lib/gameAnalysis.js'
import { ENGINE_CONFIG } from '../lib/engineConfig.js'
import { resolveEngineForFen } from '../lib/analysisPresentation.js'
import { engineAssetsCached, prepareEngineCache } from '../lib/engineAssets.js'
import { analysisMetadataKey } from '../lib/analysisMetadata.js'
import { displaySpecialMoves } from '../lib/analysisSpecialClassification.js'
import { createRefinementWorkerClient } from '../lib/refinementWorkerClient.js'
import { historyFromSan } from '../lib/analysisHistory.js'
import { createPracticeEngineSession } from '../lib/practiceEngineSession.js'
import { evaluationBarState } from '../lib/evaluationBar.js'

export default function EnginePanel({ onEngineData, onAnalysisData, onAnalysisArchiveData, savedAnalysis = null,
  practiceActive = false, onPracticeEngine, evaluationHost = null }) {
  const { fen, analysisHistorySan: navigationHistorySan, moveHistorySan, baseFen, isExploring, boardOrientation } = useGame()
  const [useSaved, setUseSaved] = useState(true)
  const savedMatches = useSaved && savedAnalysis?.baseFen === baseFen
    && JSON.stringify(savedAnalysis.moves) === JSON.stringify(navigationHistorySan)
  const savedEntries = useMemo(() => savedAnalysis?.entries ?? [], [savedAnalysis?.entries])
  const engineRef = useRef(null)
  const analysisSessionRef = useRef(createGameAnalysisSession())
  const analysisEntriesRef = useRef([])
  const fenRef = useRef(fen)
  const gameAnalyzingRef = useRef(false)
  const gameControllerRef = useRef(null)
  const positionControllerRef = useRef(null)
  const [analysisPaused, setAnalysisPaused] = useState(false)
  const [evalData, setEvalData] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [engineError, setEngineError] = useState('')
  const [engineFailed, setEngineFailed] = useState(false)
  const [engineGeneration, setEngineGeneration] = useState(0)
  const [analysisEnabled, setAnalysisEnabled] = useState(false)
  const [engineReady, setEngineReady] = useState(false)
  const practiceActiveRef = useRef(practiceActive)
  const engineReadyRef = useRef(engineReady)
  practiceActiveRef.current = practiceActive
  engineReadyRef.current = engineReady
  const practiceEngine = useMemo(() => createPracticeEngineSession({
    getEngine: () => engineRef.current,
    isActive: () => practiceActiveRef.current,
    isReady: () => engineReadyRef.current,
  }), [])
  const [engineLoading, setEngineLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [assetsCached, setAssetsCached] = useState(false)
  const [cacheNote, setCacheNote] = useState('')
  const onEngineDataRef = useRef(onEngineData)
  const [experimentalSpecials, setExperimentalSpecials] = useState(true)
  const [rawEntries, setRawEntries] = useState([])
  const [showRefined, setShowRefined] = useState(false)
  const showRefinedRef = useRef(showRefined)
  showRefinedRef.current = showRefined
  const [refinementJob, setRefinementJob] = useState(null)
  const refinementJobRef = useRef(refinementJob)
  refinementJobRef.current = refinementJob
  const [refinementWorking, setRefinementWorking] = useState(false)
  const [refinementProgress, setRefinementProgress] = useState(null)
  const [refinementNote, setRefinementNote] = useState('')
  const refinementControllerRef = useRef(null)
  const refinementWorker = useMemo(() => createRefinementWorkerClient(), [])
  const refinedViewRef = useRef(null)
  const pendingViewsRef = useRef(new WeakMap())
  const applyEngineDataRef = useRef(null)
  const [refinementPlan, setRefinementPlan] = useState(null)
  const [hasRefinements, setHasRefinements] = useState(false)
  const currentView = useCallback(entries => showRefinedRef.current && refinedViewRef.current?.entries === entries
    ? refinedViewRef.current.view : entries, [])
  const preserveOnRestartRef = useRef(false)
  const savedSourceRef = useRef(null)
  const signature = JSON.stringify([baseFen, navigationHistorySan])
  const signatureRef = useRef(signature)
  signatureRef.current = signature
  const experimentalSpecialsRef = useRef(experimentalSpecials)
  experimentalSpecialsRef.current = experimentalSpecials
  const publishAnalysis = useCallback((entries, refined = null) => {
    if (refined) refinedViewRef.current = { entries, view: refined }
    setRawEntries(entries)
    onAnalysisArchiveData?.(entries)
    const emit = view => {
      const initial = displaySpecialMoves(entries, experimentalSpecialsRef.current)
      const displayed = displaySpecialMoves(view, experimentalSpecialsRef.current)
      onAnalysisData?.(displayed.map((entry, i) => entry.refinementComparison
        ? { ...entry, refinementComparison: { ...entry.refinementComparison,
          initialClassification: initial[i].classification, refinedClassification: entry.classification,
          changed: initial[i].classification !== entry.classification
            || entry.refinementComparison.initialEval !== entry.refinementComparison.refinedEval
            || entry.refinementComparison.initialMate !== entry.refinementComparison.refinedMate } }
        : entry))
    }
    emit(currentView(entries))
    if (!showRefinedRef.current || refinedViewRef.current?.entries === entries || !entries.length) return
    // One projection per immutable snapshot, shared by publication, toggles and navigation.
    if (pendingViewsRef.current.has(entries)) return
    const signature = signatureRef.current
    const request = refinementWorker.view(entries)
    pendingViewsRef.current.set(entries, request)
    request.then(view => {
      if (signature !== signatureRef.current || entries !== analysisEntriesRef.current) return
      refinedViewRef.current = { entries, view }
      if (!showRefinedRef.current) return
      emit(view)
      const cached = resolveEngineForFen(fenRef.current, view)
      if (cached) applyEngineDataRef.current?.(cached, fenRef.current)
    }).catch(error => {
      if (error.name !== 'AbortError' && signature === signatureRef.current) setRefinementNote(error.message)
    }).finally(() => pendingViewsRef.current.delete(entries))
  }, [onAnalysisData, onAnalysisArchiveData, currentView, refinementWorker])

  useEffect(() => () => refinementWorker.destroy(), [refinementWorker])

  useEffect(() => {
    if (refinementJob || isExploring) return
    let active = true
    if (!rawEntries.length || rawEntries.length !== navigationHistorySan.length) {
      setRefinementPlan(null); setHasRefinements(false)
      return
    }
    setRefinementPlan(null)
    refinementWorker.inspect(rawEntries).then(result => {
      if (active) { setRefinementPlan(result.plan); setHasRefinements(result.hasRefinements) }
    }).catch(error => { if (active && error.name !== 'AbortError') setRefinementNote(error.message) })
    return () => { active = false }
  }, [rawEntries, navigationHistorySan.length, refinementJob, refinementWorker, isExploring])

  useEffect(() => {
    refinementControllerRef.current?.abort()
    refinementWorker.cancel()
    if (refinementControllerRef.current) engineRef.current?.cancel()
    refinementControllerRef.current = null
    setRefinementJob(null)
    setRefinementWorking(false)
    setRefinementProgress(null)
    setRefinementNote('')
    setShowRefined(false)
    showRefinedRef.current = false
    savedSourceRef.current = null
    refinedViewRef.current = null
    preserveOnRestartRef.current = false
    setAnalysisPaused(false)
    setProgress(0)
    analysisEntriesRef.current = []
    publishAnalysis([])
  }, [navigationHistorySan, baseFen, publishAnalysis, refinementWorker])

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
  applyEngineDataRef.current = applyEngineData

  useEffect(() => {
    if (!practiceActive) return
    gameControllerRef.current?.abort()
    gameControllerRef.current = null
    positionControllerRef.current?.abort()
    positionControllerRef.current = null
    refinementControllerRef.current?.abort()
    refinementControllerRef.current = null
    setRefinementJob(null)
    setRefinementWorking(false)
    gameAnalyzingRef.current = false
    engineRef.current?.cancel()
    setAnalyzing(false)
    setAnalysisPaused(true)
    setAnalysisEnabled(true)
    return () => practiceEngine.cancel()
  }, [practiceActive, practiceEngine])

  const restartPracticeEngine = useCallback(() => setEngineGeneration(value => value + 1), [])
  useEffect(() => {
    onPracticeEngine?.({ ...practiceEngine, ready: practiceActive && engineReady && !engineFailed,
      loading: engineLoading, error: engineFailed ? engineError : '', message: loadingPhase,
      restart: restartPracticeEngine })
  }, [practiceEngine, practiceActive, engineReady, engineFailed, engineLoading, engineError, loadingPhase,
    restartPracticeEngine, onPracticeEngine])
  useEffect(() => () => { practiceEngine.cancel(); onPracticeEngine?.(null) }, [practiceEngine, onPracticeEngine])

  useEffect(() => {
    publishAnalysis(analysisEntriesRef.current)
    const view = currentView(analysisEntriesRef.current)
    const cached = resolveEngineForFen(fenRef.current, view)
    if (cached) applyEngineData(cached, fenRef.current)
  }, [experimentalSpecials, showRefined, publishAnalysis, applyEngineData, currentView])

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
      if (refinementControllerRef.current || refinementJobRef.current) {
        preserveOnRestartRef.current = true
        refinementControllerRef.current?.abort()
        refinementControllerRef.current = null
        setRefinementJob(null)
        setRefinementWorking(false)
        setRefinementNote(`Approfondimento fermato: ${error.message}. L'analisi iniziale e i risultati già completati sono conservati.`)
      }
      gameControllerRef.current?.abort()
      gameControllerRef.current = null
      positionControllerRef.current?.abort()
      positionControllerRef.current = null
      gameAnalyzingRef.current = false
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
    setLoadingPhase('Preparazione della cache del motore…')
    setEngineFailed(false)
    setEngineError('')
    Promise.all([import('../lib/stockfish.js'), prepareEngineCache()]).then(async ([{ StockfishEngine }, cache]) => {
      if (disposed) return
      setCacheNote(cache.note)
      setLoadingPhase('Caricamento e inizializzazione di Stockfish…')
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

  useEffect(() => {
    if (practiceActive || !refinementJob?.plan || (refinementJob.plan.positions.length+refinementJob.plan.extraSearches>0&&(!engineReady||engineFailed))) return
    if (refinementJob.signature !== signatureRef.current) { setRefinementJob(null); return }
    const controller = refinementControllerRef.current
    if (!controller || controller.signal.aborted) return
    setRefinementWorking(true)
    setRefinementNote('')
    refinementWorker.run(refinementJob.entries, refinementJob.plan, { signal: controller.signal,
      analyzePosition: (positionFen, nodes, multiPv, options) => engineRef.current.analyze(positionFen, nodes, multiPv, options),
      onProgress: value => { if (!controller.signal.aborted) setRefinementProgress(value) },
      onEntries: entries => {
        if (controller.signal.aborted || refinementJob.signature !== signatureRef.current) return
        analysisEntriesRef.current = entries
        publishAnalysis(entries)
      },
    }).then(result => {
      if (controller.signal.aborted || refinementJob.signature !== signatureRef.current) return
      analysisEntriesRef.current = result.entries
      const refined = result.refined
      const changes = refined.filter(e => e.refinementComparison?.initialClassification !== e.refinementComparison?.refinedClassification).length
      showRefinedRef.current = true
      setShowRefined(true)
      publishAnalysis(result.entries, refined)
      const cached = resolveEngineForFen(fenRef.current, refined)
      if (cached) applyEngineData(cached, fenRef.current)
      setRefinementNote(`Approfondimento completato: ${result.selectedPlies.length} mosse, ${changes} etichette cambiate. Puoi confrontare entrambe le analisi.`)
    }).catch(error => {
      if (!controller.signal.aborted && error.name !== 'AbortError') setRefinementNote(`Approfondimento fermato: ${error.message}. L'analisi iniziale è conservata.`)
    }).finally(() => {
      if (refinementControllerRef.current !== controller) return
      refinementControllerRef.current = null
      setRefinementWorking(false)
      setRefinementJob(null)
    })
    return () => {
      controller.abort()
      if (refinementControllerRef.current === controller) {
        refinementControllerRef.current = null
        engineRef.current?.cancel()
        setRefinementWorking(false)
      }
    }
  }, [practiceActive, refinementJob, engineReady, engineFailed, publishAnalysis, applyEngineData, refinementWorker])

  useEffect(() => {
    if (!isExploring) return
    gameControllerRef.current?.abort()
    gameControllerRef.current = null
    positionControllerRef.current?.abort()
    positionControllerRef.current = null
    refinementControllerRef.current?.abort()
    refinementControllerRef.current = null
    refinementWorker.cancel()
    engineRef.current?.cancel()
    gameAnalyzingRef.current = false
    setRefinementJob(null); setRefinementWorking(false)
    setAnalyzing(false); setAnalysisPaused(true)
  }, [isExploring, refinementWorker])

  useEffect(() => {
    if (!savedMatches) {
      if (!engineReady && !analysisEntriesRef.current.length) { publishAnalysis([]); setEvalData(null); onEngineData?.(null) }
      return
    }
    if (savedSourceRef.current !== savedEntries) {
      savedSourceRef.current = savedEntries
      analysisEntriesRef.current = savedEntries
      publishAnalysis(savedEntries)
    }
    setEvalData(null)
    onEngineData?.(null)
    const cached = resolveEngineForFen(fen, currentView(analysisEntriesRef.current))
    if (cached) applyEngineData(cached, fen)
  }, [savedMatches, savedEntries, fen, engineReady, publishAnalysis, onEngineData, applyEngineData, currentView])

  useEffect(() => {
    if (isExploring || practiceActive || savedMatches || analysisPaused || !engineReady || !engineRef.current || engineRef.current.failure) return
    if (preserveOnRestartRef.current && analysisEntriesRef.current.length === navigationHistorySan.length) {
      preserveOnRestartRef.current = false
      return
    }

    setEngineError('')

    if (navigationHistorySan.length === 0) {
      analysisSessionRef.current.clear()
      return
    }

    const controller = new AbortController()
    const engine = engineRef.current
    const gameSignature = signatureRef.current
    const isActive = () => gameControllerRef.current === controller
      && !controller.signal.aborted && gameSignature === signatureRef.current
    const analyzePosition = (positionFen, options) => engine.analyze(positionFen, ENGINE_CONFIG.nodes, ENGINE_CONFIG.multiPv, options)
    gameControllerRef.current = controller
    gameAnalyzingRef.current = true
    setAnalyzing(true)
    setProgress(buildAnalysisProgress({ current: analysisEntriesRef.current.length, total: navigationHistorySan.length }))

    analyzeGame({
      moves: navigationHistorySan,
      baseFen,
      analyzePosition,
      analyzePlayedPosition: analyzePosition,
      session: analysisSessionRef.current,
      analysisKey: analysisMetadataKey(),
      historyAware: true,
      signal: controller.signal,
      onProgress: ({ current, total }) => {
        if (isActive()) setProgress(value => Math.max(value, buildAnalysisProgress({ current, total })))
      },
      onEntry: (_entry, results) => {
        if (!isActive() || results.length < analysisEntriesRef.current.length) return
        analysisEntriesRef.current = results
        publishAnalysis(results)
        const cached = resolveEngineForFen(fenRef.current, results)
        if (cached) applyEngineData(cached, fenRef.current)
      },
    })
      .then((entries) => {
        if (!isActive()) return
        analysisEntriesRef.current = entries
        publishAnalysis(entries)
        const cached = resolveEngineForFen(fenRef.current, entries)
        if (cached) applyEngineData(cached, fenRef.current)
      })
      .catch((error) => {
        if (isActive() && error?.name !== 'AbortError') {
          setEngineError(error.message)
        }
      })
      .finally(() => {
        if (isActive()) {
          gameControllerRef.current = null
          gameAnalyzingRef.current = false
          setAnalyzing(false)
        }
      })

    return () => {
      controller.abort()
      if (gameControllerRef.current === controller) {
        gameControllerRef.current = null
        gameAnalyzingRef.current = false
        engine.cancel()
      }
    }
  }, [isExploring, practiceActive, navigationHistorySan, baseFen, savedMatches, analysisPaused, applyEngineData, publishAnalysis, engineReady])

  useEffect(() => {
    if (isExploring || practiceActive || savedMatches || !engineReady || !engineRef.current || engineRef.current.failure) return

    setEvalData(null)
    onEngineData?.(null)
    setEngineError('')

    if (navigationHistorySan.length > 0) {
      const cached = resolveEngineForFen(fen, currentView(analysisEntriesRef.current))
      if (cached?.lines?.length) {
        applyEngineData(cached, fen)
        return
      }
      if (gameAnalyzingRef.current || refinementControllerRef.current) return
    }

    if (analysisPaused || refinementControllerRef.current) return
    const controller = new AbortController()
    const engine = engineRef.current
    positionControllerRef.current = controller
    const isActive = () => positionControllerRef.current === controller && !controller.signal.aborted
    setAnalyzing(true)

    engine.analyze(fen, ENGINE_CONFIG.nodes, ENGINE_CONFIG.multiPv, { history: historyFromSan(baseFen, moveHistorySan) })
      .then((data) => {
        if (isActive()) applyEngineData(data, fen)
      })
      .catch((error) => {
        if (isActive() && error?.name !== 'AbortError' && error?.message !== 'analysis superseded') {
          setEngineError(error.message)
        }
      })
      .finally(() => {
        if (isActive()) {
          positionControllerRef.current = null
          if (!gameAnalyzingRef.current) setAnalyzing(false)
        }
      })

    return () => {
      controller.abort()
      if (positionControllerRef.current === controller) {
        positionControllerRef.current = null
        engine.cancel()
      }
    }
  }, [isExploring, practiceActive, fen, baseFen, moveHistorySan, navigationHistorySan, savedMatches, analysisPaused, applyEngineData, onEngineData, engineReady, currentView])

  const interruptAnalysis = () => {
    gameControllerRef.current?.abort()
    gameControllerRef.current = null
    positionControllerRef.current?.abort()
    positionControllerRef.current = null
    gameAnalyzingRef.current = false
    engineRef.current?.cancel()
    setAnalysisPaused(true)
    setAnalyzing(false)
    if (engineLoading) {
      setAnalysisEnabled(false)
      setEngineLoading(false)
    }
  }

  async function startRefinement(options, emptyMessage, preparedPlan = null) {
    if (refinementJobRef.current || gameAnalyzingRef.current || positionControllerRef.current) return
    const controller = new AbortController()
    const job = { entries: analysisEntriesRef.current, signature: signatureRef.current, plan: null }
    // Lock before asynchronous planning so repeated clicks cannot queue another session.
    refinementJobRef.current = job
    refinementControllerRef.current = controller
    setRefinementJob(job)
    setRefinementProgress(null)
    setRefinementNote('')
    try {
      const plan = preparedPlan ?? await refinementWorker.plan(job.entries, options, controller.signal)
      if (controller.signal.aborted || refinementJobRef.current !== job || signatureRef.current !== job.signature) return
      if (!plan.selectedPlies.length) {
        refinementControllerRef.current = null
        refinementJobRef.current = null
        setRefinementJob(null)
        setRefinementNote(emptyMessage)
        return
      }
      const ready = { ...job, plan }
      setRefinementProgress({ current: 0, total: plan.positions.length + plan.extraSearches })
      refinementJobRef.current = ready
      setRefinementJob(ready)
      if (plan.positions.length + plan.extraSearches > 0) setAnalysisEnabled(true)
    } catch (error) {
      if (controller.signal.aborted || refinementJobRef.current !== job) return
      refinementControllerRef.current = null
      refinementJobRef.current = null
      setRefinementJob(null)
      setRefinementNote(error.message)
    }
  }

  const displayedData = !isExploring && evalData?.fen === fen ? evalData : null
  const gameAnalyzing = analyzing && gameAnalyzingRef.current
  const bar = evaluationBarState(displayedData, fen, boardOrientation)

  const evaluationBar = <div className="engine-bar" role="img" data-orientation={boardOrientation}
    aria-label={`Valutazione della posizione: ${displayedData ? bar.score : 'non disponibile'}; positivo per il Bianco, negativo per il Nero`}>
    <div className="engine-bar-fill" style={{ height: `${bar.bottomPercent}%` }} />
    <span className="engine-bar-score">{bar.score}</span>
  </div>
  return (
    <div className="engine-controls" aria-busy={engineLoading || analyzing || refinementWorking}>
      {evaluationHost ? createPortal(evaluationBar, evaluationHost) : evaluationBar}
      <p className="engine-eval-label" data-fen={displayedData?.fen} role="status" aria-atomic="true">
        {!analysisEnabled && !analysisPaused && (savedMatches
          ? (savedEntries[0]?.engine?.history ? 'Analisi salvata. ' : 'Analisi salvata senza storia della partita. Ricalcola per includere le ripetizioni. ')
          : 'Analisi non avviata.')}
        {engineLoading && loadingPhase}
        {engineError && `Stockfish: ${engineError}`}
        {engineFailed && ' Il motore è fermo. Puoi riavviarlo senza perdere la partita.'}
        {analyzing && (gameAnalyzing
          ? `Analisi partita: ${Math.round(progress)}%`
          : 'Stockfish sta analizzando…')}
        {analysisEnabled && !engineLoading && !engineError && !analyzing && displayedData?.mate == null && displayedData?.evalCp == null && 'Nessuna valutazione disponibile.'}
      </p>
      {gameAnalyzing && <progress aria-label="Avanzamento analisi partita" max="100" value={progress} />}
      {isExploring && <p role="status">Continuazione ipotetica: analisi automatica sospesa. La partita originale è conservata.</p>}
      {analysisPaused && !isExploring && <p role="status">Analisi interrotta. {analysisEntriesRef.current.length}/{navigationHistorySan.length} semimosse completate; i risultati sono conservati.</p>}
      {(analyzing || engineLoading) && !refinementJob && <button type="button" onClick={interruptAnalysis}>Interrompi analisi</button>}
      {analysisPaused && !isExploring && !engineFailed && !engineLoading && <button type="button" onClick={() => {
        if (savedMatches) setUseSaved(false)
        setAnalysisPaused(false)
        setAnalysisEnabled(true)
      }}>Riprendi analisi</button>}
      {!analysisEnabled && !analysisPaused && (
        <div>
          {!assetsCached && <p className="notice">La prima analisi scarica circa 100 MB. Il motore viene conservato nella cache di questo browser, se disponibile.</p>}
          <button type="button" disabled={isExploring} onClick={() => { setUseSaved(false); setAnalysisEnabled(true) }}>Avvia analisi</button>
        </div>
      )}
      {cacheNote && <p className="notice">{cacheNote}</p>}
      {!refinementPlan && !refinementJob && rawEntries.length > 0 && rawEntries.length === navigationHistorySan.length
        && <p role="status">Preparazione delle verifiche…</p>}
      {(refinementPlan || refinementJob || refinementNote) && <div className="analysis-refinement">
        <button type="button" disabled={isExploring || analyzing || refinementJob !== null || engineFailed || !refinementPlan?.selectedPlies.length}
          onClick={() => startRefinement({}, 'Nessuna mossa dubbia da approfondire.', refinementPlan)}>
          Approfondisci le mosse dubbie{refinementPlan?.selectedPlies.length ? ` (${refinementPlan.selectedPlies.length})` : ''}
        </button>
        <details className="advanced-analysis"><summary>Verifiche avanzate</summary>
        {experimentalSpecials && hasRefinements && <button type="button"
          disabled={isExploring || analyzing || refinementJob !== null || engineFailed || !refinementPlan}
          onClick={() => startRefinement({ grandeOnly: true }, 'Nessuna Grande da verificare con i dati attuali.')}>Verifica le Grandi</button>}
        {experimentalSpecials && <button type="button"
          disabled={isExploring || analyzing || refinementJob !== null || engineFailed || !refinementPlan}
          onClick={() => startRefinement({ sacrificeOnly: true }, 'Nessun sacrificio da verificare con i dati attuali.')}>Verifica i sacrifici</button>}
        {experimentalSpecials && <button type="button"
          disabled={isExploring || analyzing || refinementJob !== null || engineFailed || !refinementPlan}
          onClick={() => startRefinement({ criticalOnly: true }, 'Nessuna nuova scelta decisiva da verificare con i dati attuali.')}>Verifica le scelte decisive</button>}
        </details>
        <p className="notice">Analisi più lenta, fino a 12 mosse e 4 verifiche dei sacrifici per richiesta. L'analisi iniziale resta disponibile.</p>
        {refinementJob && <p role="status">{refinementWorking
          ? `Approfondimento: ${refinementProgress?.current ?? 0}/${refinementProgress?.total ?? 0} ricerche.`
          : 'Preparazione dell’approfondimento…'}</p>}
        {refinementJob && <button type="button" onClick={() => {
          refinementControllerRef.current?.abort()
          refinementWorker.cancel()
          if (refinementControllerRef.current) engineRef.current?.cancel()
          refinementControllerRef.current = null
          refinementJobRef.current = null
          setRefinementJob(null)
          setRefinementWorking(false)
          setRefinementNote('Approfondimento interrotto. L’analisi iniziale e i risultati già completati sono conservati.')
        }}>Interrompi approfondimento</button>}
        {refinementNote && <p role="status">{refinementNote}</p>}
        {hasRefinements && <label><input type="checkbox" checked={showRefined} onChange={e => setShowRefined(e.target.checked)} />Mostra analisi approfondita</label>}
      </div>}
      <details className="analysis-display-options"><summary>Opzioni di visualizzazione</summary>
      <label>
        <input type="checkbox" checked={experimentalSpecials} onChange={event => setExperimentalSpecials(event.target.checked)} />
        Mostra Grande e Geniale sperimentali
      </label>
      {experimentalSpecials && <p className="notice">Criteri locali ancora in verifica. Le etichette possono differire dalla Game Review.</p>}
      </details>
      {engineFailed && (
        <button type="button" onClick={() => {
          setEngineGeneration(generation => generation + 1)
        }}>
          Riavvia motore
        </button>
      )}
    </div>
  )
}
