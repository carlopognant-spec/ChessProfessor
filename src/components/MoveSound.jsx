import { useEffect, useRef, useState } from 'react'
import { createMoveAudio } from '../lib/moveAudio.js'

const preference = 'chessprofessor-move-sound'
export default function MoveSound({ moves, timeline, rapid, editing }) {
  const [enabled, setEnabled] = useState(() => { try { return localStorage.getItem(preference) === 'on' } catch { return false } })
  const [notice, setNotice] = useState('')
  const audio = useRef(null)
  const previous = useRef({ moves, timeline })
  useEffect(() => {
    if (!enabled) return
    const unlock = () => { audio.current ??= createMoveAudio(); void audio.current.unlock() }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [enabled])
  useEffect(() => {
    const old = previous.current
    previous.current = { moves, timeline }
    if (!enabled || rapid || editing) { audio.current?.stop(); return }
    const forward = moves.length === old.moves.length + 1 && old.moves.every((san, i) => moves[i] === san)
    const backward = moves.length === old.moves.length - 1 && moves.every((san, i) => old.moves[i] === san)
    // Imports replace the timeline; ordinary play appends exactly one move.
    const appended = timeline.length === old.timeline.length + 1 && old.timeline.every((san, i) => timeline[i] === san)
    if ((timeline === old.timeline || appended) && (forward || backward)) {
      audio.current?.play((forward ? moves.at(-1) : old.moves.at(-1)).includes('x'))
    }
  }, [moves, timeline, rapid, editing, enabled])
  useEffect(() => () => { audio.current?.close(); audio.current = null }, [])
  return <div className="move-sound-control"><button type="button" aria-pressed={enabled} onClick={async () => {
    if (enabled) { audio.current?.stop(); setEnabled(false); try { localStorage.setItem(preference, 'off') } catch { setNotice('Preferenza audio non salvata.') }; return }
    audio.current ??= createMoveAudio()
    if (!await audio.current.unlock()) { setNotice('Audio non disponibile o bloccato dal browser.'); return }
    setEnabled(true); setNotice('')
    try { localStorage.setItem(preference, 'on') } catch { setNotice('Preferenza audio non salvata.') }
  }}>Suoni: {enabled ? 'attivi' : 'disattivati'}</button>
  {enabled && <button type="button" onClick={async () => {
    audio.current ??= createMoveAudio()
    if (await audio.current.unlock()) { audio.current.play(); setNotice('') } else setNotice('Audio bloccato dal browser.')
  }}>Prova audio</button>}
  {notice && <span role="status">{notice}</span>}</div>
}
