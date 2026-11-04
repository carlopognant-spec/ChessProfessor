// Original synthesized tones: no recordings or external assets.
export function createMoveAudio(Context = globalThis.AudioContext ?? globalThis.webkitAudioContext) {
  let context, voice, last = -Infinity
  const stop = () => { if (voice) { voice.stop(); voice = null } }
  return {
    async unlock() {
      if (!Context) return false
      try {
        context ??= new Context()
        await context.resume()
        return context.state === 'running'
      } catch { return false }
    },
    play(capture = false) {
      if (context?.state !== 'running' || context.currentTime - last < .09) return
      stop()
      last = context.currentTime
      const oscillator = context.createOscillator(), gain = context.createGain()
      voice = oscillator
      oscillator.type = capture ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(capture ? 180 : 520, last)
      oscillator.frequency.exponentialRampToValueAtTime(capture ? 75 : 300, last + .065)
      gain.gain.setValueAtTime(.075, last)
      gain.gain.exponentialRampToValueAtTime(.001, last + .075)
      oscillator.connect(gain); gain.connect(context.destination)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); if (voice === oscillator) voice = null }
      oscillator.start(last); oscillator.stop(last + .08)
    },
    stop,
    close() { stop(); context?.close().catch(() => {}); context = null },
  }
}
