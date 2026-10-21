import {describe,it,expect} from 'vitest'
import fs from 'node:fs'
import {Chess} from 'chess.js'
import {familyJourneys,journeyCoach} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumFork} from '../src/lib/openingCurriculum.js'
import {OPENING_EXPANSION_PLAN} from '../src/lib/openingExpansionPlan.js'
import reviewed from '../src/lib/openingStrategicNotes.js'
import practical from '../src/lib/openingPracticalLibrary.js'

const additions={
  sicilian:['kalashnikov','richter-rauzer','sozin','morra','grand-prix','moscow','four-knights','okelly','keres'],
  'queens-gambit':['anti-meran','botvinnik','moscow','cambridge-springs','tartakower','lasker','ragozin','slav-exchange','accepted-e4'],
  spanish:['breyer','zaitsev','chigorin','archangel','anti-marshall','classical-bc5','anti-berlin'],
  french:['burn','monte-carlo','winawer-a3','milner-barry'],
  italian:['evans-declined','traxler','ulvestad','fegatello'],
  english:['hedgehog','neo-catalan','anglo-dutch','bremen-smyslov'],
}
const course=id=>familyJourneys(id.split(':')[0]).find(row=>row.id===id)
const position=(id,plies)=>{const board=new Chess();course(id).moves.slice(0,plies).forEach(san=>board.move(san));return board}

describe('second audit of missing opening decisions',()=>{
  it('delivers all 37 new branches with reviewed explanations and playable exercises',()=>{
    expect(Object.values(additions).flat()).toHaveLength(37)
    expect(OPENING_EXPANSION_PLAN).toHaveLength(197)
    for(const [family,slugs] of Object.entries(additions))for(const slug of slugs){
      const id=`${family}:${slug}`,row=course(id)
      expect(row,id).toBeTruthy()
      expect(reviewed[id].line,id).toBe(row.moves.join(' '))
      expect(reviewed[id].notes).toHaveProperty('16')
      expect(reviewed[id].notes).toHaveProperty('24')
      expect(practical.entries.find(item=>item.courseId===id),id).toBeTruthy()
    }
    for(const [family,count] of Object.entries({sicilian:25,'queens-gambit':17,spanish:14,french:14,italian:11,english:10})){
      expect(familyJourneys(family),family).toHaveLength(count)
    }
    const original=JSON.parse(fs.readFileSync('docs/data/opening-scope-audit.json','utf8')).courses.filter(row=>row.family==='sicilian').map(row=>row.id)
    expect(original).toHaveLength(19)
    expect(new Set(familyJourneys('sicilian').map(row=>row.id))).toEqual(new Set([...original,'sicilian:najdorf-bg5-classical','sicilian:chekhover-bd7','sicilian:chekhover-zaitsev','sicilian:chekhover-c4-g6','sicilian:chekhover-qd3','sicilian:chekhover-qd2']))
    expect(familyJourneys('caro')).toHaveLength(16)
    expect(familyJourneys('kings-indian')).toHaveLength(14)
  })

  it('places the new lessons at distinct actual decisions rather than counting aliases',()=>{
    for(const [a,b,index] of [
      ['sicilian:richter-rauzer','sicilian:sozin',10],
      ['queens-gambit:semi-slav','queens-gambit:anti-meran',10],
      ['queens-gambit:moscow','queens-gambit:botvinnik',9],
      ['spanish:breyer','spanish:zaitsev',17],
      ['spanish:breyer','spanish:chigorin',17],
      ['spanish:berlin','spanish:anti-berlin',6],
      ['french:classical','french:burn',7],
      ['french:exchange','french:monte-carlo',6],
      ['italian:evans','italian:evans-declined',7],
      ['italian:fried-liver','italian:fegatello',9],
    ]){
      const first=course(a),second=course(b)
      expect(commonPrefix(first.moves,second.moves),`${a} / ${b}`).toBe(index)
      expect(position(a,index).fen()).toBe(position(b,index).fen())
      const fork=curriculumFork(familyJourneys(first.family),first.moves,index)
      expect(fork.children.has(first.moves[index])).toBe(true)
      expect(fork.children.has(second.moves[index])).toBe(true)
    }
  })

  it('distinguishes the Lasker knight attack from the bishop attack it uncovers',()=>{
    const before=position('queens-gambit:lasker',13)
    expect(before.get('f6')).toMatchObject({type:'n',color:'b'})
    expect(before.get('h4')).toMatchObject({type:'b',color:'w'})
    expect(before.attackers('h4','b')).not.toContain('e7')
    before.move('Ne4')
    expect(before.attackers('c3','b')).toContain('e4')
    expect(before.attackers('h4','b')).toContain('e7')
    expect(before.attackers('h4','b')).not.toContain('e4')
    const plan=OPENING_EXPANSION_PLAN.find(row=>row.id==='queens-gambit:lasker')
    expect(plan.focus).toContain('libera la diagonale dell’alfiere e7')
  })

  it('treats the Breyer bishop diagonal as a plan, rather than an existing attack',()=>{
    const board=position('spanish:breyer',18)
    expect(board.get('c6')).toBeUndefined()
    expect(board.get('b8')).toMatchObject({type:'n',color:'b'})
    expect(board.get('c8')).toMatchObject({type:'b',color:'b'})
    expect(board.attackers('e4','b')).not.toContain('c8')
    const plan=OPENING_EXPANSION_PLAN.find(row=>row.id==='spanish:breyer')
    expect(plan.focus).toContain('futuro alfiere b7')
    expect(journeyCoach(course('spanish:breyer'),16,'w').debrief).toBe(reviewed['spanish:breyer'].notes[16])
  })

  it('keeps feminine articles and adjectives in every constructed deviation',()=>{
    for(const item of practical.entries)expect(item.explanation,item.id).not.toMatch(/il torre|la torre esposto\b|la donna esposto\b/)
  })

  it('checks the newly explained attacks after the actual opponent reply',()=>{
    for(const [id,index,from,targets] of [
      ['french:burn',24,'c6',['b4','d4']],
      ['french:milner-barry',16,'c6',['e5']],
      ['sicilian:kalashnikov',16,'d4',['e2']],
      ['sicilian:richter-rauzer',24,'c6',['g2']],
      ['sicilian:sozin',24,'c7',['c6']],
      ['sicilian:four-knights',24,'g6',['e5']],
      ['sicilian:okelly',24,'c4',['e4','c3']],
      ['sicilian:keres',24,'f3',['g4','d1']],
      ['italian:evans-declined',16,'g8',['g7']],
      ['italian:ulvestad',16,'e4',['f3']],
      ['spanish:chigorin',24,'c6',['d4']],
      ['spanish:anti-marshall',24,'h6',['g5']],
      ['spanish:classical-bc5',24,'f3',['d1','g2']],
      ['spanish:anti-berlin',24,'d5',['e4']],
      ['queens-gambit:anti-meran',24,'e5',['b2','h2']],
      ['queens-gambit:botvinnik',16,'g5',['h4']],
      ['queens-gambit:lasker',24,'b6',['c5']],
      ['queens-gambit:ragozin',16,'a5',['g5','c3']],
      ['english:hedgehog',24,'e5',['d4']],
      ['english:anglo-dutch',24,'c6',['b4']],
    ]){
      const board=position(id,index+2)
      expect(journeyCoach(course(id),index,'w').debrief).toBe(reviewed[id].notes[index])
      for(const to of targets){
        expect(board.get(to)?.color,`${id}: target ${to}`).toBe('w')
        expect(board.attackers(to,'b'),`${id}: ${from}-${to}`).toContain(from)
      }
    }
  })

  it('updates pawn and king descriptions after both moves, rather than anticipating a later position',()=>{
    const monteCarlo=position('french:monte-carlo',26)
    expect(monteCarlo.get('c3')).toMatchObject({type:'p',color:'w'})
    expect(monteCarlo.get('d4')).toMatchObject({type:'p',color:'w'})
    expect(reviewed['french:monte-carlo'].notes[24]).toContain('non è più isolato')
    const cambridge=position('queens-gambit:cambridge-springs',26)
    expect(cambridge.get('c3')).toMatchObject({type:'p',color:'w'})
    expect(cambridge.get('c4')).toMatchObject({type:'p',color:'b'})
    expect(cambridge.board().flat().filter(piece=>piece?.color==='w'&&piece.type==='p'&&piece.square[0]==='c')).toHaveLength(1)
    const ragozin=position('queens-gambit:ragozin',26)
    expect(ragozin.get('f1')).toMatchObject({type:'k',color:'w'})
    expect(ragozin.get('e8')).toMatchObject({type:'k',color:'b'})
    expect(ragozin.fen().split(' ')[2]).toContain('k')
    const archangel=position('spanish:archangel',18)
    expect(archangel.attackers('d4','b')).toContain('b6')
    expect(archangel.attackers('f2','b')).not.toContain('b6')
  })
})
