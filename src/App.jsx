import { useEffect, useState } from 'react'
import { GameProvider, useGame } from './context/GameContext.jsx'
import Board from './components/Board.jsx'
import OpeningPanel from './components/OpeningPanel.jsx'
import EnginePanel from './components/EnginePanel.jsx'
import MoveList from './components/MoveList.jsx'
import UndoButton from './components/UndoButton.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import AnalysisSummary from './components/AnalysisSummary.jsx'
import PositionEditor from './components/PositionEditor.jsx'
import { setPieceAtFen } from './lib/positionEditor.js'
import { getKeyboardNavigationTarget } from './lib/analysisPresentation.js'

function AppContent() {
  const { fen, moveHistorySan, navigationHistorySan, importPgn, resetGame, loadFen, loadMoveSequence } = useGame()
  const [opening, setOpening] = useState(null)
  const [engineData, setEngineData] = useState(null)
  const [pgnInput, setPgnInput] = useState('')
  const [pgnError, setPgnError] = useState('')
  const [analysisEntries, setAnalysisEntries] = useState([])
  const [editorPiece, setEditorPiece] = useState(null)
  const [positionDraft, setPositionDraft] = useState(fen)

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
    } catch (error) {
      setPgnError(error.message)
    }
  }

  const handleResetGame = () => {
    resetGame()
    setAnalysisEntries([])
    setEngineData(null)
  }

  return (
    <div className="app-shell">
      <div className="panel">
        <OpeningPanel onOpeningData={setOpening} />
        <Board
          editorPiece={editorPiece}
          displayFen={positionDraft}
          onEditorSquare={handleEditorSquare}
          analysisEntries={analysisEntries}
          engineData={engineData}
        />
        <PositionEditor
          draft={positionDraft}
          onDraftChange={setPositionDraft}
          selectedPiece={editorPiece}
          onPieceSelect={setEditorPiece}
        />
        <EnginePanel onEngineData={setEngineData} onAnalysisData={setAnalysisEntries} />
        <AnalysisSummary entries={analysisEntries} />
        <MoveList />
        <div className="controls-row">
          <UndoButton />
          <button type="button" onClick={handleResetGame}>Reset partita</button>
        </div>
        <div className="controls-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={pgnInput}
            onChange={(event) => setPgnInput(event.target.value)}
            rows={4}
            placeholder="Incolla un PGN, ad esempio: 1. e4 e5 2. Nf3 Nc6"
          />
          <button type="button" onClick={handleImportPgn}>Importa PGN</button>
          {pgnError && <p className="notice">{pgnError}</p>}
        </div>
      </div>

      <ChatPanel
        opening={opening}
        engineData={engineData}
        analysisEntry={analysisEntries.at(-1) ?? null}
      />
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}
