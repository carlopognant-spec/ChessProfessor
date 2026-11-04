import { expect, it, vi } from 'vitest'
import { createMoveAudio } from '../src/lib/moveAudio.js'

it('unlocks on demand, differentiates captures, drops bursts and releases resources', async () => {
  const voices = []
  let context
  class Context {
    constructor() { context = this; this.currentTime = 0; this.state = 'suspended'; this.destination = {} }
    resume() { this.state = 'running'; return Promise.resolve() }
    close() { this.state = 'closed'; return Promise.resolve() }
    createOscillator() {
      const voice = { frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() }
      voices.push(voice); return voice
    }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} } }
  }
  const audio = createMoveAudio(Context)
  audio.play(); expect(voices).toHaveLength(0)
  expect(await audio.unlock()).toBe(true)
  audio.play(false); audio.play(true)
  expect(voices).toHaveLength(1)
  expect(voices[0].type).toBe('sine')
  context.currentTime = .2; audio.play(true)
  expect(voices).toHaveLength(2)
  expect(voices[1].type).toBe('triangle')
  expect(voices[0].stop).toHaveBeenCalledTimes(2)
  voices[0].onended(); expect(voices[0].disconnect).toHaveBeenCalledOnce()
  audio.close(); expect(context.state).toBe('closed')
  audio.play(); expect(voices).toHaveLength(2)
})

it('handles browser denial without starting sound', async () => {
  class Denied { constructor() { throw Error('denied') } }
  const audio = createMoveAudio(Denied)
  expect(await audio.unlock()).toBe(false)
  expect(() => audio.play()).not.toThrow()
})
