import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { playUci } from '../lib/analysisHistory.js'
import { createPracticeAnalyzer, practiceExplanation, practiceExplanationEntry, practiceHint } from '../lib/reviewPractice.js'
import MoveExplanation from './MoveExplanation.jsx'
import BoardOrientationControls from './BoardOrientationControls.jsx'
import { useGame } from '../context/GameContext.jsx'
import { createPracticeProgressStore } from '../lib/reviewPracticeProgress.js'
import './ReviewPracticePanel.css'

export default function ReviewPracticePanel({ candidates, engine, onClose }) {
  const { boardView, boardOrientation } = useGame()
  engine = engine ?? { ready: false, loading: false, error: '' }
  const [exercises] = useState(() => candidates.slice(0, 5))
  const [index, setIndex] = useState(0)
  const candidate = exercises[index]
  const practiceOrientation = boardView.mode === 'auto' ? candidate?.side === 'b' ? 'black' : 'white' : boardOrientation
  const engineRef = useRef(engine)
  engineRef.current = engine
  const analyzer = useMemo(() => createPracticeAnalyzer({
    analyzePosition: (...args) => engineRef.current.analyze(...args),
  }), [])
  const store = useMemo(() => createPracticeProgressStore(), [])
  const [progress, setProgress] = useState(null)
  const [storageError, setStorageError] = useState('')
  const [status, setStatus] = useState('preparing')
  const [prepared, setPrepared] = useState(null)
  const preparedRef = useRef(null)
  const [fen, setFen] = useState(candidate?.fen ?? new Chess().fen())
  const [from, setFrom] = useState(null)
  const [input, setInput] = useState('')
  const [promotion, setPromotion] = useState('q')
  const [message, setMessage] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [replyShown, setReplyShown] = useState(false)
  const [retry, setRetry] = useState(0)
  const request = useRef(null)
  const generation = useRef(0)
  const paused = useRef(false)
  const heading = useRef(null)
  const practiceBoard = useRef(null)

  function stopRequest() {
    generation.current++
    request.current?.abort()
    request.current = null
  }

  function save(outcome, hints = hintLevel) {
    const result = store.record(candidate.id, { status: outcome, hints })
    setProgress(result.progress)
    setStorageError(result.error ?? '')
  }

  useEffect(() => {
    stopRequest()
    preparedRef.current = null
    paused.current = false
    setPrepared(null); setStatus('preparing'); setMessage('')
    setFen(candidate?.fen ?? new Chess().fen()); setFrom(null); setInput('')
    setPromotion('q'); setHintLevel(0); setRevealed(false); setVerdict(null); setReplyShown(false)
    if (candidate) {
      const saved = store.read(candidate.id)
      setProgress(saved.progress); setStorageError(saved.error ?? '')
    }
    heading.current?.focus()
    heading.current?.scrollIntoView({ block: 'start' })
  }, [candidate?.id, store])

  useEffect(() => {
    if (!candidate || !engine.ready || paused.current || preparedRef.current) return
    const controller = new AbortController(), token = ++generation.current
    request.current = controller
    setStatus('preparing'); setMessage('Verifica aggiornata della posizione in corso…')
    analyzer.prepare(candidate, { signal: controller.signal }).then(result => {
      if (controller.signal.aborted || token !== generation.current) return
      if (result.status === 'ready') {
        preparedRef.current = result; setPrepared(result); setStatus('ready')
        setMessage('Trova una continuazione migliore. Sono ammesse alternative equivalenti.')
      } else if (result.status === 'not-applicable') {
        paused.current = true
        setStatus('not-applicable')
        setMessage('La verifica aggiornata non conferma un errore utile per questo esercizio. Nessuna penalità.')
      } else {
        paused.current = true; setStatus('inconclusive')
        setMessage('La verifica non è conclusiva. Nessuna penalità: puoi riprovare o passare oltre.')
        const saved = store.record(candidate.id, { status: 'inconclusive' })
        setProgress(saved.progress); setStorageError(saved.error ?? '')
      }
    }).catch(error => {
      if (controller.signal.aborted || token !== generation.current) return
      paused.current = true; setStatus('inconclusive')
      setMessage(error?.name === 'AbortError' ? 'Verifica interrotta. Nessuna penalità.' : 'Il motore non ha completato la verifica. Nessuna penalità: riprova quando è pronto.')
    }).finally(() => {
      if (request.current === controller) request.current = null
    })
    return () => {
      controller.abort()
      if (request.current === controller) { generation.current++; request.current = null }
    }
  }, [candidate?.id, engine.ready, retry, analyzer, store])

  useEffect(() => () => stopRequest(), [])

  const busy = status === 'preparing' || status === 'checking'
  const canMove = !!prepared && engine.ready && !paused.current && !revealed && ['ready', 'incorrect'].includes(status)
  const showExplanation = !!prepared && prepared.candidate.id === candidate?.id && (status === 'correct' || revealed)

  function tryMove(moveInput) {
    if (!canMove || request.current) return false
    const board = new Chess(candidate.fen)
    let move
    try { move = board.move(moveInput) }
    catch { setMessage('Questa mossa non è legale nella posizione. Controlla la notazione e riprova.'); return false }
    setFen(board.fen()); setFrom(null); setInput(''); setVerdict(null); setReplyShown(false)
    setStatus('checking'); setMessage('Verifica della tua continuazione…')
    const controller = new AbortController(), token = ++generation.current
    request.current = controller
    analyzer.evaluate(prepared, { from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) },
      { signal: controller.signal }).then(result => {
      if (controller.signal.aborted || token !== generation.current) return
      setVerdict(result)
      if (result.status === 'correct') {
        setStatus('correct'); setFen(result.fenAfter)
        setMessage(hintLevel ? 'Continuazione valida, trovata con un aiuto.' : 'Continuazione valida!')
        save('correct')
      } else if (result.status === 'incorrect') {
        setStatus('incorrect'); setFen(candidate.fen)
        setMessage(`${result.san} perde troppo rispetto alla continuazione di riferimento. Riprova dalla posizione iniziale.`)
        save('incorrect')
      } else {
        paused.current = true; setStatus('inconclusive'); setFen(candidate.fen)
        setMessage('Il confronto non è conclusivo. Nessuna penalità: riprova la verifica o passa oltre.')
        save('inconclusive')
      }
    }).catch(error => {
      if (controller.signal.aborted || token !== generation.current) return
      paused.current = true; setStatus('inconclusive'); setFen(candidate.fen)
      setMessage(error?.name === 'AbortError' ? 'Verifica interrotta. Nessuna penalità.' : 'Verifica non disponibile. Nessuna penalità: riprova quando il motore è pronto.')
    }).finally(() => {
      if (request.current === controller) request.current = null
    })
    return true
  }

  function drop({ sourceSquare, targetSquare }) {
    if (!targetSquare || !canMove) return false
    const board = new Chess(candidate.fen)
    const promoting = board.get(sourceSquare)?.type === 'p' && /[18]$/.test(targetSquare)
    return tryMove({ from: sourceSquare, to: targetSquare, ...(promoting ? { promotion } : {}) })
  }

  function click({ square }) {
    if (!canMove) return
    if (from && square !== from && drop({ sourceSquare: from, targetSquare: square })) return
    setFrom(new Chess(candidate.fen).get(square)?.color === candidate.side ? square : null)
  }

  function interrupt() {
    stopRequest(); paused.current = true
    setStatus('inconclusive'); setFen(candidate.fen); setFrom(null)
    setMessage('Verifica interrotta. Nessuna penalità. Riprendi soltanto quando vuoi.')
  }

  function retryVerification() {
    stopRequest(); paused.current = false; setFen(candidate.fen); setFrom(null); setVerdict(null)
    if (preparedRef.current) {
      setStatus('ready'); setMessage('Prova di nuovo una continuazione dalla posizione iniziale.')
    } else { setStatus('preparing'); setRetry(value => value + 1) }
  }

  function revealSolution() {
    if (!prepared || busy || revealed || status === 'correct') return
    setRevealed(true); setHintLevel(3); setFen(candidate.fen); setFrom(null); setReplyShown(false)
    setMessage('Soluzione mostrata. Questa visita non viene conteggiata come risolta.')
    save('solution', 3)
  }

  function next(skipped = false) {
    stopRequest()
    if (skipped) save('skipped')
    setIndex(value => value + 1)
  }

  function close() { stopRequest(); onClose() }

  const squareStyles = {}
  if (canMove && from) {
    squareStyles[from] = { background: 'rgba(201,162,75,.7)' }
    for (const move of new Chess(fen).moves({ square: from, verbose: true })) {
      squareStyles[move.to] = { background: 'radial-gradient(circle, rgba(40,50,35,.4) 24%, transparent 26%)' }
    }
  }
  if (prepared && hintLevel >= 2 && !replyShown) squareStyles[prepared.referenceUci.slice(0, 2)] = { background: 'rgba(201,162,75,.8)' }
  const arrows = prepared && revealed && !replyShown
    ? [{ startSquare: prepared.referenceUci.slice(0, 2), endSquare: prepared.referenceUci.slice(2, 4), color: '#c9a24b' }] : []
  const continuation = showExplanation ? (status === 'correct' ? verdict?.played?.pv : prepared.original.reference.pv) : []
  const explanationEntry = useMemo(() => showExplanation ? practiceExplanationEntry(prepared, fen, verdict) : null,
    [prepared, fen, verdict, showExplanation])

  function showReply() {
    const board = new Chess(candidate.fen)
    try {
      for (const uci of continuation.slice(0, 2)) playUci(board, uci)
      setFen(board.fen()); setReplyShown(true)
      setMessage(`Risposta mostrata: ${board.history().at(-1)}.`)
      const token = generation.current
      requestAnimationFrame(() => {
        const element = practiceBoard.current
        if (token !== generation.current || !element || !window.matchMedia('(max-width: 760px)').matches) return
        const bounds = element.getBoundingClientRect()
        element.focus({ preventScroll: true })
        if (bounds.top < 60 || bounds.bottom > innerHeight) element.scrollIntoView({ block: 'center', behavior: 'instant' })
      })
    } catch { setMessage('La risposta non è disponibile per questa continuazione.') }
  }

  if (!candidate) return <section className="review-practice panel" aria-labelledby="practice-title">
    <div className="practice-header"><h2 id="practice-title" ref={heading} tabIndex={-1}>Sessione di pratica completata</h2><button onClick={close}>Chiudi pratica</button></div>
    <p role="status">Hai terminato le {exercises.length} posizioni selezionate.</p>
    <ul>{exercises.map((exercise, i) => {
      const saved = store.read(exercise.id).progress
      return <li key={exercise.id}>Posizione {i + 1}: {saved.solved} risolte senza aiuti, {saved.assisted} con aiuti, {saved.mistakes} errori, {saved.solutions} soluzioni mostrate, {saved.skipped} saltate, {saved.inconclusive} verifiche incerte.</li>
    })}</ul>
    {storageError && <p role="alert">{storageError} I conteggi potrebbero non essere salvati.</p>}
  </section>

  return <section className="review-practice panel" aria-labelledby="practice-title" aria-busy={busy} data-practice-status={status}>
    <div className="practice-header">
      <h2 id="practice-title" ref={heading} tabIndex={-1}>Pratica dai tuoi errori · {index + 1}/{exercises.length}</h2>
      <button onClick={close}>Chiudi pratica</button>
    </div>
    <p>Mossa {candidate.moveNumber}, giocano {candidate.side === 'w' ? 'i Bianchi' : 'i Neri'}. Scegli tu la continuazione.</p>
    <BoardOrientationControls orientation={practiceOrientation} />
    {engine.loading && <p role="status">{engine.message || 'Caricamento del motore…'} Al primo avvio il download è di circa 100 MB.</p>}
    {engine.error && <div role="alert"><p>{String(engine.error)}</p><button onClick={() => {
      interrupt(); preparedRef.current = null; setPrepared(null)
      engineRef.current.restart()
    }}>Riavvia motore</button></div>}
    <div className="practice-layout">
      <section className="practice-board" ref={practiceBoard} tabIndex={-1} data-fen={fen} data-orientation={practiceOrientation} aria-label="Scacchiera della pratica">
        <Chessboard options={{ id: 'review-practice-board', position: fen,
          boardOrientation: practiceOrientation, allowDragging: canMove,
          onPieceDrop: drop, onSquareClick: click, squareStyles, arrows, allowDrawingArrows: false,
          lightSquareStyle: { backgroundColor: '#EDE6D6' }, darkSquareStyle: { backgroundColor: '#7C6A53' },
          animationDurationInMs: 120 }} />
      </section>
      <div className="practice-controls">
        <p role="status" aria-live="polite" aria-atomic="true">{message || (engine.ready ? 'Preparazione della posizione…' : 'In attesa del motore…')}</p>
        <form onSubmit={event => { event.preventDefault(); tryMove(input.trim()) }}>
          <label htmlFor="practice-san">Mossa SAN</label>
          <div className="practice-actions"><input id="practice-san" value={input} onChange={event => setInput(event.target.value)}
            placeholder="es. Nf3" autoComplete="off" disabled={!canMove} aria-describedby="practice-input-help" />
          <button type="submit" disabled={!canMove || !input.trim()}>Verifica mossa</button></div>
          <small id="practice-input-help">Puoi usare la tastiera, cliccare due case o trascinare un pezzo. Notazione internazionale: N cavallo, B alfiere, R torre, Q donna, K re.</small>
          <label htmlFor="practice-promotion">Promozione per clic e trascinamento</label>
          <select id="practice-promotion" value={promotion} onChange={event => setPromotion(event.target.value)} disabled={!canMove}>
            <option value="q">Donna</option><option value="r">Torre</option><option value="b">Alfiere</option><option value="n">Cavallo</option>
          </select>
        </form>
        {busy && <button onClick={interrupt}>Interrompi verifica</button>}
        {status === 'inconclusive' && !revealed && <button onClick={retryVerification} disabled={!engine.ready || !!engine.error}>Riprova verifica</button>}
        {prepared && !showExplanation && <div className="practice-actions">
          <button disabled={busy} onClick={() => hintLevel >= 2 ? revealSolution() : setHintLevel(value => value + 1)}>Suggerimento {Math.min(3, hintLevel + 1)}</button>
          <button disabled={busy} onClick={revealSolution}>Mostra soluzione</button>
        </div>}
        {prepared && hintLevel > 0 && <p className="practice-hint">{practiceHint(prepared, hintLevel)}</p>}
        {showExplanation && <div className="practice-explanation">
          <p aria-label="Confronto dalla posizione iniziale">{practiceExplanation(prepared, verdict)}</p>
          {explanationEntry && <MoveExplanation entry={explanationEntry} />}
          {continuation?.length >= 2 && <button onClick={showReply} disabled={replyShown}>Mostra risposta avversaria</button>}
        </div>}
        <div className="practice-actions">
          {(showExplanation || status === 'not-applicable') ? <button onClick={() => next()}>Prossima posizione</button>
            : <button onClick={() => next(true)}>Salta posizione</button>}
        </div>
        {progress && <p className="practice-progress">Progressi di questa posizione: {progress.attempts} tentativi, {progress.solved} risolte senza aiuti, {progress.assisted} con aiuti, {progress.mistakes} errori. Soluzioni mostrate: {progress.solutions}; saltate: {progress.skipped}; verifiche incerte: {progress.inconclusive}.</p>}
        {storageError && <p role="alert">{storageError} Puoi continuare, ma i progressi potrebbero non essere salvati.</p>}
      </div>
    </div>
  </section>
}
