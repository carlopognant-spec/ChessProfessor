import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { moveFacts,pvMaterial } from './grande-comparison-features.js'
test('ordinary recapture is identified without using expected labels',()=>{
  const g=new Chess();g.move('e4');const previous=g.move('d5');const white=moveFacts(g.fen(),'exd5',previous)
  assert.equal(white.recapture,false)
  const black=moveFacts(white.fenAfter,'Qxd5',white.move)
  assert.equal(black.recapture,true)
})
test('check and queen fork detected in the actual P4 position',()=>{
  const f=moveFacts('rn2k2r/pp2npp1/2p1p1b1/1q2P1p1/2NP4/P5P1/5PBP/R2Q1RK1 w kq - 1 15','Nd6+')
  assert.equal(f.check,true);assert.equal(f.kingAndQueenAttack,true);assert.equal(f.geometricDoubleAttack,true)
})
test('pawn double attack is not confused with an immediate material gain',()=>{
  const f=moveFacts('rnbq1rk1/pppp1ppp/5n2/2b1n3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQ - 4 7','d4')
  assert.equal(f.geometricDoubleAttack,true);assert.equal(f.materialChange,0)
})
test('PV material uses the supplied player perspective and requires four real plies',()=>{
  const fen='4k3/8/8/8/8/8/p7/4K2R w K - 0 1'
  const a=pvMaterial(fen,['h1h2','a2a1q'],'w')
  assert.equal(a.deltaAt4Ply,null);assert.equal(a.first8MaterialChanges[1],-8)
  assert.throws(()=>pvMaterial(fen,['h1h9'],'w'))
})
