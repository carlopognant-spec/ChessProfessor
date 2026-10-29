import { describe, expect, it, vi } from 'vitest'
import { createPracticeEngineSession } from '../src/lib/practiceEngineSession.js'

const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const harness = ({ active = true, ready = true, engine } = {}) => {
  const state = { active, ready, engine: engine ?? { analyze: vi.fn(), cancel: vi.fn() } }
  const session = createPracticeEngineSession({ getEngine: () => state.engine, isActive: () => state.active, isReady: () => state.ready })
  return { state, session }
}

describe('practice engine session', () => {
  it('returns a stable broker with dynamic admission checks', async () => {
    const { state, session } = harness()
    expect(createPracticeEngineSession).toBeDefined()
    expect(session).toBe(session)
    state.active = false
    await expect(session.analyze('fen', 1, 1)).rejects.toMatchObject({ name: 'AbortError' })
    state.active = true; state.ready = false
    await expect(session.analyze('fen', 1, 1)).rejects.toThrow('Motore di analisi non disponibile')
    expect(state.engine.analyze).not.toHaveBeenCalled()
  })

  it('checks an already aborted signal before canceling queued practice work', async () => {
    const { state, session } = harness(), first = deferred(), controller = new AbortController()
    state.engine.analyze.mockReturnValue(first.promise)
    const pending = session.analyze('first', 1, 1)
    controller.abort()
    await expect(session.analyze('second', 1, 1, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(state.engine.cancel).not.toHaveBeenCalled()
    first.resolve('done')
    await expect(pending).resolves.toBe('done')
  })

  it('passes options through without forwarding the abort signal', async () => {
    const { state, session } = harness(), controller = new AbortController()
    state.engine.analyze.mockResolvedValue('result')
    await expect(session.analyze('fen', 123, 2, { signal: controller.signal, history: ['e2e4'], searchMoves: ['d2d4'] })).resolves.toBe('result')
    expect(state.engine.analyze).toHaveBeenCalledWith('fen', 123, 2, { history: ['e2e4'], searchMoves: ['d2d4'] })
    expect(state.engine.cancel).not.toHaveBeenCalled()
  })

  it('rejects inactive requests with AbortError and unavailable engines in Italian', async () => {
    const { state, session } = harness()
    state.active = false
    await expect(session.analyze('fen', 1, 1)).rejects.toMatchObject({ name: 'AbortError' })
    state.active = true; state.engine = null
    await expect(session.analyze('fen', 1, 1)).rejects.toThrow('Motore di analisi non disponibile')
  })

  it('cancels immediately and idempotently even when the engine ignores cancel', async () => {
    const { state, session } = harness(), work = deferred()
    state.engine.analyze.mockReturnValue(work.promise)
    const pending = session.analyze('fen', 1, 1)
    session.cancel(); session.cancel()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(state.engine.cancel).toHaveBeenCalledTimes(1)
    work.resolve('late')
  })

  it('aborts immediately on signal and removes the listener when settled', async () => {
    const { state, session } = harness(), work = deferred(), controller = new AbortController()
    const remove = vi.spyOn(controller.signal, 'removeEventListener')
    state.engine.analyze.mockReturnValue(work.promise)
    const pending = session.analyze('fen', 1, 1, { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(state.engine.cancel).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
    work.resolve('late')
  })

  it('replaces a pending request, cancels only its owner, and preserves the newer result', async () => {
    const { state, session } = harness(), oldWork = deferred(), newWork = deferred()
    state.engine.analyze.mockReturnValueOnce(oldWork.promise).mockReturnValueOnce(newWork.promise)
    const old = session.analyze('old', 1, 1), current = session.analyze('new', 1, 1)
    await expect(old).rejects.toMatchObject({ name: 'AbortError' })
    expect(state.engine.cancel).toHaveBeenCalledTimes(1)
    oldWork.resolve('stale')
    newWork.resolve('fresh')
    await expect(current).resolves.toBe('fresh')
    session.cancel()
    expect(state.engine.cancel).toHaveBeenCalledTimes(1)
  })

  it('ignores old completion and old finally behavior cannot clear the new pending request', async () => {
    const { state, session } = harness(), oldWork = deferred(), newWork = deferred()
    state.engine.analyze.mockReturnValueOnce(oldWork.promise).mockReturnValueOnce(newWork.promise)
    const old = session.analyze('old', 1, 1), current = session.analyze('new', 1, 1)
    await expect(old).rejects.toMatchObject({ name: 'AbortError' })
    oldWork.resolve('stale')
    session.cancel()
    await expect(current).rejects.toMatchObject({ name: 'AbortError' })
    expect(state.engine.cancel).toHaveBeenCalledTimes(2)
    newWork.resolve('too late')
  })

  it('propagates asynchronous engine failures unchanged', async () => {
    const { state, session } = harness(), failure = new Error('worker failed')
    state.engine.analyze.mockRejectedValue(failure)
    await expect(session.analyze('fen', 1, 1)).rejects.toBe(failure)
    session.cancel()
    expect(state.engine.cancel).not.toHaveBeenCalled()
  })

  it('propagates synchronous engine failures and releases ownership', async () => {
    const { state, session } = harness(), failure = new Error('sync failure')
    state.engine.analyze.mockImplementationOnce(() => { throw failure }).mockResolvedValue('ok')
    await expect(session.analyze('fen', 1, 1)).rejects.toBe(failure)
    await expect(session.analyze('fen', 1, 1)).resolves.toBe('ok')
    expect(state.engine.cancel).not.toHaveBeenCalled()
  })

  it('does not let a stale cancellation cancel a newer engine owner', async () => {
    const engineA = { analyze: vi.fn(), cancel: vi.fn() }, engineB = { analyze: vi.fn(), cancel: vi.fn() }
    const state = { engine: engineA }
    const session = createPracticeEngineSession({ getEngine: () => state.engine, isActive: () => true, isReady: () => true })
    const workA = deferred(), workB = deferred()
    engineA.analyze.mockReturnValue(workA.promise); engineB.analyze.mockReturnValue(workB.promise)
    const first = session.analyze('a', 1, 1)
    state.engine = engineB
    const second = session.analyze('b', 1, 1)
    await expect(first).rejects.toMatchObject({ name: 'AbortError' })
    expect(engineA.cancel).toHaveBeenCalledTimes(1)
    expect(engineB.cancel).not.toHaveBeenCalled()
    workA.resolve('late')
    session.cancel()
    await expect(second).rejects.toMatchObject({ name: 'AbortError' })
    expect(engineB.cancel).toHaveBeenCalledTimes(1)
    workB.resolve('late')
  })

  it('clears abort listeners after normal completion', async () => {
    const { state, session } = harness(), controller = new AbortController()
    const remove = vi.spyOn(controller.signal, 'removeEventListener')
    state.engine.analyze.mockResolvedValue('done')
    await expect(session.analyze('fen', 1, 1, { signal: controller.signal })).resolves.toBe('done')
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  })
})
