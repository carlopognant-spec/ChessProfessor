import { useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { explainMove } from '../lib/llm/index.js'

export default function ChatPanel({ opening, engineData }) {
  const { fen, moveHistorySan, applyMoveFromChat } = useGame()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    const question = input.trim()
    if (!question || sending) return

    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setSending(true)

    try {
      const result = await explainMove({
        fen,
        opening,
        engineData,
        question,
        moveHistorySan,
      })

      setMessages((m) => [...m, { role: 'assistant', text: result.explanation }])

      if (result.moveToPlay) {
        const applied = applyMoveFromChat(result.moveToPlay)
        if (!applied) {
          setMessages((m) => [...m, {
            role: 'error',
            text: `Il modello ha suggerito la mossa "${result.moveToPlay}" ma non è legale in questa posizione: la scacchiera non è stata modificata.`,
          }])
        }
      }
    } catch (err) {
      setMessages((m) => [...m, { role: 'error', text: `Errore: ${err.message}` }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="panel chat-panel">
      <h2>Chiedi al maestro</h2>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="notice">
            Fai una domanda su questa posizione: es. "Perché è meglio Cf3 di Ac4 qui?"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>{m.text}</div>
        ))}
        {sending && <p className="notice">Sto consultando Stockfish e formulando la spiegazione…</p>}
      </div>
      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi una domanda sugli scacchi…"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>Invia</button>
      </form>
    </div>
  )
}
