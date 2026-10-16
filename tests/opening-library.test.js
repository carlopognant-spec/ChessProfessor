import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {OPENING_TRAPS,OPENING_LESSONS,openingFamily} from '../src/lib/openingLessons.js'
import {linePositions,practiceMove,initialPracticeIndex,normalizeOpeningQuery,validOpeningProgress,recordOpeningCompletion,prepareOpeningCatalog} from '../src/lib/openingLibrary.js'

describe('opening catalog and exercises',()=>{
  it('covers 500 ECO codes with unique stable identities and searchable aliases',()=>{
    const data=JSON.parse(readFileSync(new URL('../src/data/openingCatalog.json',import.meta.url)))
    expect(data.entries).toHaveLength(12377)
    expect(new Set(data.entries.map(e=>e.eco)).size).toBe(500)
    expect(new Set(data.entries.map(e=>e.id)).size).toBe(data.entries.length)
    expect(data.entries.every(e=>OPENING_LESSONS.some(l=>l.id===e.family))).toBe(true)
    const italian=prepareOpeningCatalog(data.entries.filter(e=>e.name==='Italian Game'))
    expect(italian.some(e=>e.search.includes('partita italiana'))).toBe(true)
    expect(normalizeOpeningQuery('Grünfeld, Réti — B90')).toBe('grunfeld reti b90')
  })
  it('separates the King’s Indian Attack from the defense',()=>{
    expect(openingFamily("King's Indian Attack").id).toBe('reti')
    expect(openingFamily("King's Indian Defense: Classical Variation").id).toBe('kings-indian')
    expect(openingFamily('KID: historical source name','E90').id).toBe('kings-indian')
    expect(openingFamily('QGD: historical source name','D35').id).toBe('queens-gambit')
  })
  it('validates every foundation line and every trap outcome',()=>{
    for(const g of OPENING_LESSONS){const b=new Chess();expect(()=>b.loadPgn(g.line)).not.toThrow()}
    const value={p:1,n:3,b:3,r:5,q:9,k:0}
    for(const trap of OPENING_TRAPS){
      const b=new Chess();b.loadPgn(trap.pgn)
      if(trap.outcome==='mate'){expect(b.isCheckmate(),trap.id).toBe(true);expect(b.turn()).not.toBe(trap.side)}
      else{const gain=b.board().flat().filter(Boolean).reduce((s,p)=>s+(p.color===trap.side?1:-1)*value[p.type],0);expect(gain,trap.id).toBe(trap.materialGain)}
    }
  })
  it('keeps legal alternatives separate from illegal moves and never advances on either',()=>{
    const moves=['e4','e5','Nf3','Nc6']
    expect(practiceMove(moves,0,'w','d4')).toMatchObject({status:'different-line',index:0})
    expect(practiceMove(moves,0,'w',{from:'e2',to:'e5'})).toMatchObject({status:'illegal',index:0})
    expect(practiceMove(moves,0,'w','e4')).toMatchObject({status:'correct',index:2,reply:'e5'})
    expect(practiceMove(moves,2,'w','Nf3')).toMatchObject({status:'complete',index:4})
    expect(initialPracticeIndex(moves,'b')).toBe(1)
    expect(practiceMove(moves,1,'b','e5')).toMatchObject({status:'correct',index:3,reply:'Nf3'})
    expect(practiceMove(moves,3,'b','Nc6')).toMatchObject({status:'complete',index:4})
  })
  it('supports the knight underpromotion rather than silently playing a queen',()=>{
    const trap=OPENING_TRAPS.find(t=>t.id==='albin'),b=new Chess();b.loadPgn(trap.pgn);const moves=b.history()
    const index=moves.findIndex(m=>m.includes('=N'))
    expect(practiceMove(moves,index,'b',{from:'f2',to:'g1',promotion:'n'}).status).toBe('correct')
    expect(linePositions(moves).positions).toHaveLength(moves.length+1)
  })
  it('sanitizes persisted progress and counts clean and assisted completions separately',()=>{
    const clean=validOpeningProgress({favorites:['a','a',null],sessions:{bad:{completed:-1},ok:{completed:3,clean:99}}})
    expect(clean.favorites).toEqual(['a']);expect(clean.sessions.bad).toBeUndefined();expect(clean.sessions.ok.clean).toBe(3)
    const first=recordOpeningCompletion(clean,'line:w',false),second=recordOpeningCompletion(first,'line:w',true)
    expect(second.sessions['line:w']).toMatchObject({completed:2,clean:1})
    expect(clean.sessions['line:w']).toBeUndefined()
    expect(validOpeningProgress(null).favorites).toEqual([])
  })
})
