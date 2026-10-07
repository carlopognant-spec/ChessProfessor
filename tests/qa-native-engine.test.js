import { describe, it, expect } from 'vitest'
import { NativeEngine } from '../scripts/qa/native-engine.js'

// Fake UCI verifies transport/parser, never generates analysis caches.
const fakeUci = `
const readline = require('node:readline');
readline.createInterface({input:process.stdin}).on('line', command => {
  if (command === 'uci') console.log('id name QA transport test\\nuciok');
  if (command === 'isready') console.log('readyok');
  if (command.startsWith('go ')) {
    console.log('info string received ' + command);
    console.log('info depth 7 multipv 1 score cp 99 lowerbound nodes 100 time 2 pv e2e4');
    console.log('info depth 8 multipv 1 score cp 25 nodes 200123 time 10 pv e2e4 e7e5');
    console.log('info depth 7 multipv 2 score cp 12 nodes 200123 time 10 pv d2d4 d7d5');
    console.log('bestmove e2e4');
  }
});`

describe('native QA UCI node budget', () => {
  it('sends a node limit, preserves real depths, and discards bounds without replacing legacy depth mode', async () => {
    const engine = new NativeEngine(process.execPath, 10000, ['-e', fakeUci])
    const received = []
    engine.reader.on('line', line => { if (line.startsWith('info string received ')) received.push(line.slice(21)) })
    try {
      await engine.init()
      await engine.newGame()
      const result = await engine.analyzeNodes('test FEN', 200000, 5)
      expect(received).toEqual(['go nodes 200000'])
      expect(result).toMatchObject({ evalCp: 25, mate: null, actualNodes: 200123, engineTimeMs: 10, bestmove: 'bestmove e2e4' })
      expect(result.lines.map(line => line.depth)).toEqual([8, 7])
      expect(result.bounds).toHaveLength(1)
      expect(result.lines[0].raw).not.toContain('lowerbound')
      await engine.analyze('test FEN', 12, 5)
      expect(received).toEqual(['go nodes 200000', 'go depth 12'])
      await expect(engine.analyzeNodes('test FEN', 0, 5)).rejects.toThrow('Budget nodi non valido')
    } finally { engine.close() }
  })
})
