import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {ALL_OPENING_JOURNEYS,familyJourneys,journeyCoach} from '../src/lib/openingJourneys.js'
import {OPENING_VARIANTS} from '../src/lib/openingVariants.js'
import {initialPracticeIndex,practiceMove,recordOpeningCompletion,validOpeningProgress} from '../src/lib/openingLibrary.js'

describe('opening curricula and alternative structures',()=>{
  it('gives every family distinct playable routes and covers the major Caro-Kann choices',()=>{
    expect(new Set(ALL_OPENING_JOURNEYS.map(j=>j.id)).size).toBe(ALL_OPENING_JOURNEYS.length)
    for(const guide of OPENING_LESSONS){
      const courses=familyJourneys(guide.id)
      expect(courses.length,guide.id).toBeGreaterThanOrEqual(2)
      expect(new Set(courses.map(j=>j.moves.join(' '))).size,guide.id).toBe(courses.length)
      for(const j of courses){
        expect(j.moves.length,j.id).toBeGreaterThanOrEqual(30)
        const board=new Chess();for(const san of j.moves)board.move(san)
        expect(board.isGameOver(),j.id).toBe(false)
      }
    }
    expect(familyJourneys('caro').map(j=>j.id)).toEqual(expect.arrayContaining(['caro','caro:advance','caro:exchange','caro:panov']))
    expect(familyJourneys('sicilian').map(j=>j.title)).toEqual(expect.arrayContaining(['Dragone','Najdorf','Alapin']))
  })
  it('lets either color finish every new route with questions and feedback bound to the position',()=>{
    for(const j of OPENING_VARIANTS)for(const side of ['w','b']){
      let index=initialPracticeIndex(j.moves,side),played=0
      while(index<j.moves.length){
        const coach=journeyCoach(j,index,side),board=new Chess(coach.before)
        expect(board.turn()).toBe(side)
        expect(coach.question).toMatch(/[?!]$/)
        expect(coach.debrief.length).toBeGreaterThan(30)
        expect(board.move({from:coach.from,to:coach.to}).san).toBe(j.moves[index])
        const response=practiceMove(j.moves,index,side,coach.san)
        expect(['correct','complete']).toContain(response.status)
        index=response.index;played++
      }
      expect(played).toBe(side==='w'?Math.ceil(j.moves.length/2):Math.floor(j.moves.length/2))
    }
  })
  it('asks for an objective and keeps the moving piece in optional help',()=>{
    const caro=familyJourneys('caro')[0],coach=journeyCoach(caro,4,'w')
    expect(coach.question).not.toMatch(/cavallo|c3|b1/i)
    expect(coach.hint).toContain('cavallo in b1')
    expect(coach.guidedQuestion).toContain('cavallo')
    const castle=journeyCoach(familyJourneys('italian')[0],10,'w')
    expect(castle.question).not.toMatch(/arrocc|g1|f1/i)
  })
  it('explains what distinguishes the Caro-Kann branches at their structural decisions',()=>{
    const advance=familyJourneys('caro').find(j=>j.id==='caro:advance')
    const exchange=familyJourneys('caro').find(j=>j.id==='caro:exchange')
    const panov=familyJourneys('caro').find(j=>j.id==='caro:panov')
    expect(journeyCoach(advance,4,'w').debrief).toContain('chiude la tensione centrale')
    expect(journeyCoach(exchange,4,'w').debrief).toContain('colonna e è semiaperta')
    const coach=journeyCoach(panov,12,'w'),board=new Chess(coach.before)
    board.move('cxd5');board.move('Nxd5')
    expect(board.get('d4')).toMatchObject({type:'p',color:'w'})
    expect(board.board().flat().filter(p=>p?.color==='w'&&p.type==='p'&&['c','e'].includes(p.square[0]))).toHaveLength(0)
    expect(coach.debrief).toContain('pedone d4 è isolato')
  })
  it('keeps variant progress separate and preserves the legacy base-course key',()=>{
    let progress=validOpeningProgress(null)
    progress=recordOpeningCompletion(progress,'journey:v1:caro:w',true)
    progress=recordOpeningCompletion(progress,'journey:v1:caro:panov:w',false)
    expect(progress.sessions['journey:v1:caro:w']).toMatchObject({completed:1,clean:1})
    expect(progress.sessions['journey:v1:caro:panov:w']).toMatchObject({completed:1,clean:0})
    expect(progress.sessions['journey:v1:caro:advance:w']).toBeUndefined()
  })
})
