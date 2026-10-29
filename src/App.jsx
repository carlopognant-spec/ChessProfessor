import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { GameProvider, useGame } from './context/GameContext.jsx'
import Board from './components/Board.jsx'
import OpeningPanel from './components/OpeningPanel.jsx'
import EnginePanel from './components/EnginePanel.jsx'
import MoveList from './components/MoveList.jsx'
import UndoButton from './components/UndoButton.jsx'
import MoveNavigation from './components/MoveNavigation.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import AnalysisSummary from './components/AnalysisSummary.jsx'
import PositionEditor from './components/PositionEditor.jsx'
import GameArchive from './components/GameArchive.jsx'
import ReviewPracticePanel from './components/ReviewPracticePanel.jsx'
import { buildPracticeCandidates, prepareLegacyPracticeEntries } from './lib/reviewPractice.js'
import { archiveAnalysisStatus, describePgn } from './lib/gameArchive.js'
import { setPieceAtFen } from './lib/positionEditor.js'
import { getKeyboardNavigationTarget, resolveAnalysisEntryForPosition } from './lib/analysisPresentation.js'

const OpeningLibrary = lazy(() => import('./components/OpeningLibrary.jsx'))

function AppContent({ active = true }) {
  const { fen, moveHistorySan, navigationHistorySan, importPgn, resetGame, loadMoveSequence, exportPgn } = useGame()
  const [opening, setOpening] = useState(null)
  const [engineData, setEngineData] = useState(null)
  const [pgnInput, setPgnInput] = useState('')
  const [pgnError, setPgnError] = useState('')
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
  const practiceEntries = analysisEntries.length ? analysisEntries : archiveEntries.length ? archiveEntries : legacyPracticeEntries
  const startPractice = async ({ ply = null, side = practiceSide } = {}) => {
    const token = ++practiceLaunchRef.current
    setPracticeLaunching(true)
    setPracticeMessage('')
    try {
      const candidates = await buildPracticeCandidates({ pgn: exportPgn(), entries: practiceEntries, side, ply })
      if (token !== practiceLaunchRef.current) return
      if (!candidates.length) setPracticeMessage('Nessuna posizione candidata per questo colore. Completa prima l’analisi della partita.')
      else setPractice({ token, candidates })
    } catch (error) {
      if (token === practiceLaunchRef.current) setPracticeMessage(`Ripasso non disponibile: ${error.message}`)
    } finally {
      if (token === practiceLaunchRef.current) setPracticeLaunching(false)
    }
  }
  const [toolsOpen, setToolsOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const editing = toolsOpen && editorOpen

  useEffect(() => {
    setPositionDraft(fen)
  }, [fen])

  useEffect(() => {
    if (!active || practice) return
    const handleKeyDown = (event) => {
      const target = event.target
      if (target instanceof HTMLElement && (
        target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )) return

      const nextMoves = getKeyboardNavigationTarget(event.key, moveHistorySan.length, navigationHistorySan)
      if (!nextMoves) return
      event.preventDefault()
      loadMoveSequence(nextMoves)
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

  const handleImportPgn = () => {
    closePractice()
    try {
      const ok = importPgn(pgnInput)
      if (!ok) {
        setPgnError('PGN vuoto o non valido.')
        return
      }
      setPgnError('')
      setAnalysisEntries([])
      setArchiveEntries([])
      setEngineData(null)
      setSavedAnalysis(null)
      setLegacyPracticeEntries([])
    } catch (error) {
      setPgnError(error.message)
    }
  }

  const handleResetGame = () => {
    closePractice()
    resetGame()
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
    const entries = archiveAnalysisStatus(record) === 'current' ? record.analysisEntries : []
    setSavedAnalysis(entries.length ? { entries, moves: document.moves, baseFen: document.baseFen } : null)
    setAnalysisEntries(entries)
    setArchiveEntries(entries)
    // Old scores only select candidates; practice still requires fresh engine evidence.
    setLegacyPracticeEntries(entries.length ? entries : prepareLegacyPracticeEntries(record.analysisEntries ?? []))
    setEngineData(null)
    setPgnInput(record.pgn)
    setPgnError('')
    setGameGeneration(value => value + 1)
  }

  return (
    <main className="app-shell">
      <div className="panel workspace-panel">
        <div hidden={Boolean(practice)}>
        <Board
          editorPiece={editing ? editorPiece : null}
          displayFen={editing ? positionDraft : fen}
          onEditorSquare={handleEditorSquare}
          analysisEntries={analysisEntries}
          engineData={engineData}
        />
        </div>
        <div hidden={Boolean(practice)}>
          <EnginePanel key={gameGeneration} savedAnalysis={savedAnalysis} onEngineData={setEngineData}
            onAnalysisData={setAnalysisEntries} onAnalysisArchiveData={setArchiveEntries}
            practiceActive={Boolean(practice)} onPracticeEngine={setPracticeEngine} />
        </div>
        {practice && <ReviewPracticePanel key={practice.token} candidates={practice.candidates}
          engine={practiceEngine} onClose={closePractice} />}
        <div hidden={Boolean(practice)}>
        <div className="controls-row practice-launcher">
          <label>Il mio colore <select aria-label="Il mio colore" value={practiceSide} onChange={e => setPracticeSide(e.target.value)}>
            <option value="w">Bianco</option><option value="b">Nero</option>
          </select></label>
          <button disabled={practiceLaunching || !practiceEntries.length} onClick={() => startPractice()}>
            Ripassa i miei errori
          </button>
        </div>
        <p className="notice">Fino a cinque posizioni. Stockfish verifica gli errori prima del ripasso, anche dalle vecchie analisi.</p>
        {practiceMessage && <p role="status">{practiceMessage}</p>}
        <MoveNavigation />
        <details className="tools-menu" onToggle={event => {
          if (event.target === event.currentTarget) setToolsOpen(event.currentTarget.open)
        }}>
          <summary>Strumenti</summary>
          <details className="tools-section tools-editor" onToggle={event => {
            if (event.target === event.currentTarget) setEditorOpen(event.currentTarget.open)
          }}>
            <summary>Editor scacchiera</summary>
            <PositionEditor
              draft={positionDraft}
              onDraftChange={setPositionDraft}
              selectedPiece={editorPiece}
              onPieceSelect={setEditorPiece}
            />
          </details>
          <details className="tools-section tools-game">
            <summary>Partita e analisi</summary>
            <div className="pgn-import controls-row">
              <textarea
                value={pgnInput}
                onChange={(event) => setPgnInput(event.target.value)}
                rows={4}
                aria-label="PGN da importare"
                placeholder="Incolla un PGN, ad esempio: 1. e4 e5 2. Nf3 Nc6"
              />
              <button type="button" onClick={handleImportPgn}>Importa PGN</button>
              {pgnError && <p className="notice" role="status">{pgnError}</p>}
            </div>
            <AnalysisSummary entries={analysisEntries} onPractice={startPractice} />
            <MoveList />
            <div className="controls-row">
              <UndoButton />
              <button type="button" onClick={handleResetGame}>Reset partita</button>
            </div>
            <GameArchive getPgn={exportPgn} analysisEntries={archiveEntries} onOpen={handleOpenArchive} />
          </details>
          <details className="tools-section tools-openings">
            <summary>Aperture</summary>
            <OpeningPanel onOpeningData={setOpening} />
          </details>
          <details className="tools-section tools-chat">
            <summary>Chatbot</summary>
            <ChatPanel
              opening={opening}
              engineData={engineData}
              analysisEntry={resolveAnalysisEntryForPosition(fen, moveHistorySan, analysisEntries)}
            />
          </details>
        </details>
        </div>
      </div>
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
