import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {openingMoveReview,openingTurnReview} from '../src/lib/openingMoveReview.js'
import {openingOpponent} from '../src/lib/openingOpponent.js'
import {ALL_OPENING_JOURNEYS,familyJourneys,journeyCoach} from '../src/lib/openingJourneys.js'
import {practiceMove,linePositions} from '../src/lib/openingLibrary.js'
import practical from '../src/data/openingPracticalCases.js'

const course=id=>ALL_OPENING_JOURNEYS.find(row=>row.id===id)
const before=(id,index)=>{const b=new Chess();course(id).moves.slice(0,index).forEach(san=>b.move(san));return b}
const pawns=(board,color,file)=>board.board().flat().filter(p=>p?.type==='p'&&p.color===color&&p.square[0]===file)

describe('a review for the actual learner turn',()=>{
  it('follows Black with the next White move, instead of repeating the previous White move',()=>{
    const italian=course('italian'),review=openingTurnReview(italian.moves,1,'b')
    expect(review.played).toMatchObject({san:'e5',color:'b',from:'e7',to:'e5'})
    expect(review.reply).toMatchObject({san:'Nf3',color:'w',from:'g1',to:'f3'})
    expect(review.reply.san).not.toBe(italian.moves[0])
    expect(review.played.after).toBe(review.reply.before)
    const result=practiceMove(italian.moves,1,'b','e5')
    expect(review.after).toBe(linePositions(italian.moves).positions[result.index])
  })
  it('follows White with Black and handles either color finishing without a reply',()=>{
    const white=openingTurnReview(['e4','e5'],0,'w'),black=openingTurnReview(['e4','e5'],1,'b')
    expect(white.played.color).toBe('w');expect(white.reply.color).toBe('b')
    expect(black.reply).toBeNull()
    expect(openingTurnReview(['e4'],0,'w').reply).toBeNull()
    expect(()=>openingTurnReview(['e4','e5'],0,'b')).toThrow('Invalid opening review turn')
    expect(()=>openingTurnReview(['e4','e5'],2,'w')).toThrow('Invalid opening review turn')
  })
  it('keeps strategic prose distinguishable from the automatic position description',()=>{
    expect(journeyCoach(course('italian'),0,'w').debriefOrigin).toBe('written')
    expect(journeyCoach(course('sicilian:morra'),16,'w').debriefOrigin).toBe('written')
    const row=course('scandinavian:qd6')
    expect(row.moves).toHaveLength(32)
    expect(journeyCoach(row,28,'w').debriefOrigin).toBe('position-effects')
  })
})

describe('concrete single-move effects',()=>{
  it('attributes a discovered attack to the bishop, rather than inventing a knight attack on h4',()=>{
    const board=before('queens-gambit:lasker',13),review=openingMoveReview(board.fen(),'Ne4')
    expect(review.facts.find(fact=>fact.kind==='attack').targets).toContain('c3')
    expect(review.facts.find(fact=>fact.kind==='uncovered-attack').attacks).toContainEqual({from:'e7',to:'h4',piece:'b',target:'b'})
    const context=openingOpponent(board.fen(),'Ne4','Bxe7')
    expect(context.text).toContain('alfiere in e7')
    expect(context.arrowTargets).toContainEqual({from:'e7',to:'h4',kind:'attack'})
    expect(context.arrowTargets).not.toContainEqual({from:'e4',to:'h4',kind:'attack'})
    expect(context.question).toContain('pressione su h4')
    expect(context.question).not.toContain('Bxe7')
  })
  it('respects a pawn blocking the Arcangelo bishop instead of drawing through it',()=>{
    const board=before('spanish:archangel',17),context=openingOpponent(board.fen(),'Bb6','a4')
    expect(context.arrowTargets).toContainEqual({from:'b6',to:'d4',kind:'attack'})
    expect(context.arrowTargets.some(arrow=>arrow.from==='b6'&&arrow.to==='f2')).toBe(false)
  })
  it('distinguishes the en passant pawn square from the destination',()=>{
    const board=new Chess();board.loadPgn('1. e4 a6 2. e5 d5')
    const review=openingMoveReview(board.fen(),'exd6')
    expect(review.capturedSquare).toBe('d5')
    expect(review.summary).toContain('pedone in d5 en passant e raggiunge d6')
    const after=new Chess(review.after)
    expect(after.get('d5')).toBeUndefined()
    expect(after.get('d6')).toMatchObject({color:'w',type:'p'})
  })
  it('reports that d5 is no longer isolated when the f-pawn recaptures in e6',()=>{
    const review=openingMoveReview(before('queens-gambit:tarrasch',25).fen(),'fxe6')
    expect(review.facts).toContainEqual(expect.objectContaining({kind:'isolation-resolved',color:'b',file:'d'}))
    expect(new Chess(review.after).get('d5')).toMatchObject({color:'b',type:'p'})
    expect(new Chess(review.after).get('e6')).toMatchObject({color:'b',type:'p'})
  })
  it('does not call an unchanged isolated pawn a newly isolated pawn when it advances',()=>{
    const board=new Chess('4k3/7p/8/8/3P4/8/8/4K3 w - - 0 1')
    const review=openingMoveReview(board.fen(),'d5')
    expect(review.facts.some(fact=>fact.kind==='isolated-pawn'&&fact.color==='w')).toBe(false)
  })
  it('distinguishes open files, semi-open files and a rook behind its own pawn',()=>{
    for(const [fen,san,expected] of [
      ['4k3/8/8/8/8/8/8/R3K3 w Q - 0 1','Ra3',{file:'a',open:true}],
      ['4k3/p7/8/8/8/8/8/R3K3 w Q - 0 1','Ra3',{file:'a',open:false}],
      ['4k3/8/8/8/8/8/1P6/R3K3 w Q - 0 1','Rb1',{file:'b',blocked:true}],
    ])expect(openingMoveReview(fen,san).facts.find(fact=>fact.kind==='rook-file')).toMatchObject(expected)
  })
  it('names both castling pieces and does not claim that a blocked bishop already attacks the center',()=>{
    const board=new Chess();board.loadPgn('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5')
    const review=openingMoveReview(board.fen(),'O-O')
    expect(review.summary).toContain('re in g1 e la torre in f1')
    expect(review.facts.some(fact=>fact.kind==='castling-rights')).toBe(false)
    const breyer=openingMoveReview(before('spanish:breyer',17).fen(),'Nb8')
    expect(breyer.facts.flatMap(fact=>fact.attacks??[]).some(attack=>attack.from==='c8'&&attack.to==='e4')).toBe(false)
  })
  it('separates checking, answering a check and promoting',()=>{
    const board=new Chess();board.loadPgn('1. e4 e5 2. f3')
    const check=openingMoveReview(board.fen(),'Qh4+')
    expect(check.facts.some(fact=>fact.kind==='check')).toBe(true)
    const reply=openingMoveReview(check.after,'g3')
    expect(reply.facts.find(fact=>fact.kind==='answered-check').text).toContain('re del Bianco')
    expect(reply.facts.some(fact=>fact.kind==='answered-check'&&fact.text.includes('tuo'))).toBe(false)
    const promotion=openingMoveReview('4k3/1P6/8/8/8/8/8/4K3 w - - 0 1','b8=N')
    expect(promotion.facts).toContainEqual(expect.objectContaining({kind:'promotion',piece:'n',to:'b8'}))
  })

  it('binds every explanation and highlighted target to the played board throughout all 280 courses',()=>{
    expect(ALL_OPENING_JOURNEYS).toHaveLength(280)
    expect(new Set(ALL_OPENING_JOURNEYS.map(row=>row.family))).toHaveLength(37)
    for(const course of ALL_OPENING_JOURNEYS){
      const board=new Chess()
      for(const san of course.moves){
        const review=openingMoveReview(board.fen(),san),color=board.turn(),enemy=color==='w'?'b':'w'
        expect(review.before).toBe(board.fen())
        const played=board.move(san)
        expect(review.after).toBe(board.fen())
        expect(review.color).toBe(color)
        expect(review.from).toBe(played.from);expect(review.to).toBe(played.to)
        expect(review.summary.length).toBeGreaterThan(15)
        expect(review.summary).not.toMatch(/undefined|il torre|sul torre/)
        expect(review.facts.length).toBeGreaterThan(0)
        expect(review.details.length).toBeLessThanOrEqual(2)
        for(const fact of review.facts){
          expect(fact.text).not.toMatch(/undefined|il torre|sul torre|all\?alfiere|(?:pressione|sostegno) a (?:il |la |l[’'])/)
          if(['attack','defense','central-control','piece-control','piece-support'].includes(fact.kind)){
            for(const target of fact.targets){
              expect(board.attackers(target,color),`${course.id}: ${fact.kind} ${fact.from}-${target}`).toContain(fact.from)
              if(fact.kind==='attack')expect(board.get(target)?.color).toBe(enemy)
              if(fact.kind==='defense'||fact.kind==='piece-support')expect(board.get(target)?.color).toBe(color)
            }
          }
          if(fact.kind==='uncovered-attack')for(const attack of fact.attacks){
            expect(board.attackers(attack.to,color)).toContain(attack.from)
            expect(new Chess(review.before).attackers(attack.to,color)).not.toContain(attack.from)
          }
          if(fact.kind==='open-file')for(const side of ['w','b'])expect(pawns(board,side,fact.file)).toHaveLength(0)
          if(fact.kind==='semi-open-file'){
            expect(pawns(board,fact.color,fact.file)).toHaveLength(0)
            expect(pawns(board,fact.color==='w'?'b':'w',fact.file).length).toBeGreaterThan(0)
          }
        }
      }
    }
  },60000)

  it('reaches the real next learner position for both colors and all practical exercises',()=>{
    for(const family of ['italian','caro','sicilian','kings-indian','queens-gambit'])for(const row of familyJourneys(family))for(const side of ['w','b']){
      const {positions}=linePositions(row.moves)
      for(let index=Number(side==='b');index<row.moves.length;index+=2){
        const review=openingTurnReview(row.moves,index,side),played=practiceMove(row.moves,index,side,row.moves[index])
        expect(review.after,row.id).toBe(positions[played.index])
      }
    }
    for(const row of practical.entries){
      const review=openingTurnReview(row.moves,row.startIndex,row.exerciseSide)
      expect(review.reply).toBeNull()
      const result=practiceMove(row.moves,row.startIndex,row.exerciseSide,row.moves[row.startIndex])
      expect(review.after).toBe(linePositions(row.moves).positions[result.index])
    }
  },60000)
})
