import fs from 'node:fs'
import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {createHash} from 'node:crypto'
import additions from '../src/data/openingSicilianEarlyCourses.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import {ALL_OPENING_JOURNEYS,openingWrittenContext,journeyCoach} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumReturnIndex,curriculumCheckpoint,curriculumFork} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'

const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),hash=v=>createHash('sha256').update(v).digest('hex')
const plan=read('docs/data/opening-sicilian-early-p022-plan.json'),design=read('docs/data/opening-sicilian-early-p022-design-verification.json')
const proof=read('docs/data/opening-sicilian-early-p022-practical-verification.json'),report=read('docs/data/opening-sicilian-early-p022-result.json')
const replay=moves=>{const b=new Chess();moves.forEach(m=>b.move(m));return b}
const siblings=ALL_OPENING_JOURNEYS.filter(c=>c.family==='sicilian'),course=id=>siblings.find(c=>c.id===id)
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)

describe('early open Sicilian source orders',()=>{
  it('preserves 290 courses/exercises and all 169 frozen files',()=>{
    const ids=new Set(design.baseline.courses.map(c=>c.id))
    const rows=ALL_OPENING_JOURNEYS.filter(c=>ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    expect(rows).toEqual(design.baseline.courses);expect(hash(JSON.stringify(rows))).toBe(plan.baseline.courseDigest)
    const old=practical.entries.filter(c=>ids.has(c.courseId))
    expect(old).toHaveLength(290);expect(hash(JSON.stringify(old))).toBe(plan.baseline.practicalDigest)
    expect(Object.keys(plan.preserveFiles)).toHaveLength(169)
    for(const [f,sha] of Object.entries(plan.preserveFiles))expect(hash(fs.readFileSync(f)),f).toBe(sha)
    expect(ALL_OPENING_JOURNEYS).toHaveLength(309);expect(practical.entries).toHaveLength(309);expect(siblings).toHaveLength(48)
  })
  it('separates documented and authored moves and counts the extra transposition honestly',()=>{
    expect(additions.entries.map(c=>[c.provenance.documentedPlies,c.provenance.authoredContinuationPlies])).toEqual([[14,0],[8,2],[8,2]])
    expect(additions.entries[0].provenance.continuationStatus).toBeUndefined()
    expect(report.coverage).toEqual({exact:1956,'transposition-only':202,absent:10164})
    expect(report.newlyReached.filter(p=>p.state==='exact')).toHaveLength(4)
    expect(report.newlyReached.filter(p=>p.state==='transposition-only')).toEqual([{id:plan.additionalTranspositionPosition,state:'transposition-only'}])
    for(const [i,c] of additions.entries.entries())expect(c.moves).toEqual(plan.courses[i].moves)
  })
  it('binds all eight notes to both players and the changing bishop diagonal',()=>{
    for(const [i,c] of additions.entries.entries())for(const [pair,note] of Object.entries(plan.courses[i].editorialNotes)){
      expect(openingWrittenContext(c,Number(pair)).debrief).toBe(note)
      expect(journeyCoach(c,Number(pair)+1,'b').debrief).toBe(note)
      expect(openingWrittenContext({...c,moves:c.moves.slice(0,-1)},Number(pair)).debrief).not.toBe(note)
    }
    const g6=additions.entries[0],at=n=>replay(g6.moves.slice(0,n))
    expect(at(10).attackers('d4','b')).toContain('g7');expect(at(12).attackers('d4','b')).not.toContain('g7')
    expect(at(14).attackers('d4','b')).toContain('c6');expect(at(14).attackers('d4','w')).toEqual(expect.arrayContaining(['d1','e3']))
    expect(at(14).attackers('f7','w')).toContain('c4');expect(at(14).get('f2')?.type).toBe('p')
    expect(replay(course('sicilian:accelerated-dragon').moves.slice(0,4)).get('d7')?.type).toBe('p')
  })
  it('plays all sixteen directed checkpoints and full courses in both colors',()=>{
    const runs=additions.entries.map(c=>({c,index:0}))
    expect(design.navigation.forks).toHaveLength(16)
    for(const f of design.navigation.forks){
      const from=course(f.from),to=course(f.to)
      expect(commonPrefix(from.moves,to.moves)).toBe(7)
      expect(curriculumReturnIndex(siblings,[from.id],to)).toBe(7)
      expect(curriculumCheckpoint(siblings,to,7)).toEqual({index:7,reason:'fork'})
      expect(practiceMove(from.moves,7,'b',to.moves[7]).status).toBe('different-line')
      runs.push({c:to,index:7})
    }
    for(const {c,index:start} of runs)for(const side of ['w','b']){
      let index=start||initialPracticeIndex(c.moves,side),played=0
      if(replay(c.moves.slice(0,index)).turn()!==side)index++
      while(index<c.moves.length){const r=practiceMove(c.moves,index,side,c.moves[index]);expect(['correct','complete']).toContain(r.status);index=r.index;played++}
      expect(index).toBe(c.moves.length);expect(played).toBeGreaterThan(0)
    }
  })
  it('distinguishes full FEN counters from the common Najdorf position and keeps c4 uncovered',()=>{
    const a6=course('sicilian:early-a6'),najdorf=course('sicilian:najdorf')
    const a=replay(a6.moves).fen(),b=replay(najdorf.moves.slice(0,10)).fen()
    expect(a.split(' ').slice(0,4)).toEqual(b.split(' ').slice(0,4));expect(a).not.toBe(b)
    expect(curriculumReturnIndex(siblings,[a6.id],najdorf)).toBe(7)
    expect([...curriculumFork(siblings,a6.moves,7).children.keys()]).toEqual(['Nf6','g6','a6','e5'])
    const g6=course('sicilian:early-g6-bc4')
    expect(practiceMove(g6.moves,8,'w','c4').status).toBe('different-line')
    expect(siblings.some(c=>g6.moves.slice(0,8).every((m,i)=>c.moves[i]===m)&&c.moves[8]==='c4')).toBe(false)
  })
  it('validates every immediate reply and both the bishop and knight captures',()=>{
    for(const spec of plan.courses){const ex=spec.exercise,b=replay(spec.moves.slice(0,ex.beforeIndex)),initial=material(b,ex.exerciseSide)
      b.move(ex.mistake);expect(b.isCheck()).toBe(ex.mistake==='Bb5+')
      expect(b.moves({verbose:true}).filter(m=>m.captured===ex.capturedType).map(m=>m.san)).toEqual([ex.answer])
      b.move(ex.answer)
      const gains=b.moves().map(san=>{b.move(san);expect(b.isGameOver()).toBe(false);const n=material(b,ex.exerciseSide)-initial;b.undo();return n})
      expect(gains).toHaveLength(ex.expectedLegalImmediateReplies);expect(Math.min(...gains)).toBe(2)
      const item=practical.entries.find(p=>p.id===ex.id);expect(item.moves).toEqual(b.history())
      expect(practiceMove(item.moves,item.startIndex,item.exerciseSide,ex.answer).status).toBe('complete')
    }
  })
  it('checks four engine comparisons and reuses only the two declared exercise baselines',()=>{
    expect(proof.goCommands).toBe(12);expect(proof.nodesRequested).toBe(2400000)
    expect(proof.continuationChecks.map(c=>c.acceptanceLoss)).toEqual([13,0,35,4])
    for(const c of proof.continuationChecks){expect(c.acceptanceLoss).toBe(Math.max(0,c.control.cp-c.selected.cp));expect(c.acceptanceLoss).toBeLessThanOrEqual(100)}
    expect(proof.evidence.map(e=>e.cpChange)).toEqual([437,416,366])
    for(const e of proof.evidence)expect(e.cpChange).toBe(e.search.cp+e.baseline.cp)
    expect(design.engineJobs.filter(j=>j.uses.includes('exercise-baseline')&&j.uses.includes('continuation-control'))).toHaveLength(2)
  })
})
