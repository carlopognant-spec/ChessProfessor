import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Chess } from 'chess.js'
import { openingPositionKey } from '../src/lib/openingBook.js'

const revision = '36cfd9227f553dec1d39ee20fa0775eea8f8e165'
const root = `https://raw.githubusercontent.com/JeffML/eco.json/${revision}`
const fetchText = async (name) => {
  const response = await fetch(`${root}/${name}`, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
  return response.text()
}

const files = await Promise.all(['A', 'B', 'C', 'D', 'E'].map(async (letter) => {
  const name = `eco${letter}.json`
  const text = await fetchText(name)
  return { name, text, sha256: createHash('sha256').update(text).digest('hex') }
}))
const license = await fetchText('LICENSE')
const supplements = JSON.parse(await fs.readFile(new URL('../src/data/openingSupplements.json', import.meta.url), 'utf8'))
const positions = new Set()
let sequenceCount = 0

function addSequence(pgn) {
  const source = new Chess()
  source.loadPgn(pgn)
  const replay = new Chess()
  for (const san of source.history()) {
    replay.move(san)
    positions.add(openingPositionKey(replay.fen()))
  }
}

// Validate every source line; fail rather than silently omit malformed records.
for (const file of files) {
  for (const record of Object.values(JSON.parse(file.text))) {
    addSequence(record.moves)
    sequenceCount += 1
  }
}
for (const supplement of supplements) addSequence(supplement.pgn)

const data = {
  schemaVersion: 1,
  source: 'https://github.com/JeffML/eco.json',
  revision,
  sourceFiles: files.map(({ name, sha256 }) => ({ name, sha256 })),
  sequenceCount,
  supplements,
  positions: [...positions].sort(),
}
await fs.writeFile(new URL('../src/data/openingPositions.json', import.meta.url), `${JSON.stringify(data)}\n`)
await fs.writeFile(new URL('../src/data/openingBook.LICENSE.txt', import.meta.url), license)
console.log(`Validated ${sequenceCount} source sequences + ${supplements.length} documented supplements.`)
console.log(`Generated ${positions.size} opening positions from revision ${revision}.`)
