import { useState } from 'react'
import { useGame } from '../context/GameContext.jsx'
import { explainMove } from '../lib/llm/index.js'

export default function ChatPanel({ opening, engineData }) {
  const { fen, moveHistorySan, applyMoveFromChat } = useGame()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [provider, setProvider] = useState(import.meta.env.VITE_LLM_PROVIDER || 'groq')

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
      }, provider)

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
      <div className="controls-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Chiedi al maestro</h2>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          disabled={sending}
          style={{
            background: 'var(--ink)',
            color: 'var(--bone)',
            border: '1px solid rgba(201, 162, 75, 0.25)',
            borderRadius: '4px',
            padding: '0.35rem 0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
          }}
        >
          <option value="groq">Groq</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>
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