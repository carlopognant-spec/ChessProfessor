import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {OPENING_EXPANSION_PLAN} from '../src/lib/openingExpansionPlan.js'
import {ALL_OPENING_JOURNEYS,familyJourneys,journeyCoach} from '../src/lib/openingJourneys.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'
import expansion from '../src/data/openingExpansion.js'
import practical from '../src/data/openingPracticalCases.js'
import caroNotes from '../src/lib/openingCaroNotes.js'

const catalogText=fs.readFileSync('src/data/openingCatalog.json','utf8'),catalog=JSON.parse(catalogText)
const evidence=JSON.parse(fs.readFileSync('docs/data/opening-expansion-verification.json','utf8'))
const practicalEvidence=JSON.parse(fs.readFileSync('docs/data/opening-practical-verification.json','utf8'))
const key=board=>board.fen().split(' ').slice(0,4).join(' ')
const uci=move=>move.from+move.to+(move.promotion??'')
const replay=moves=>{const board=new Chess();moves.forEach(san=>board.move(san));return board}

describe('documented expansion across every opening family',()=>{
  it('accounts for all families, all declared branches and real additional courses',()=>{
    expect(new Set(OPENING_EXPANSION_PLAN.map(row=>row.family))).toEqual(new Set(OPENING_LESSONS.map(guide=>guide.id)))
    expect(new Set(OPENING_EXPANSION_PLAN.map(row=>row.id)).size).toBe(OPENING_EXPANSION_PLAN.length)
    for(const row of OPENING_EXPANSION_PLAN)expect(ALL_OPENING_JOURNEYS.some(course=>course.id===row.id),row.id).toBe(true)
    for(const guide of OPENING_LESSONS){
      const courses=familyJourneys(guide.id)
      expect(courses.filter(course=>course.expansion).length,guide.id).toBeGreaterThanOrEqual(3)
      expect(new Set(courses.map(course=>course.moves.join(' '))).size).toBe(courses.length)
    }
    expect(expansion.entries.length).toBeGreaterThanOrEqual(150)
    expect(familyJourneys('caro').length).toBeGreaterThanOrEqual(16)
    expect(expansion.source.sha256).toBe(createHash('sha256').update(catalogText).digest('hex'))
    expect(expansion.policy).toMatchObject({engine:'Stockfish 16',threads:1,nodesPerMove:200000,clearHash:true})
  })
  it('binds the named prefix to an actual source position, separately from the model continuation',()=>{
    for(const course of expansion.entries){
      const plan=OPENING_EXPANSION_PLAN.find(row=>row.id===course.id),source=catalog.entries.find(row=>row.id===course.expansion.sourceId)
      expect(plan).toBeTruthy();expect(source,course.id).toBeTruthy()
      const seed=new Chess();seed.loadPgn(plan.pgn)
      expect(course.moves.slice(0,seed.history().length)).toEqual(seed.history())
      const documented=new Chess();documented.loadPgn(plan.sourcePgn)
      const publishedPlies=documented.history().length
      expect(course.expansion.sourceSeedPlies).toBe(publishedPlies)
      expect(key(replay(source.moves.slice(0,publishedPlies))),course.id).toBe(key(documented))
      if(!course.expansion.transposition)expect(source.moves.slice(0,publishedPlies)).toEqual(documented.history())
      expect(key(replay(source.moves.slice(0,course.expansion.publishedPlies)))).toBe(key(replay(course.moves.slice(0,course.expansion.publishedPlies))))
      expect(course.whitePlan.length).toBeGreaterThan(50)
      expect(course.blackPlan.length).toBeGreaterThan(50)
      expect(course.contrast.length).toBeGreaterThan(80)
      expect(Object.values(course.editorialNotes)).toContain(plan.focus)
    }
  })
  it('replays every recorded search, its principal variation and the final teaching position offline',()=>{
    expect(evidence.evidence).toHaveLength(expansion.entries.length)
    for(const course of expansion.entries){
      const record=evidence.evidence.find(item=>item.id===course.id),board=replay(course.moves.slice(0,course.expansion.seedPlies))
      expect(record.checks).toHaveLength(course.moves.length-course.expansion.seedPlies)
      for(const check of record.checks){
        expect(check.before,course.id).toBe(board.fen())
        expect(check.depth).toBeGreaterThan(0)
        expect(check.nodes).toBeGreaterThan(0)
        expect(check.pv[0]).toBe(check.bestmove)
        if(check.searchmoves.length)expect(check.searchmoves).toContain(check.bestmove)
        const pv=new Chess(check.before)
        for(const move of check.pv)pv.move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]})
        const played=board.move(check.san)
        expect(uci(played)).toBe(check.bestmove)
        expect(course.moves[check.index]).toBe(played.san)
      }
      expect(board.fen()).toBe(record.endpoint)
      expect(board.isGameOver(),course.id).toBe(false)
      expect(course.moves).toHaveLength(32)
    }
  })
  it('keeps the individually reviewed Caro-Kann explanations on their exact lines',()=>{
    expect(Object.keys(caroNotes)).toHaveLength(12)
    for(const [id,review] of Object.entries(caroNotes)){
      const course=ALL_OPENING_JOURNEYS.find(item=>item.id===id)
      expect(course.moves.join(' '),id).toBe(review.line)
      expect(Object.keys(review.notes)).toHaveLength(3)
      for(const [index,text] of Object.entries(review.notes)){
        expect(journeyCoach(course,Number(index),'w').debrief).toBe(text)
        expect(journeyCoach(course,Number(index)+1,'b').debrief).toBe(text)
      }
    }
  })
  it('grounds the Caro-Kann double attacks and structural explanations in the actual board',()=>{
    for(const [id,end,from,targets] of [
      ['caro:two-knights',28,'b4',['d3','c2']],
      ['caro:advance-bayonet',18,'d4',['e3','c3']],
      ['caro:hillbilly',18,'f6',['e4','g4']],
    ]){
      const course=ALL_OPENING_JOURNEYS.find(course=>course.id===id),board=replay(course.moves.slice(0,end))
      for(const target of targets){expect(board.attackers(target,'b'),`${id}: ${target}`).toContain(from);expect(board.get(target)?.color).toBe('w')}
    }
    const tartakower=replay(ALL_OPENING_JOURNEYS.find(course=>course.id==='caro:tartakower').moves.slice(0,20))
    expect(tartakower.get('a6')).toMatchObject({type:'p',color:'b'})
    expect(tartakower.get('a7')).toMatchObject({type:'p',color:'b'})
    expect(tartakower.board().flat().filter(piece=>piece?.color==='b'&&piece.type==='b')).toHaveLength(2)
    expect(tartakower.board().flat().filter(piece=>piece?.color==='b'&&piece.type==='n')).toHaveLength(0)
    const panov=replay(ALL_OPENING_JOURNEYS.find(course=>course.id==='caro:panov-nc6').moves.slice(0,14))
    expect(panov.get('c5')).toMatchObject({type:'p',color:'w'})
    expect(panov.get('d4')).toMatchObject({type:'p',color:'w'})
  })
  for(const guide of OPENING_LESSONS)it(`plays both colors through every new ${guide.id} route with position-bound coaching`,()=>{
    for(const course of familyJourneys(guide.id).filter(item=>item.expansion))for(const side of ['w','b']){
      let index=initialPracticeIndex(course.moves,side)
      while(index<course.moves.length){
        const coach=journeyCoach(course,index,side),board=new Chess(coach.before)
        expect(board.turn()).toBe(side)
        expect(coach.question).toMatch(/[?!]$/)
        expect(board.move(coach.san).san).toBe(course.moves[index])
        const result=practiceMove(course.moves,index,side,coach.san)
        expect(['correct','complete']).toContain(result.status)
        index=result.index
      }
      expect(index).toBe(course.moves.length)
    }
  })
})

describe('constructed practical deviations',()=>{
  const value={p:1,n:3,b:3,r:5,q:9,k:0}
  const material=(board,side)=>board.board().flat().filter(Boolean).reduce((sum,piece)=>sum+(piece.color===side?1:-1)*value[piece.type],0)
  it('gives every family exercises without labelling them as frequent historical errors',()=>{
    for(const guide of OPENING_LESSONS)expect(practical.entries.some(item=>item.family===guide.id),guide.id).toBe(true)
    expect(new Set(practical.entries.map(item=>item.id)).size).toBe(practical.entries.length)
    expect(new Set(practical.entries.map(item=>item.courseId))).toEqual(new Set(ALL_OPENING_JOURNEYS.map(course=>course.id)))
    expect(practical.uncovered).toHaveLength(0)
    expect(practical.entries.every(item=>item.kind==='constructed-deviation-v1')).toBe(true)
    expect(practicalEvidence.evidence).toHaveLength(practical.entries.length)
    expect(practical.uncovered).toEqual(practicalEvidence.uncovered)
  })
  it('validates solutions and material against every legal immediate reply, independently of engine scores',()=>{
    for(const item of practical.entries){
      const course=ALL_OPENING_JOURNEYS.find(course=>course.id===item.courseId),proof=practicalEvidence.evidence.find(proof=>proof.id===item.id)
      expect(item.moves.slice(0,item.startIndex-1)).toEqual(course.moves.slice(0,item.startIndex-1))
      const board=replay(item.moves.slice(0,item.startIndex-1)),initial=material(board,item.exerciseSide)
      expect(board.fen()).toBe(proof.before)
      board.move(proof.mistake);expect(board.fen()).toBe(proof.after)
      expect(board.turn()).toBe(item.exerciseSide)
      const coach=journeyCoach(item,item.startIndex,item.exerciseSide)
      expect(coach.before).toBe(board.fen())
      const answer=board.move(coach.san)
      expect(answer.san).toBe(proof.answer)
      expect(uci(answer)).toBe(proof.search.bestmove)
      expect(board.fen()).toBe(proof.answerFen)
      let minimum=material(board,item.exerciseSide)-initial
      const legalReplies=board.moves({verbose:true})
      for(const reply of legalReplies){board.move(reply);expect(board.isCheckmate(),item.id).toBe(false);minimum=Math.min(minimum,material(board,item.exerciseSide)-initial);board.undo()}
      expect(minimum).toBe(proof.minimumImmediateMaterialGain)
      expect(proof.search.cp+proof.baseline.cp).toBeGreaterThanOrEqual(200)
      expect(item.kind).toBe('constructed-deviation-v1')
      expect(item.startIndex).toBe(item.moves.length-1)
      expect(minimum).toBeGreaterThanOrEqual(2)
      expect(practiceMove(item.moves,item.startIndex,item.exerciseSide,coach.san).status).toBe('complete')
    }
  })
})
