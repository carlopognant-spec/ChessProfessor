import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {OPENING_JOURNEYS,journeyCoach} from '../src/lib/openingJourneys.js'
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
        expect(coach.advice.length).toBeGreaterThan(20)
        expect(coach.reason.length).toBeGreaterThan(20)
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
    expect(journeyCoach(italian,18,'w').reason).toContain('f1')
    expect(journeyCoach(italian,20,'w').reason).toContain('g3')
    expect(journeyCoach(italian,23,'b').reason).toContain('d5')
    const start=journeyCoach(italian,0,'w').before
    expect(practiceMove(italian.moves,0,'w','d4')).toMatchObject({status:'different-line',index:0})
    expect(journeyCoach(italian,0,'w').before).toBe(start)
  })
})
