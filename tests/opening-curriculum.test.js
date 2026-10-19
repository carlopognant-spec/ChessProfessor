import {describe,it,expect,vi} from 'vitest'
import {Chess} from 'chess.js'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {familyJourneys} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumTree,curriculumFork,curriculumOrder,nextCurriculumRoute,openingFrequencies} from '../src/lib/openingCurriculum.js'

describe('branching opening curriculum',()=>{
  it('finishes every family once, returning to an actual studied checkpoint for nested forks',()=>{
    for(const family of OPENING_LESSONS){
      const courses=familyJourneys(family.id),done=[]
      let next=nextCurriculumRoute(courses,done)
      expect(next.course.id).toBe(courses[0].id)
      while(next){
        const {course,index}=next
        expect(done).not.toContain(course.id)
        if(done.length){
          const previous=courses.find(c=>done.includes(c.id)&&commonPrefix(c.moves,course.moves)===index)
          expect(previous,course.id).toBeTruthy()
          const before=new Chess(),after=new Chess()
          previous.moves.slice(0,index).forEach(san=>before.move(san))
          course.moves.slice(0,index).forEach(san=>after.move(san))
          expect(before.fen()).toBe(after.fen())
          expect(previous.moves[index]).not.toBe(course.moves[index])
          expect(curriculumFork(courses,course.moves,index)?.children.size).toBeGreaterThan(1)
          // A black or white learner can resume without playing for the opponent.
          for(const side of ['w','b']){
            if(after.turn()!==side)after.move(course.moves[index])
            expect(after.turn()).toBe(side)
            after.load(before.fen())
          }
        }
        done.push(course.id);next=nextCurriculumRoute(courses,done)
      }
      expect(done).toHaveLength(courses.length)
    }
  })
  it('keeps the main line first, ranks alternatives by measured frequency and visits nested routes together',()=>{
    const courses=familyJourneys('caro')
    const statistics={'e4 c6 d4 d5':{status:'ready',counts:{Nc3:50,e5:100,exd5:500}}}
    expect(curriculumOrder(courses,statistics).map(c=>c.id)).toEqual(['caro','caro:exchange','caro:panov','caro:advance'])
    expect(nextCurriculumRoute(courses,['caro'],statistics)).toMatchObject({course:{id:'caro:exchange'},index:4})
    expect(nextCurriculumRoute(courses,['caro','caro:exchange'],statistics)).toMatchObject({course:{id:'caro:panov'},index:6})
    expect(curriculumOrder(courses).map(c=>c.id)).toEqual(['caro','caro:advance','caro:exchange','caro:panov'])
  })
  it('keeps ten King’s Indian systems, including an alternative nested inside the Classical route',()=>{
    const courses=familyJourneys('kings-indian')
    expect(courses).toHaveLength(10)
    const main=courses[0],bayonet=courses.find(c=>c.id.endsWith(':bayonet'))
    expect(commonPrefix(main.moves,bayonet.moves)).toBe(16)
    expect(curriculumTree(courses).courses).toHaveLength(10)
  })
  it('caches the specified practice sample, validates counts and tolerates network failures',async()=>{
    const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,json:async()=>({white:12,draws:3,black:5,moves:[{san:'e4',white:8,draws:2,black:4},{san:'d4',white:-1,draws:0,black:2}]})})
    try{
      const fen=new Chess().fen(),result=await openingFrequencies(fen,{token:'test-only-token'})
      expect(result).toMatchObject({status:'ready',total:20,counts:{e4:14}})
      expect(result.counts.d4).toBeUndefined()
      const url=new URL(fetch.mock.calls[0][0])
      expect(url.searchParams.get('ratings')).toBe('0,1000,1200,1400')
      expect(url.searchParams.get('speeds')).toBe('rapid,classical')
      expect(fetch.mock.calls[0][1].headers).toEqual({Authorization:'Bearer test-only-token'})
      expect(await openingFrequencies(fen)).toEqual(result)
      expect(fetch).toHaveBeenCalledTimes(1)
      fetch.mockRejectedValueOnce(Error('offline'))
      const b=new Chess();b.move('e4')
      expect(await openingFrequencies(b.fen())).toEqual({status:'unavailable'})
      fetch.mockResolvedValueOnce({ok:true,json:async()=>({white:0,draws:0,black:0,moves:[]})})
      b.move('e5');expect(await openingFrequencies(b.fen())).toEqual({status:'empty'})
      fetch.mockResolvedValueOnce({ok:false,status:401})
      b.move('Nf3');expect(await openingFrequencies(b.fen())).toEqual({status:'unavailable'})
      const calls=fetch.mock.calls.length
      b.move('Nc6');expect(await openingFrequencies(b.fen())).toEqual({status:'unavailable'})
      expect(fetch).toHaveBeenCalledTimes(calls)
    }finally{fetch.mockRestore()}
  })
})
