import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

// Read-only inspection: never rewrites dependencies or the frozen manifest.
const manifest = JSON.parse(readFileSync('agent-output/specials-frozen-candidate-v1.json', 'utf8'))
const path = 'src/lib/classification.js'
const expected = manifest.sources.find(source => source.path === path).sha256
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const git = args => execFileSync('git', args, { maxBuffer: 16 * 1024 * 1024 })
const current = readFileSync(path)
const dependencies = manifest.sources.map(source => {
  try {
    const actual = hash(readFileSync(source.path))
    return { path: source.path, expected: source.sha256, actual, matches: actual === source.sha256 }
  } catch (error) {
    return { path: source.path, matches: false, error: error.code }
  }
})
const newlineLines = { LF: [], CRLF: [] }
let line = 1
for (let index = 0; index < current.length; index++) {
  if (current[index] === 10) {
    newlineLines[current[index - 1] === 13 ? 'CRLF' : 'LF'].push(line)
    line++
  }
}
const candidates = new Map()
const commits = git(['log', '--all', '--format=%H', '--', path]).toString().trim().split(/\s+/)
for (const commit of commits) {
  const oid = git(['rev-parse', `${commit}:${path}`]).toString().trim()
  candidates.set(oid, 'history')
}
const unreachable = git(['fsck', '--no-reflogs', '--unreachable']).toString()
const blobs = [...unreachable.matchAll(/^unreachable blob ([a-f0-9]+)$/gm)].map(match => match[1])
for (const oid of blobs) {
  const size = Number(git(['cat-file', '-s', oid]).toString())
  if (size < 1000 || size > 16000) continue
  const bytes = git(['cat-file', 'blob', oid])
  if (bytes.includes(Buffer.from('export function classifyAnalysisEntries'))
    && bytes.includes(Buffer.from('export function classifyMove'))) candidates.set(oid, 'unreachable')
}
const inspected = []
for (const [oid, source] of candidates) {
  const bytes = git(['cat-file', 'blob', oid])
  const lf = bytes.toString('utf8').replace(/\r\n/g, '\n')
  const variants = new Map([['exact', bytes], ['LF', Buffer.from(lf)], ['CRLF', Buffer.from(lf.replace(/\n/g, '\r\n'))]])
  for (const newline of ['\n', '\r\n']) {
    const text = lf.replace(/\n/g, newline).replace(/(?:\r?\n)+$/, '')
    variants.set(`${JSON.stringify(newline)}-no-final-newline`, Buffer.from(text))
    variants.set(`${JSON.stringify(newline)}-one-final-newline`, Buffer.from(text + newline))
  }
  inspected.push({ oid, source, bytes: bytes.length,
    normalizedEqualsCurrent: lf === current.toString('utf8').replace(/\r\n/g, '\n'),
    matches: [...variants].filter(([, data]) => hash(data) === expected).map(([name]) => name) })
}
console.log(JSON.stringify({ path, expected, current: hash(current), newlineLines,
  dependencies, unreachableBlobs: blobs.length, inspected }, null, 2))
if (dependencies.some(source => !source.matches)) process.exitCode = 1
