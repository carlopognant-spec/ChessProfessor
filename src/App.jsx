import { useEffect, useState } from 'react'
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
import { archiveAnalysisStatus, describePgn } from './lib/gameArchive.js'
import { setPieceAtFen } from './lib/positionEditor.js'
import { getKeyboardNavigationTarget, resolveAnalysisEntryForPosition } from './lib/analysisPresentation.js'

function AppContent() {
  const { fen, moveHistorySan, navigationHistorySan, importPgn, resetGame, loadMoveSequence, exportPgn } = useGame()
  const [opening, setOpening] = useState(null)
  const [engineData, setEngineData] = useState(null)
  const [pgnInput, setPgnInput] = useState('')
  const [pgnError, setPgnError] = useState('')
  const [analysisEntries, setAnalysisEntries] = useState([])
  const [editorPiece, setEditorPiece] = useState(null)
  const [positionDraft, setPositionDraft] = useState(fen)
  const [gameGeneration, setGameGeneration] = useState(0)
  const [savedAnalysis, setSavedAnalysis] = useState(null)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const editing = toolsOpen && editorOpen

  useEffect(() => {
    setPositionDraft(fen)
  }, [fen])

  useEffect(() => {
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
  }, [loadMoveSequence, moveHistorySan.length, navigationHistorySan])

  const handleEditorSquare = (square, piece = editorPiece) => {
    try {
      setPositionDraft(setPieceAtFen(positionDraft, square, piece))
    } catch (error) {
      setPgnError(error.message)
    }
  }

  const handleImportPgn = () => {
    try {
      const ok = importPgn(pgnInput)
      if (!ok) {
        setPgnError('PGN vuoto o non valido.')
        return
      }
      setPgnError('')
      setAnalysisEntries([])
      setEngineData(null)
      setSavedAnalysis(null)
    } catch (error) {
      setPgnError(error.message)
    }
  }

  const handleResetGame = () => {
    resetGame()
    setAnalysisEntries([])
    setEngineData(null)
    setSavedAnalysis(null)
  }

  const handleOpenArchive = record => {
    const document = describePgn(record.pgn)
    if (!importPgn(record.pgn)) throw new Error('PGN salvato non valido.')
    const entries = archiveAnalysisStatus(record) === 'current' ? record.analysisEntries : []
    setSavedAnalysis(entries.length ? { entries, moves: document.moves, baseFen: document.baseFen } : null)
    setAnalysisEntries(entries)
    setEngineData(null)
    setPgnInput(record.pgn)
    setPgnError('')
    setGameGeneration(value => value + 1)
  }

  return (
    <main className="app-shell">
      <div className="panel workspace-panel">
        <Board
          editorPiece={editing ? editorPiece : null}
          displayFen={editing ? positionDraft : fen}
          onEditorSquare={handleEditorSquare}
          analysisEntries={analysisEntries}
          engineData={engineData}
        />
        <EnginePanel key={gameGeneration} savedAnalysis={savedAnalysis} onEngineData={setEngineData} onAnalysisData={setAnalysisEntries} />
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
            <AnalysisSummary entries={analysisEntries} />
            <MoveList />
            <div className="controls-row">
              <UndoButton />
              <button type="button" onClick={handleResetGame}>Reset partita</button>
            </div>
            <GameArchive getPgn={exportPgn} analysisEntries={analysisEntries} onOpen={handleOpenArchive} />
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
    </main>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}
