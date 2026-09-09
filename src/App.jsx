import { useState } from 'react'
import { GameProvider } from './context/GameContext.jsx'
import Board from './components/Board.jsx'
import OpeningPanel from './components/OpeningPanel.jsx'
import EnginePanel from './components/EnginePanel.jsx'
import MoveList from './components/MoveList.jsx'
import UndoButton from './components/UndoButton.jsx'
import ChatPanel from './components/ChatPanel.jsx'

function AppContent() {
  const [opening, setOpening] = useState(null)
  const [engineData, setEngineData] = useState(null)

  return (
    <div className="app-shell">
      <div className="panel">
        <OpeningPanel onOpeningData={setOpening} />
        <Board />
        <EnginePanel onEngineData={setEngineData} />
        <MoveList />
        <div className="controls-row">
          <UndoButton />
        </div>
      </div>

      <ChatPanel opening={opening} engineData={engineData} />
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
