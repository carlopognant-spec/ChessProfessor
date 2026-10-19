import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {OPENING_JOURNEYS,journeyCoach} from '../src/lib/openingJourneys.js'
import {OPENING_STORIES,STORY_LINES} from '../src/lib/openingStories.js'
import {linePositions,initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'

describe('partite guidate dall’apertura al mediogioco',()=>{
  it('covers every family with a legal, ongoing route of at least sixteen full moves',()=>{
    expect(OPENING_JOURNEYS.map(j=>j.id)).toEqual(OPENING_LESSONS.map(j=>j.id))
    for(const journey of OPENING_JOURNEYS){
      expect(journey.moves.length,journey.id).toBeGreaterThanOrEqual(32)
      expect(journey.moves.length%2).toBe(0)
      const {positions}=linePositions(journey.moves)
      expect(new Chess(positions.at(-1)).isGameOver(),journey.id).toBe(false)
      expect(journey.whitePlan.length).toBeGreaterThan(80)
      expect(journey.blackPlan.length).toBeGreaterThan(80)
    }
  })
  it('lets both colors play every one of their moves through all three stages',()=>{
    for(const journey of OPENING_JOURNEYS)for(const side of ['w','b']){
      const stages=new Set(),{positions}=linePositions(journey.moves)
      let index=initialPracticeIndex(journey.moves,side),played=0
      while(index<journey.moves.length){
        const coach=journeyCoach(journey,index,side)
        stages.add(coach.stage.id)
        expect(coach.before).toBe(positions[index])
        expect(new Chess(coach.before).turn()).toBe(side)
        expect(coach.situation.length).toBeGreaterThan(15)
        expect(coach.question).toMatch(/[?!]$/)
        expect(coach.debrief.length).toBeGreaterThan(40)
        const move=new Chess(coach.before).move({from:coach.from,to:coach.to})
        expect(move.san).toBe(journey.moves[index])
        const response=practiceMove(journey.moves,index,side,move.san)
        expect(['correct','complete']).toContain(response.status)
        expect(response.index).toBeGreaterThan(index)
        index=response.index;played++
      }
      expect(played).toBe(journey.moves.length/2)
      expect([...stages]).toEqual(['opening','development','middlegame'])
      expect(journeyCoach(journey,index,side).plan).toBe(side==='w'?journey.whitePlan:journey.blackPlan)
    }
  })
  it('explains the Italian knight route and central break in the actual position',()=>{
    const italian=OPENING_JOURNEYS.find(j=>j.id==='italian')
    expect(journeyCoach(italian,16,'w')).toMatchObject({from:'b1',to:'d2'})
    expect(journeyCoach(italian,18,'w').situation).toContain('f1')
    expect(journeyCoach(italian,20,'w').debrief).toContain('Cg3')
    expect(journeyCoach(italian,23,'b').guidedQuestion).toContain('contesta e4')
    const start=journeyCoach(italian,0,'w').before
    expect(practiceMove(italian.moves,0,'w','d4')).toMatchObject({status:'different-line',index:0})
    expect(journeyCoach(italian,0,'w').before).toBe(start)
  })
  it('binds all authored stories to their exact route and has no generic missing-move fallback',()=>{
    expect(Object.keys(OPENING_STORIES).sort()).toEqual(OPENING_JOURNEYS.map(j=>j.id).sort())
    for(const journey of OPENING_JOURNEYS){
      expect(journey.moves.join(' '),journey.id).toBe(STORY_LINES[journey.id])
      const rows=OPENING_STORIES[journey.id]
      expect(rows,journey.id).toHaveLength(journey.moves.length/2)
      expect(new Set(rows.map(row=>row.debrief)).size,journey.id).toBe(rows.length)
      for(const row of rows)for(const color of ['white','black']){
        expect(row[color].situation).not.toBe(row[color].question)
        expect(row[color].question).not.toMatch(/Guarda come cambiano|Confronta il suo nuovo ruolo/)
        expect(row.reference).toBeUndefined()
      }
    }
    const missing={...OPENING_JOURNEYS[0],id:'missing-story'}
    expect(()=>journeyCoach(missing,0,'w')).toThrow('Missing opening story')
  })
  it('asks about the King’s Gambit before revealing the answer and explains its concrete danger',()=>{
    const journey=OPENING_JOURNEYS.find(j=>j.id==='kings-gambit')
    const offer=journeyCoach(journey,2,'w'),knight=journeyCoach(journey,4,'w')
    expect(offer.guidedQuestion).toContain('attacca e5')
    expect(offer.situation+' '+offer.question).not.toContain('f4')
    expect(knight.situation).toContain('Dh4+')
    expect(knight.guidedQuestion).toContain('controllare h4')
    expect(knight.question).not.toContain('f3')
    const board=new Chess(knight.before)
    const material=color=>board.board().flat().filter(p=>p?.color===color).reduce((sum,p)=>sum+({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)
    expect(material('b')-material('w')).toBe(1)
    board.move(knight.san)
    expect(board.moves()).toEqual(expect.arrayContaining(['g5','d5','Qh4+']))
    board.move('Qh4+')
    expect(board.move('Nxh4').captured).toBe('q')
    expect(knight.debrief).toContain('resterebbe legale')
    expect(knight.debrief).toContain('…g5')
  })
  it('places the pieces named in current situations on the actual squares',()=>{
    const types={pedone:'p',cavallo:'n',alfiere:'b',torre:'r',donna:'q',re:'k'}
    for(const journey of OPENING_JOURNEYS){
      const board=new Chess()
      for(let i=0;i<journey.moves.length;i++){
        const {situation}=journeyCoach(journey,i,board.turn())
        // Captures already made and hypothetical future moves describe another
        // board; only assertions about the current position belong in this check.
        if(!/catturato|potrebbe/.test(situation))for(const match of situation.matchAll(/\b(pedone|cavallo|alfiere|torre|donna|re)\s+(?:in\s+)?([a-h][1-8])\b/gi)){
          expect(board.get(match[2])?.type,`${journey.id}:${i} ${situation}`).toBe(types[match[1].toLowerCase()])
        }
        board.move(journey.moves[i])
      }
    }
  })
  it('grounds the French and Catalan bishop questions in their actual queen attacks',()=>{
    for(const [id,index,from]of [['french',29,'b5'],['catalan',27,'a6']]){
      const journey=OPENING_JOURNEYS.find(j=>j.id===id),coach=journeyCoach(journey,index,'b')
      expect(coach.guidedQuestion).toContain('donna d3')
      const board=new Chess(coach.before);board.move(coach.san)
      expect(board.get('d3')).toMatchObject({type:'q',color:'w'})
      expect(board.attackers('d3','b')).toContain(from)
    }
  })
})
