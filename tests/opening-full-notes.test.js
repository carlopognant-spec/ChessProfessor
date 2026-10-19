import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {createHash} from 'node:crypto'
import notes from '../src/lib/openingFullNotes.js'
import {ALL_OPENING_JOURNEYS,familyJourneys,journeyCoach,openingWrittenContext} from '../src/lib/openingJourneys.js'
import {openingTurnReview} from '../src/lib/openingMoveReview.js'
import coverage from '../docs/data/opening-commentary-coverage.json'

const course=id=>ALL_OPENING_JOURNEYS.find(row=>row.id===id)
const boardAt=(id,index)=>{
  const board=new Chess();course(id).moves.slice(0,index).forEach(san=>board.move(san));return board
}
const pawns=(board,color,file)=>board.board().flat().filter(piece=>piece?.type==='p'&&piece.color===color&&piece.square[0]===file)

const completedFamilies={london:5,catalan:5,nimzo:5,'queens-indian':5,bogo:6}

describe('complete written pair commentary',()=>{
  it('fills 230 previously uncovered pairs without replacing key-position notes',()=>{
    expect(Object.keys(notes)).toHaveLength(21)
    const texts=[]
    for(const [id,row] of Object.entries(notes)){
      expect(row.line,id).toBe(course(id).moves.join(' '))
      for(const [pair,text] of Object.entries(row.notes)){
        expect(Number(pair)%2).toBe(0)
        expect(Number(pair)).toBeLessThan(course(id).moves.length)
        expect(text.length).toBeGreaterThan(125)
        expect(text).not.toMatch(/undefined|il torre|all\?alfiere|mossa obbligata|vittoria garantita/)
        for(const side of ['w','b']){
          const index=Number(pair)+Number(side==='b')
          if(index<course(id).moves.length)expect(journeyCoach(course(id),index,side).debrief).toBe(text)
        }
        texts.push(text)
      }
    }
    expect(texts).toHaveLength(230)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it('has written commentary at every pair of every course in the five completed families',()=>{
    for(const [family,count] of Object.entries(completedFamilies)){
      expect(familyJourneys(family)).toHaveLength(count)
      for(const row of familyJourneys(family))for(let index=0;index<row.moves.length;index++){
        expect(openingWrittenContext(row,index).debriefOrigin,`${row.id}:${index}`).toBe('written')
        expect(journeyCoach(row,index,index%2?'b':'w').debrief).toBe(openingWrittenContext(row,index).debrief)
      }
    }
    expect(coverage.fullyWrittenCourses).toBe(58)
    expect(coverage.writtenPairs).toBe(1974)
    expect(coverage.pairs).toBe(4492)
    expect(coverage.additionalPairNotes).toBe(230)
    expect(coverage.fullyWrittenFamilies.sort()).toEqual(Object.keys(completedFamilies).sort())
    const digest=createHash('sha256').update(JSON.stringify(ALL_OPENING_JOURNEYS.map(row=>({id:row.id,moves:row.moves})))).digest('hex')
    expect(coverage.courseDigest).toBe(digest)
    for(const [family,count] of Object.entries(completedFamilies)){
      const report=coverage.familyRows.find(row=>row.id===family)
      expect(report.writtenPairs).toBe(report.pairs)
      expect(report.fullyWrittenCourses).toBe(count)
      expect(report.rows.every(row=>row.positionOnly.length===0)).toBe(true)
    }
  })

  it('invalidates additional notes if any part of the frozen line changes',()=>{
    for(const [id,row] of Object.entries(notes)){
      const original=course(id),board=boardAt(id,original.moves.length-1)
      const alternative=board.moves().find(san=>san!==original.moves.at(-1))
      expect(alternative,id).toBeTruthy()
      const changed={...original,moves:[...original.moves.slice(0,-1),alternative]}
      for(const [pair,text] of Object.entries(row.notes))expect(openingWrittenContext(changed,Number(pair)).debrief,id).not.toBe(text)
    }
  })

  it('keeps a next White reply distinct from the strategic pair and the last solo White move',()=>{
    for(const id of ['london:indian','catalan:open','nimzo:classical','queens-indian:petrosian','bogo:knight']){
      const row=course(id)
      expect(row.moves).toHaveLength(31)
      const black=openingTurnReview(row.moves,29,'b')
      expect(black.reply.san).toBe(row.moves[30])
      expect(black.reply.color).toBe('w')
      const final=openingTurnReview(row.moves,30,'w')
      expect(final.reply).toBeNull()
      expect(final.played.after).toBe(black.after)
      expect(openingWrittenContext(row,30).debrief).toContain('non è ancora mostrata')
    }
  })

  it('distinguishes a prepared e5 from actual support through an occupied e7',()=>{
    const early=boardAt('london:indian',4)
    expect(early.get('d4')).toMatchObject({color:'w',type:'p'})
    expect(early.get('e5')).toBeUndefined()
    for(const target of ['d4','e5'])expect(early.attackers(target,'w')).toContain('f3')
    expect(notes['london:indian'].notes[2]).toContain('sostiene d4 e controlla e5')
    const board=boardAt('london:indian',14)
    expect(board.get('e7')).toMatchObject({color:'b',type:'p'})
    expect(board.attackers('e5','b')).not.toContain('e8')
    board.move('c4');board.move('e5')
    expect(board.attackers('e5','b')).toContain('e8')
    expect(notes['london:indian'].notes[12]).toContain('futura ...e5')
  })

  it('tracks two threats and a discovered bishop attack in the London branches',()=>{
    const double=boardAt('london:early-c5',16)
    for(const target of ['f5','c3']){
      expect(double.get(target)).toMatchObject({type:'n',color:'w'})
      expect(double.attackers(target,'b')).toContain('a5')
    }
    expect(notes['london:early-c5'].notes[14]).toContain('entrambi i cavalli f5 e c3')
    const bishop=boardAt('london:queen-pressure',24)
    expect(bishop.get('d1')).toMatchObject({color:'w',type:'q'})
    expect(bishop.attackers('d1','b')).toContain('h5')
    expect(notes['london:queen-pressure'].notes[22]).toContain('donna d1')
    const jobava=boardAt('london:jobava',28)
    expect(pawns(jobava,'w','e')).toHaveLength(2)
    expect(jobava.attackers('h4','b')).toContain('d8')
    expect(notes['london:jobava'].notes[26]).toContain('doppiato i pedoni e')
    const diagonal=boardAt('london:jobava',20)
    expect(diagonal.get('h7')).toMatchObject({color:'b',type:'p'})
    expect(diagonal.attackers('h7','w')).toContain('c2')
  })

  it('does not draw through the Catalan d5 pawn and tracks its later isolation',()=>{
    const closed=boardAt('catalan:closed',22)
    expect(closed.get('d5')).toMatchObject({color:'b',type:'p'})
    expect(closed.attackers('d5','b')).toContain('b7')
    expect(closed.attackers('e4','b')).not.toContain('b7')
    expect(notes['catalan:closed'].notes[20]).toContain('a sostegno di d5')
    const structure=boardAt('catalan:closed',30)
    expect(pawns(structure,'b','c')).toHaveLength(0)
    expect(pawns(structure,'b','d')).toHaveLength(1)
    expect(pawns(structure,'b','e')).toHaveLength(0)
    for(const color of ['w','b'])expect(pawns(structure,color,'e')).toHaveLength(0)
    expect(notes['catalan:closed'].notes[28]).toContain('d5 isolato')
  })

  it('retains the actual bishop pair after the b5 exchange and the blocked bishop line',()=>{
    const board=boardAt('catalan:check',28)
    expect(board.board().flat().filter(piece=>piece?.color==='w'&&piece.type==='b')).toHaveLength(2)
    expect(board.board().flat().filter(piece=>piece?.color==='b'&&piece.type==='b')).toHaveLength(1)
    expect(pawns(board,'w','b')).toHaveLength(2)
    expect(board.get('e4')).toMatchObject({color:'b',type:'n'})
    expect(board.attackers('d2','b')).toContain('e4')
    expect(board.attackers('g3','b')).toContain('e4')
    const final=boardAt('catalan:check',32)
    expect(final.get('f2')).toMatchObject({color:'w',type:'p'})
    expect(final.attackers('h4','w')).not.toContain('e1')
    expect(final.attackers('e4','b')).toContain('f5')
  })
})
