import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { GameProvider, useGame } from './context/GameContext.jsx'
import Board from './components/Board.jsx'
import OpeningPanel from './components/OpeningPanel.jsx'
import EnginePanel from './components/EnginePanel.jsx'
import UndoButton from './components/UndoButton.jsx'
import BoardOrientationControls from './components/BoardOrientationControls.jsx'
import MoveSound from './components/MoveSound.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import AnalysisSummary from './components/AnalysisSummary.jsx'
import PositionEditor from './components/PositionEditor.jsx'
import PgnImportDialog from './components/PgnImportDialog.jsx'
import GameArchive from './components/GameArchive.jsx'
import ReviewPracticePanel from './components/ReviewPracticePanel.jsx'
import { buildPracticeCandidates, prepareLegacyPracticeEntries } from './lib/reviewPractice.js'
import { archiveAnalysisStatus, createGameArchive, describePgn } from './lib/gameArchive.js'
import { reclassifyAnalysisMoves } from './lib/reviewMoves.js'
import { setPieceAtFen } from './lib/positionEditor.js'
import { getKeyboardNavigationTarget, resolveAnalysisEntryForPosition } from './lib/analysisPresentation.js'

const OpeningLibrary = lazy(() => import('./components/OpeningLibrary.jsx'))
// The editor implementation remains available for a future advanced entry point.
const EDITOR_AVAILABLE = false

function AppContent({ active = true }) {
  const { fen, moveHistorySan, navigationHistorySan, importPgn, resetGame, loadMoveSequence, exportPgn, isExploring, returnToGame, rapidNavigation } = useGame()
  const [opening, setOpening] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [evaluationHost, setEvaluationHost] = useState(null)
  const [engineData, setEngineData] = useState(null)
  const [pgnInput, setPgnInput] = useState('')
  const [pgnError, setPgnError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [archiveRevision, setArchiveRevision] = useState(0)
  const pendingFileImport = useRef(false)
  const [gameNotice, setGameNotice] = useState('')
  const gameTools = useRef(null)
  const leavePracticeDialog = useRef(null)
  const boardSection = useRef(null)
  const reviewSection = useRef(null)
  const [analysisEntries, setAnalysisEntries] = useState([])
  const [archiveEntries, setArchiveEntries] = useState([])
  const [editorPiece, setEditorPiece] = useState(null)
  const [positionDraft, setPositionDraft] = useState(fen)
  const [gameGeneration, setGameGeneration] = useState(0)
  const [savedAnalysis, setSavedAnalysis] = useState(null)
  const [legacyPracticeEntries, setLegacyPracticeEntries] = useState([])
  const [practice, setPractice] = useState(null)
  const [practiceEngine, setPracticeEngine] = useState(null)
  const [practiceSide, setPracticeSide] = useState('w')
  const [practiceMessage, setPracticeMessage] = useState('')
  const [practiceLaunching, setPracticeLaunching] = useState(false)
  const practiceLaunchRef = useRef(0)
  const closePractice = useCallback(() => {
    practiceLaunchRef.current++
    setPractice(null)
    setPracticeLaunching(false)
  }, [])
  useEffect(() => { closePractice() }, [active, navigationHistorySan, gameGeneration, closePractice])
  useEffect(() => {
    if (!active) { setImportOpen(false); leavePracticeDialog.current?.close() }
  }, [active])
  const practiceEntries = analysisEntries.length ? analysisEntries : archiveEntries.length ? archiveEntries : legacyPracticeEntries
  const startPractice = async ({ ply = null, side = practiceSide } = {}) => {
    const token = ++practiceLaunchRef.current
    setPracticeLaunching(true)
    setPracticeMessage('')
    try {
      const candidates = await buildPracticeCandidates({ pgn: exportPgn(), entries: practiceEntries, side, ply })
      if (token !== practiceLaunchRef.current) return
      if (!candidates.length) setPracticeMessage(practiceEntries.length < navigationHistorySan.length
        ? 'Analisi ancora incompleta: nessun errore ripassabile disponibile per questo colore.'
        : 'Nessun errore ripassabile per questo colore nell’analisi disponibile.')
      else setPractice({ token, candidates })
    } catch (error) {
      if (token === practiceLaunchRef.current) setPracticeMessage(`Ripasso non disponibile: ${error.message}`)
    } finally {
      if (token === practiceLaunchRef.current) setPracticeLaunching(false)
    }
  }
  const [toolsOpen, setToolsOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const editing = EDITOR_AVAILABLE && toolsOpen && editorOpen

  useEffect(() => {
    if (editing) setPositionDraft(fen)
  }, [fen, editing])

  useEffect(() => {
    if (!active || practice) return
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || boardSection.current?.querySelector('[data-dragging="true"]')) return
      const target = event.target
      if (target instanceof HTMLElement && (
        target.isContentEditable || target.closest('dialog[open]') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )) return

      const nextMoves = getKeyboardNavigationTarget(event.key, moveHistorySan.length, navigationHistorySan)
      if (!nextMoves) return
      event.preventDefault()
      loadMoveSequence(nextMoves, { rapid: event.repeat })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, practice, loadMoveSequence, moveHistorySan.length, navigationHistorySan])

  const handleEditorSquare = (square, piece = editorPiece) => {
    try {
      setPositionDraft(setPieceAtFen(positionDraft, square, piece))
    } catch (error) {
      setPgnError(error.message)
    }
  }

  const handleImportPgn = async (fromFile = false) => {
    setImporting(true)
    try {
      if (fromFile) {
        const archive = createGameArchive()
        try {
          const result = await archive.save({ pgn: pgnInput })
          handleOpenArchive(result.record)
          setArchiveRevision(value => value + 1)
          setGameNotice(result.duplicate ? 'Partita già presente, aperta.' : 'PGN importato e salvato.')
          finishImport()
        } finally { await archive.close() }
        return
      }
      const ok = importPgn(pgnInput)
      if (!ok) {
        setPgnError('PGN vuoto o non valido.')
        return
      }
      closePractice()
      setPgnError('')
      setGameNotice('Partita importata. La bozza PGN resta disponibile per ulteriori modifiche.')
      setAnalysisEntries([])
      setArchiveEntries([])
      setEngineData(null)
      setSavedAnalysis(null)
      setLegacyPracticeEntries([])
      finishImport()
    } catch (error) {
      setPgnError(`PGN non valido o importazione non disponibile: ${error.message}`)
    } finally { setImporting(false) }
  }

  const handleResetGame = () => {
    closePractice()
    resetGame()
    setPgnError('')
    setGameNotice('Partita attiva azzerata. Bozza PGN e partite salvate conservate.')
    setAnalysisEntries([])
    setArchiveEntries([])
    setEngineData(null)
    setSavedAnalysis(null)
    setLegacyPracticeEntries([])
  }

  const handleOpenArchive = record => {
    closePractice()
    const document = describePgn(record.pgn)
    if (!importPgn(record.pgn)) throw new Error('PGN salvato non valido.')
    const entries = archiveAnalysisStatus(record) === 'current' ? reclassifyAnalysisMoves(record.analysisEntries) : []
    setSavedAnalysis(entries.length ? { entries, moves: document.moves, baseFen: document.baseFen } : null)
    setAnalysisEntries(entries)
    setArchiveEntries(entries)
    // Old scores only select candidates; practice still requires fresh engine evidence.
    setLegacyPracticeEntries(entries.length ? entries : prepareLegacyPracticeEntries(record.analysisEntries ?? []))
    setEngineData(null)
    setGameNotice('Partita aperta dall’archivio.')
    setPgnInput(record.pgn)
    setPgnError('')
    setGameGeneration(value => value + 1)
  }

  const goTo = ref => {
    const target = ref === reviewSection ? ref.current?.querySelector('.selected-move') ?? ref.current : ref.current
    target?.scrollIntoView({ block: 'start' })
    target?.focus({ preventScroll: true })
  }
  const finishImport = () => {
    setImportOpen(false)
    requestAnimationFrame(() => {
      boardSection.current?.scrollIntoView({ block: 'start' })
      boardSection.current?.focus({ preventScroll: true })
    })
  }
  const importAction = <footer className="analysis-actions">
    <button type="button" onClick={() => setImportOpen(true)}>Importa partita</button>
  </footer>
  const heading = <header className="workspace-heading">
        <div><p className="eyebrow">ChessProfessor</p><h1>Analisi partita</h1>
          <p className="notice">Esplora le mosse. Comprendi le tue scelte.</p></div>
      </header>
  return (
    <main className="app-shell analysis-shell">
      <PgnImportDialog open={importOpen} draft={pgnInput} error={pgnError} busy={importing}
        onDraftChange={value => { setPgnInput(value); setPgnError('') }}
        onClose={() => setImportOpen(false)} onImport={fromFile => {
          if (practice) { pendingFileImport.current = fromFile; leavePracticeDialog.current.showModal() }
          else void handleImportPgn(fromFile)
        }} />
      <dialog ref={leavePracticeDialog} className="promotion-dialog" aria-labelledby="leave-practice-title">
        <h2 id="leave-practice-title">Aprire un’altra partita?</h2>
        <p>I progressi già salvati non verranno eliminati. Il tentativo corrente e il testo non inviato verranno lasciati.</p>
        <button type="button" autoFocus onClick={() => leavePracticeDialog.current.close()}>Continua la pratica</button>
        <button type="button" onClick={() => { leavePracticeDialog.current.close(); void handleImportPgn(pendingFileImport.current) }}>Conferma importazione</button>
      </dialog>
      {practice && heading}
      <div className="workspace-panel">
        <div hidden={Boolean(practice)}>
          <nav className="mobile-workspace-nav" aria-label="Scorciatoie analisi">
            <button type="button" onClick={() => goTo(boardSection)}>Vai alla scacchiera</button>
            <button type="button" onClick={() => goTo(reviewSection)}>Vai alla spiegazione</button>
          </nav>
          <div className="workspace-grid">
            {heading}
            <section className="panel board-column" aria-label="Posizione e navigazione" ref={boardSection} tabIndex={-1}>
              <Board editorPiece={editing ? editorPiece : null} displayFen={editing ? positionDraft : fen}
                onEditorSquare={handleEditorSquare} analysisEntries={analysisEntries} engineData={engineData}
                evaluationSlot={<div className="board-evaluation" ref={setEvaluationHost} />} />
              {isExploring && <div className="exploration-notice" role="status">
                <p>Continuazione ipotetica. PGN, risultato e analisi originali restano invariati.</p>
                <button type="button" onClick={returnToGame}>Torna alla partita</button>
              </div>}
            </section>
            <section className="panel review-column" aria-label="Analisi e spiegazioni" ref={reviewSection} tabIndex={-1}>
              <AnalysisSummary entries={analysisEntries} onPractice={startPractice} />
              <details className="board-settings"><summary>Vista e suoni</summary>
                <BoardOrientationControls />
                <MoveSound moves={moveHistorySan} timeline={navigationHistorySan} rapid={rapidNavigation} editing={editing} />
              </details>
              <details className="engine-workspace">
                <summary>Analisi e approfondimenti</summary>
                <EnginePanel key={gameGeneration} savedAnalysis={savedAnalysis} onEngineData={setEngineData}
                  onAnalysisData={setAnalysisEntries} onAnalysisArchiveData={setArchiveEntries}
                  practiceActive={Boolean(practice)} onPracticeEngine={setPracticeEngine} evaluationHost={evaluationHost} />
              </details>
              <section className="practice-workspace" aria-label="Ripasso della partita">
                <div className="controls-row practice-launcher">
                  <label>Il mio colore <select aria-label="Il mio colore" value={practiceSide} onChange={e => setPracticeSide(e.target.value)}>
                    <option value="w">Bianco</option><option value="b">Nero</option>
                  </select></label>
                  <button disabled={isExploring || practiceLaunching || !practiceEntries.length} onClick={() => startPractice()}>Ripassa i miei errori</button>
                </div>
                <p className="notice">Fino a cinque posizioni. Stockfish verifica gli errori prima del ripasso, anche dalle vecchie analisi.</p>
                {practiceMessage && <p role="status">{practiceMessage}</p>}
              </section>
              {!practice && importAction}
            </section>
          </div>
        </div>
        {practice && <ReviewPracticePanel key={practice.token} candidates={practice.candidates}
          engine={practiceEngine} onClose={closePractice} />}
        <div hidden={Boolean(practice)}>
          {gameNotice && <p className="game-notice" role="status">{gameNotice}</p>}
          <details className="tools-menu panel" open={toolsOpen} onToggle={event => {
            if (event.target === event.currentTarget) setToolsOpen(event.currentTarget.open)
          }}>
            <summary>Strumenti</summary>
            <details className="tools-section tools-game" ref={gameTools}>
              <summary>Partita e analisi</summary>
              <div className="game-tools-grid">
                <div>
                  <div className="controls-row"><UndoButton /><button type="button" onClick={handleResetGame}>Reset partita</button></div>
                  <p className="notice">Reset partita azzera la partita e l’analisi attive. Conserva la bozza PGN e l’archivio.</p>
                </div>
                <GameArchive getPgn={exportPgn} analysisEntries={archiveEntries} onOpen={handleOpenArchive} revision={archiveRevision} />
              </div>
            </details>
            <details hidden={!EDITOR_AVAILABLE} className="tools-section tools-editor" onToggle={event => {
              if (event.target === event.currentTarget) setEditorOpen(event.currentTarget.open)
            }}>
              <summary>Editor scacchiera</summary>
              <PositionEditor draft={positionDraft} onDraftChange={setPositionDraft}
                selectedPiece={editorPiece} onPieceSelect={setEditorPiece} />
            </details>
            <details className="tools-section tools-chat" onToggle={event => {
              if (event.target === event.currentTarget) setChatOpen(event.currentTarget.open)
            }}><summary>Chatbot</summary>
              {chatOpen && <details><summary>Contesto di apertura per la chat</summary><OpeningPanel onOpeningData={setOpening} /></details>}
              <ChatPanel opening={opening} engineData={engineData}
                analysisEntry={resolveAnalysisEntryForPosition(fen, moveHistorySan, analysisEntries)} />
            </details>
          </details>
        </div>
      </div>
      {practice && importAction}
    </main>
  )
}

export default function App() {
  const [section, setSection] = useState(() => window.location.hash === '#aperture' ? 'openings' : 'analysis')
  const [libraryVisited, setLibraryVisited] = useState(section === 'openings')
  useEffect(() => {
    const navigate = () => {
      const next = window.location.hash === '#aperture' ? 'openings' : 'analysis'
      setSection(next)
      if (next === 'openings') setLibraryVisited(true)
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  return (
    <GameProvider>
      <nav className="app-navigation" aria-label="Sezioni dell’app">
        <a href="#partita" aria-current={section === 'analysis' ? 'page' : undefined}>Partita e analisi</a>
        <a href="#aperture" aria-current={section === 'openings' ? 'page' : undefined}>Biblioteca aperture</a>
      </nav>
      <div hidden={section !== 'analysis'}><AppContent active={section === 'analysis'} /></div>
      {libraryVisited && <div hidden={section !== 'openings'}><Suspense fallback={<p className="notice">Caricamento biblioteca…</p>}><OpeningLibrary /></Suspense></div>}
    </GameProvider>
  )
}
