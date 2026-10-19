import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import notes from '../src/lib/openingIndianFullNotes.js'
import fullNotes from '../src/lib/openingFullNotes.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'

const at=(id,plies)=>{
  const board=new Chess()
  ALL_OPENING_JOURNEYS.find(row=>row.id===id).moves.slice(0,plies).forEach(san=>board.move(san))
  return board
}
const pawns=(board,color,file)=>board.board().flat().filter(piece=>piece?.type==='p'&&piece.color===color&&piece.square[0]===file)
function pressure(board,from,targets,color){
  expect(board.get(from)?.color).toBe(color)
  for(const target of targets){
    expect(board.get(target)?.color,`${from}-${target}: target`).toBe(color==='w'?'b':'w')
    expect(board.attackers(target,color),`${from}-${target}: pressure`).toContain(from)
  }
}

describe('specific ideas in the Nimzo, Queen’s Indian and Bogo lessons',()=>{
  it('fills every missing pair of thirteen variants without synthesizing commentary at runtime',()=>{
    expect(Object.keys(notes)).toHaveLength(13)
    expect(Object.values(notes).reduce((sum,row)=>sum+Object.keys(row).length,0)).toBe(139)
    for(const [id,row] of Object.entries(notes)){
      expect(fullNotes[id].notes).toEqual(row)
      expect(fullNotes[id].line).toBe(ALL_OPENING_JOURNEYS.find(course=>course.id===id).moves.join(' '))
    }
  })

  it('binds the Classical and Rubinstein Nimzo targets to the actual exchanges',()=>{
    const classical=at('nimzo:classical',28)
    pressure(classical,'d4',['c3','e3'],'b')
    pressure(classical,'c8',['c4'],'b')
    expect(classical.get('c3')).toMatchObject({type:'q',color:'w'})
    expect(notes['nimzo:classical'][26]).toContain('donna c3')
    const opened=at('nimzo:classical',30)
    pressure(opened,'e7',['a3'],'b')
    const rubinstein=at('nimzo:rubinstein',28)
    pressure(rubinstein,'e5',['c3','e3'],'b')
    const final=at('nimzo:rubinstein',32)
    pressure(final,'c4',['d3'],'b')
    expect(final.get('d3')).toMatchObject({type:'b',color:'w'})
  })

  it('tracks the Sämisch pawn transfers and the Leningrad kings on the same wing',()=>{
    const beforePush=at('nimzo:samisch',26)
    expect(pawns(beforePush,'w','c')).toHaveLength(1)
    expect(beforePush.get('d4')).toMatchObject({type:'p',color:'w'})
    expect(notes['nimzo:samisch'][26]).not.toContain('elimina il raddoppio')
    const samisch=at('nimzo:samisch',30)
    pressure(samisch,'e4',['d3'],'b')
    pressure(samisch,'f8',['f4'],'b')
    expect(samisch.get('d3')).toMatchObject({type:'q',color:'w'})
    const leningrad=at('nimzo:leningrad',32)
    expect(leningrad.get('a1')).toMatchObject({type:'k',color:'w'})
    expect(leningrad.get('c8')).toMatchObject({type:'k',color:'b'})
    pressure(leningrad,'b1',['b6'],'w')
    expect(pawns(leningrad,'w','b')).toHaveLength(0)
    expect(pawns(leningrad,'b','b')).toHaveLength(1)
  })

  it('keeps the Petrosian rooks behind their pieces and d5 connected after bxc5',()=>{
    const blocked=at('queens-indian:petrosian',22)
    expect(blocked.get('c3')).toMatchObject({type:'n',color:'w'})
    expect(blocked.get('e7')).toMatchObject({type:'b',color:'b'})
    expect(blocked.attackers('c5','w')).not.toContain('c1')
    expect(blocked.attackers('e3','b')).not.toContain('e8')
    expect(notes['queens-indian:petrosian'][20]).toContain('In c3 e in e7')
    const battery=at('queens-indian:petrosian',26)
    pressure(battery,'d3',['h7','a6'],'w')
    expect(battery.attackers('h7','b')).toContain('f8')
    const structure=at('queens-indian:petrosian',30)
    expect(pawns(structure,'w','d')).toHaveLength(0)
    expect(structure.get('c5')).toMatchObject({type:'p',color:'b'})
    expect(structure.get('d5')).toMatchObject({type:'p',color:'b'})
    expect(pawns(structure,'b','b')).toHaveLength(0)
    expect(notes['queens-indian:petrosian'][28]).toContain('d5 non è ancora un pedone isolato')
  })

  it('includes the a6 bishop in the Queen’s Indian exchange count',()=>{
    const fork=at('queens-indian:ba6',23)
    pressure(fork,'c6',['a8','d7'],'w')
    const opened=at('queens-indian:ba6',28)
    pressure(opened,'f6',['d5'],'b')
    pressure(opened,'d8',['d5'],'b')
    const ending=at('queens-indian:ba6',32)
    expect(ending.get('d5')).toMatchObject({type:'n',color:'b'})
    pressure(ending,'d5',['c3'],'b')
    pressure(ending,'a4',['a6'],'w')
    expect(ending.get('a6')).toMatchObject({type:'b',color:'b'})
    expect(notes['queens-indian:ba6'][30]).toContain('anche l’alfiere nero a6')
  })

  it('attributes the e3 and Kasparov pressure to the right queens and pawns',()=>{
    const before=at('queens-indian:e3',28)
    expect(before.get('e7')).toMatchObject({type:'b',color:'b'})
    expect(before.attackers('e6','b')).not.toContain('e8')
    const defended=at('queens-indian:e3',30)
    expect(defended.attackers('e6','b')).toContain('e8')
    expect(pawns(defended,'w','e')).toHaveLength(0)
    expect(pawns(defended,'b','e')).toHaveLength(1)
    expect(notes['queens-indian:e3'][14]).toContain('semiaperta la colonna e per il Bianco')
    const e3=at('queens-indian:e3',32)
    pressure(e3,'c4',['d3','b3'],'b')
    pressure(e3,'d8',['d4'],'b')
    const kasparov=at('queens-indian:kasparov',28)
    pressure(kasparov,'f6',['f3','c3'],'b')
    const advanced=at('queens-indian:kasparov',32)
    expect(advanced.board().flat().filter(piece=>piece?.type==='q')).toHaveLength(0)
    pressure(advanced,'c5',['e6'],'b')
  })

  it('distinguishes a new Bogo rook attack from a pawn threat already answered',()=>{
    const knight=at('bogo:knight',28)
    pressure(knight,'b4',['c3','a3'],'b')
    const after=at('bogo:knight',30)
    pressure(after,'c8',['c3'],'b')
    expect(after.get('b4')).toMatchObject({type:'p',color:'w'})
    for(const file of ['a','c'])expect(pawns(after,'w',file)).toHaveLength(0)
    const qe7=at('bogo:qe7',32)
    pressure(qe7,'h4',['g3'],'b')
    expect(qe7.attackers('e4','w')).toContain('e1')
    expect(qe7.attackers('e5','w')).not.toContain('e1')
    const be7=at('bogo:be7',28)
    pressure(be7,'b8',['g3'],'b')
    pressure(at('bogo:be7',30),'c8',['c3'],'b')
  })

  it('uses the true origin of the Bogo a5 and Nc6 discovered attacks',()=>{
    const before=at('bogo:a5',31)
    expect(before.get('d6')).toMatchObject({type:'p',color:'b'})
    expect(before.attackers('d4','b')).not.toContain('d8')
    const a5=at('bogo:a5',32)
    pressure(a5,'e5',['f4','d4'],'b')
    pressure(a5,'d8',['d4'],'b')
    const knight=at('bogo:nc6',26)
    expect(pawns(knight,'b','a')).toHaveLength(0)
    expect(pawns(knight,'w','a')).toHaveLength(1)
    expect(knight.get('a5')).toMatchObject({type:'n',color:'b'})
    expect(knight.attackers('a3','b')).not.toContain('a8')
    const uncovered=at('bogo:nc6',28)
    pressure(uncovered,'a8',['a3'],'b')
    expect(uncovered.get('b7')).toMatchObject({type:'n',color:'b'})
    const center=at('bogo:nc6',32)
    pressure(center,'c5',['d4','b4'],'b')
    pressure(center,'e5',['d4'],'b')
  })
})
