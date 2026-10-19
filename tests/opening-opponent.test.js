import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {openingOpponent} from '../src/lib/openingOpponent.js'
import {ALL_OPENING_JOURNEYS,journeyCoach} from '../src/lib/openingJourneys.js'

describe('opponent move and the next opening question',()=>{
  it('connects the White knight attack to defending e5 and contesting d4',()=>{
    const j=ALL_OPENING_JOURNEYS.find(j=>j.id==='italian'),coach=journeyCoach(j,3,'b')
    expect(coach.opponent).toMatchObject({san:'Nf3',color:'w',piece:'n',from:'g1',to:'f3',relatedSquares:['d4','e5']})
    expect(coach.opponent.text).toContain('Il Bianco ha giocato Nf3')
    expect(coach.opponent.text).toContain('cavallo in f3 controlla d4')
    expect(coach.opponent.text).toContain('attacca il pedone in e5')
    expect(coach.question).toBe('Come sostieni e5 e contendi d4?')
    expect(coach.question).not.toMatch(/c6|b8|cavallo/i)
    expect(coach.opponent.arrowTargets).toEqual([{from:'f3',to:'d4',kind:'control'},{from:'f3',to:'e5',kind:'attack'}])
  })
  it('distinguishes the Black knight defending e5 from attacking it',()=>{
    const j=ALL_OPENING_JOURNEYS.find(j=>j.id==='italian'),coach=journeyCoach(j,4,'w')
    expect(coach.opponent.text).toContain('Il Nero ha giocato Nc6')
    expect(coach.opponent.text).toContain('sostiene il pedone in e5')
    expect(coach.opponent.attackedPieces.some(p=>p.square==='e5')).toBe(false)
    expect(coach.opponent.defendedPieces).toContainEqual({type:'p',color:'b',square:'e5'})
    // Bc4 does not contest the two squares controlled by Nc6: keep its own goal.
    expect(coach.opponent.relatedSquares).toEqual([])
    expect(coach.question).toContain('f7')
  })
  it('describes the first White move when the learner chooses Black',()=>{
    const j=ALL_OPENING_JOURNEYS.find(j=>j.id==='caro')
    expect(journeyCoach(j,0,'w').opponent).toBeNull()
    expect(journeyCoach(j,1,'b').opponent.text).toContain('Il pedone in e4 controlla d5 e f5')
  })
  it('prioritizes an actual check over a quiet central goal',()=>{
    const board=new Chess();board.loadPgn('1. e4 e5 2. f3')
    const context=openingOpponent(board.fen(),'Qh4+','g3')
    expect(context.check).toBe(true)
    expect(context.text).toContain('Il tuo re è sotto scacco')
    expect(context.question).toContain('rispondi allo scacco')
    expect(context.arrowTargets).toContainEqual({from:'h4',to:'e1',kind:'attack'})
  })
  it('accounts for blockers instead of inventing a bishop attack through a pawn',()=>{
    const board=new Chess();board.loadPgn('1. d4 d5 2. c4 e6 3. Nf3 b6 4. Nc3 c6 5. e3')
    const context=openingOpponent(board.fen(),'Bb7','Bd3')
    expect(context.controlledSquares).not.toContain('d5')
    expect(context.controlledSquares).not.toContain('e4')
    expect(context.arrowTargets.some(a=>a.to==='e4'||a.to==='d5')).toBe(false)
    expect(context.defendedPieces.some(p=>p.square==='c6')).toBe(true)
  })
  it('reports en passant on the captured pawn’s real square and castling as two-piece movement',()=>{
    const board=new Chess();board.loadPgn('1. e4 a6 2. e5 d5')
    const ep=openingOpponent(board.fen(),'exd6','cxd6')
    expect(ep).toMatchObject({captured:'p',capturedSquare:'d5'})
    expect(ep.text).toContain('catturato il pedone in d5 en passant')
    board.reset();board.loadPgn('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5')
    const castle=openingOpponent(board.fen(),'O-O','Nf6')
    expect(castle.text).toContain('re è in g1 e la torre è entrata in f1')
    expect(castle.arrowTargets).toEqual([])
  })
  it('binds the displayed opponent facts to the current position throughout every route',()=>{
    for(const j of ALL_OPENING_JOURNEYS){
      const board=new Chess()
      for(let index=0;index<j.moves.length;index++){
        const side=board.turn(),coach=journeyCoach(j,index,side)
        if(index===0)expect(coach.opponent).toBeNull()
        else{
          const ctx=coach.opponent,enemy=side==='w'?'b':'w'
          expect(ctx.color,j.id).toBe(enemy)
          expect(ctx.after).toBe(board.fen())
          expect(board.get(ctx.to)).toMatchObject({type:ctx.piece,color:enemy})
          for(const square of ctx.controlledSquares)expect(board.attackers(square,enemy)).toContain(ctx.to)
          for(const p of ctx.attackedPieces)expect(board.get(p.square)).toMatchObject({type:p.type,color:side})
          for(const p of ctx.defendedPieces)expect(board.get(p.square)).toMatchObject({type:p.type,color:enemy})
          for(const arrow of ctx.arrowTargets){
            expect(board.attackers(arrow.to,enemy),`${j.id}: ${arrow.from}-${arrow.to}`).toContain(arrow.from)
            if(arrow.kind==='attack')expect(board.get(arrow.to)?.color).toBe(side)
            if(arrow.kind==='defense')expect(board.get(arrow.to)?.color).toBe(enemy)
            if(arrow.kind==='control')expect(board.get(arrow.to)).toBeUndefined()
          }
          const response=new Chess(board.fen()),move=response.move(coach.san)
          for(const square of ctx.relatedSquares){
            expect(ctx.controlledSquares).toContain(square)
            expect(response.attackers(square,side)).toContain(move.to)
            expect(board.attackers(square,side)).not.toContain(move.from)
          }
        }
        board.move(j.moves[index])
      }
    }
  })
})
