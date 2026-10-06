import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

export class NativeEngine {
  constructor(executable, timeoutMs = 120000) {
    this.timeoutMs = timeoutMs
    this.failure = null
    this.process = spawn(executable, [], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
    this.process.on('error', error => this.fail(error))
    this.process.stdin.on('error', error => this.fail(error))
    this.process.on('exit', code => this.fail(new Error(`Stockfish terminato (${code})`)))
    this.stderr = ''
    this.process.stderr.on('data', chunk => { this.stderr = (this.stderr + chunk).slice(-4000) })
    this.reader = createInterface({ input: this.process.stdout })
    this.reader.on('line', line => this.pending?.onLine(line))
  }
  fail(error) { this.failure = error; this.pending?.reject(error) }
  request(commands, onLine) {
    if (this.failure) return Promise.reject(this.failure)
    if (this.pending) return Promise.reject(new Error('Richieste UCI concorrenti'))
    return new Promise((resolve, reject) => {
      const finish = (fn, value) => { clearTimeout(timer); this.pending = null; fn(value) }
      const timer = setTimeout(() => this.pending?.reject(new Error(`Timeout Stockfish: ${this.stderr}`)), this.timeoutMs)
      this.pending = { reject: error => finish(reject, error), onLine: line => { const result = onLine(line); if (result !== undefined) finish(resolve, result) } }
      this.process.stdin.write(commands.join('\n') + '\n')
    })
  }
  async init() {
    let version = ''
    await this.request(['uci'], line => { if (line.startsWith('id name ')) version = line.slice(8); if (line === 'uciok') return true })
    if (!version) throw new Error('Versione motore UCI assente')
    await this.request(['setoption name Threads value 1', 'setoption name Hash value 16', 'isready'], line => line === 'readyok' ? true : undefined)
    this.version = version
  }
  async newGame() { await this.request(['ucinewgame', 'isready'], line => line === 'readyok' ? true : undefined) }
  async analyze(fen, depth, multiPv) {
    const lines = new Map()
    return this.request([`setoption name MultiPV value ${multiPv}`, `position fen ${fen}`, `go depth ${depth}`], line => {
      const score = line.match(/\bscore (cp|mate) (-?\d+)/)
      if (line.startsWith('info ') && score && !/\b(upperbound|lowerbound)\b/.test(line)) {
        const multipv = Number(line.match(/\bmultipv (\d+)/)?.[1] ?? 1)
        lines.set(multipv, { multipv, depth: Number(line.match(/\bdepth (\d+)/)?.[1] ?? 0), evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null, pv: line.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [] })
      }
      if (line.startsWith('bestmove ')) {
        const ordered = [...lines.values()].sort((a, b) => a.multipv - b.multipv)
        return { evalCp: ordered[0]?.evalCp ?? null, mate: ordered[0]?.mate ?? null, lines: ordered }
      }
    })
  }
  close() { this.reader.close(); this.process.kill() }
}
