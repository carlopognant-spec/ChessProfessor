import {readFile} from 'node:fs/promises'
import{Chess}from'chess.js'
import assert from 'node:assert/strict'
const old=await readFile('agent-output/grande-discovered-realization-study-v1/candidate-material.js.txt','utf8')
let text=old.replace("const queenCaptures = board => board.moves", `const moverBoard = board => { const fields = board.fen().split(' '); if (fields[1] === move.color) return board; fields[1] = move.color; fields[3] = '-'; return new Chess(fields.join(' ')) }; const queenCaptures = board => moverBoard(board).moves`).replace('const availableCapture = prepared.game.moves','const availableCapture = moverBoard(prepared.game).moves').replace("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
const {detectMaterialRealization}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'))
const g=new Chess('7k/8/8/q4n2/8/2NQ4/3B4/4K3 w - - 0 1')
const rows=['Ne2','Qc7','Qxf5'].map((san,i)=>{const fenBefore=g.fen(),m=g.move(san);return{ply:i+1,fenBefore,fenAfter:g.fen(),playedUci:m.from+m.to,playedMove:m.san}})
assert.equal(detectMaterialRealization(rows[2],rows[1],rows[0])?.kind,'discovered-attack-realization')
console.log('Positive synthetic example: passed')
for (const [fen, moves] of [
  ['7k/8/8/q4n2/8/3Q4/3B4/1N2K3 w - - 0 1', ['Na3', 'Qc7', 'Qxf5']],
  ['7k/8/8/q2p1n2/8/2NQ4/3B4/4K3 w - - 0 1', ['Nxd5', 'Qc7', 'Qxf5']],
  ['7k/2P5/8/q4n2/8/2NQ4/3B4/4K3 w - - 0 1', ['Ne2', 'Qxc7', 'Qxf5']],
  ['7k/8/8/q4n2/8/2NQ4/3B4/4K3 w - - 0 1', ['Ne2', 'Kh7', 'Qxf5+']],
  ['3r2k1/8/8/q4n2/8/2N4Q/3B4/3K4 w - - 0 1', ['Ne2', 'Qc7', 'Qxf5']],
]) {
  const board = new Chess(fen)
  const entries = moves.map((san, i) => {
    const fenBefore = board.fen(), move = board.move(san)
    return { ply: i + 1, fenBefore, fenAfter: board.fen(), playedUci: move.from + move.to, playedMove: move.san }
  })
  assert.equal(detectMaterialRealization(entries[2], entries[1], entries[0]), null)
}
console.log('Five negative synthetic examples: passed')
