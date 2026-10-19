import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import expansion from '../src/data/openingExpansion.js'
import strategicNotes from '../src/lib/openingStrategicNotes.js'
import caroNotes from '../src/lib/openingCaroNotes.js'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {ALL_OPENING_JOURNEYS,journeyCoach} from '../src/lib/openingJourneys.js'
import {openingChallenge} from '../src/lib/openingChallenge.js'
import {openingOpponent} from '../src/lib/openingOpponent.js'

const reviewed={...strategicNotes,...caroNotes}
const course=id=>ALL_OPENING_JOURNEYS.find(row=>row.id===id)
const boardAt=(id,plies)=>{
  const board=new Chess();course(id).moves.slice(0,plies).forEach(san=>board.move(san));return board
}

describe('individually reviewed strategic explanations',()=>{
  it('covers the new routes of all 37 families with additional exact-line notes',()=>{
    expect(Object.keys(reviewed).sort()).toEqual(expansion.entries.map(row=>row.id).sort())
    expect(Object.keys(strategicNotes)).toHaveLength(176)
    expect(Object.values(reviewed).reduce((n,row)=>n+Object.keys(row.notes).length,0)).toBe(388)
    for(const family of OPENING_LESSONS){
      const routes=expansion.entries.filter(row=>row.family===family.id)
      expect(routes.length,family.id).toBeGreaterThan(0)
      for(const route of routes){
        const row=reviewed[route.id]
        expect(row.line,route.id).toBe(route.moves.join(' '))
        expect(Object.keys(row.notes).length,route.id).toBeGreaterThanOrEqual(2)
        for(const [index,text] of Object.entries(row.notes)){
          expect(Number(index)%2).toBe(0)
          expect(Number(index)+1).toBeLessThan(route.moves.length)
          expect(text.length).toBeGreaterThan(150)
          expect(text).not.toMatch(/il torre|sul torre|undefined|\? No:|garantisce una vittoria/)
          for(const side of ['w','b'])expect(journeyCoach(route,Number(index)+Number(side==='b'),side).debrief).toBe(text)
        }
      }
    }
  })

  it('does not reuse a reviewed explanation after the full teaching line changes',()=>{
    const original=course('french:classical'),board=boardAt(original.id,original.moves.length-1)
    const alternative=board.moves().find(san=>san!==original.moves.at(-1))
    expect(alternative).toBeTruthy()
    const changed={...original,moves:[...original.moves.slice(0,-1),alternative]}
    expect(journeyCoach(changed,16,'w').debrief).not.toBe(strategicNotes[original.id].notes[16])
    expect(journeyCoach(original,16,'w').debrief).toBe(strategicNotes[original.id].notes[16])
  })

  // Concrete board checks for one described move in every family. Targets here
  // are stated in the notes above, not inferred from the generated engine score.
  const attacks=[
    ['italian:fried-liver',16,'e4',['f3']],
    ['spanish:marshall',24,'h4',['d4','f2','h2']],
    ['sicilian:closed',16,'d4',['f3','c2']],
    ['french:classical',16,'c6',['d4','e5']],
    ['caro:hillbilly',16,'f6',['e4','g4']],
    ['scandinavian:qd8',24,'b6',['d4']],
    ['pirc:modern',24,'c5',['c4','e3']],
    ['alekhine:exchange',16,'c6',['d4']],
    ['petrov:cochrane',16,'d5',['e4']],
    ['scotch:steinitz',24,'d4',['e2','c2']],
    ['vienna:bishop',24,'d4',['f3','b3','c2']],
    ['kings-gambit:bishops',24,'f6',['f4','c3']],
    ['philidor:hanham',24,'f5',['d4']],
    ['queens-gambit:chigorin',24,'c6',['f3']],
    ['london:jobava',16,'c5',['d4']],
    ['kings-indian:semi-classical',24,'c5',['a4','e4']],
    ['grunfeld:brinckmann',24,'b7',['h1']],
    ['nimzo:rubinstein',24,'e5',['d3','f3']],
    ['queens-indian:kasparov',24,'e4',['f3']],
    ['catalan:check',24,'b5',['c4']],
    ['dutch:hopton',24,'c6',[],['e5']],
    ['benoni:czech',24,'b5',['a4','c4']],
    ['budapest:adler',24,'g6',['f4']],
    ['english:anglo-indian',24,'c2',['e1','d4']],
    ['reti:symmetrical',24,'b8',['b7']],
    ['four-knights:glek',16,'f6',['f3']],
    ['larsen:indian',16,'e3',['d2','f2']],
    ['bird:sicilian',16,'b5',['c3']],
    ['trompowsky:c5',24,'d5',['c4']],
    ['colle:torre-classical',24,'e5',['d4','f4']],
    ['bogo:a5',16,'e4',['d2','c3']],
    ['old-indian:fianchetto',24,'e3',['f2']],
    ['nimzowitsch:scandinavian',16,'g4',['f3']],
    ['owen:guatemala',24,'e6',['g5','d4']],
    ['open-games:elephant',24,'g5',['f4']],
    ['queens-pawn:englund',24,'b5',['b3']],
    ['other:grob',24,'b4',['c3','a3']],
  ]
  it('checks a representative reviewed board position for every family',()=>{
    expect(new Set(attacks.map(([id])=>course(id).family))).toEqual(new Set(OPENING_LESSONS.map(row=>row.id)))
    for(const [id,index,from,targets,defended=[]] of attacks){
      expect(reviewed[id].notes[index],id).toBeTruthy()
      const board=boardAt(id,index+2)
      expect(board.get(from)?.color,id).toBe('b')
      for(const to of targets){
        expect(board.get(to)?.color,`${id}: target ${to}`).toBe('w')
        expect(board.attackers(to,'b'),`${id}: ${from}-${to}`).toContain(from)
      }
      for(const to of defended){
        expect(board.get(to)?.color,`${id}: defended ${to}`).toBe('b')
        expect(board.attackers(to,'b'),`${id}: ${from}-${to}`).toContain(from)
      }
    }
  })

  it('distinguishes a controlled empty square from a knight that was already captured',()=>{
    const board=boardAt('catalan:early-c5',26)
    expect(board.get('d4')).toBeUndefined()
    expect(board.get('e6')).toMatchObject({type:'n',color:'b'})
    expect(board.attackers('d4','b')).toContain('e6')
    expect(strategicNotes['catalan:early-c5'].notes[24]).toContain('controllo di d4 e f4')
    const english=boardAt('english:anglo-indian',26)
    expect(english.isCheck()).toBe(true)
    expect(english.get('a1')).toBeUndefined()
    expect(english.get('b1')).toMatchObject({type:'r',color:'w'})
  })

  it('updates a structural plan when the Tarrasch d-pawn gains a neighboring pawn',()=>{
    const board=boardAt('queens-gambit:tarrasch',26)
    expect(board.get('d5')).toMatchObject({type:'p',color:'b'})
    expect(board.get('e6')).toMatchObject({type:'p',color:'b'})
    expect(board.attackers('d5','b')).toContain('e6')
    expect(strategicNotes['queens-gambit:tarrasch'].notes[24]).toContain('non è più isolato')
  })

  it('distinguishes open files, semi-open files and pressure behind a pawn',()=>{
    for(const [id,index,file,whitePawns,blackPawns] of [
      ['french:rubinstein',16,'e',0,1],
      ['kings-gambit:bishops',16,'d',0,1],
      ['kings-indian:smyslov',24,'c',1,0],
      ['bird:fianchetto',24,'g',0,1],
      ['larsen:sicilian',24,'h',0,0],
      ['colle:stonewall',24,'h',1,0],
      ['trompowsky:raptor',16,'h',0,1],
      ['other:sodium',16,'e',0,0],
    ]){
      const pieces=boardAt(id,index+2).board().flat().filter(piece=>piece?.type==='p'&&piece.square[0]===file)
      expect(pieces.filter(piece=>piece.color==='w').length,`${id}: white ${file}`).toBe(whitePawns)
      expect(pieces.filter(piece=>piece.color==='b').length,`${id}: black ${file}`).toBe(blackPawns)
    }
    expect(strategicNotes['kings-indian:smyslov'].notes[24]).toContain('dietro il pedone c4')
    expect(strategicNotes['other:sodium'].notes[16]).toContain('colonna e aperta')
    expect(strategicNotes['kings-gambit:bishops'].notes[16]).toContain('semiaperta la colonna d')
  })

  it('keeps the remaining bishop, the actual attacker and a blocked queen line distinct',()=>{
    const rubinstein=boardAt('french:rubinstein',26)
    const whiteBishops=rubinstein.board().flat().filter(piece=>piece?.color==='w'&&piece.type==='b')
    expect(whiteBishops).toHaveLength(1)
    expect(whiteBishops[0].square).toBe('c3')
    expect(rubinstein.get('d3')).toMatchObject({type:'n',color:'b'})

    const fianchetto=boardAt('grunfeld:fianchetto',25)
    expect(fianchetto.get('d7')).toMatchObject({type:'b',color:'b'})
    expect(fianchetto.attackers('d7','w')).toContain('e5')
    expect(fianchetto.attackers('d7','w')).not.toContain('c1')
    const brinckmann=boardAt('grunfeld:brinckmann',18)
    expect(brinckmann.get('h1')).toMatchObject({type:'r',color:'w'})
    expect(brinckmann.attackers('h1','b')).toContain('g2')

    const benoni=boardAt('benoni:old',26)
    expect(benoni.get('d1')).toMatchObject({type:'q',color:'w'})
    expect(benoni.get('d5')).toMatchObject({type:'p',color:'w'})
    expect(benoni.attackers('d1','b')).not.toContain('d8')
    benoni.move('dxe6')
    expect(benoni.attackers('d1','b')).toContain('d8')
    expect(benoni.move('Rxd1').san).toBe('Rxd1')
    expect(benoni.isCheck()).toBe(false)
  })
})

describe('precise Italian move effects',()=>{
  it('uses the correct article and gender when moving, attacking and capturing a rook',()=>{
    const before=new Chess('4k3/8/8/8/8/8/r7/4K2R w K - 0 1')
    expect(openingChallenge(before,'Rh2').situation).toContain('La torre avversaria')
    expect(openingChallenge(before,'Rh2').situation).toContain('messa sotto pressione')
    expect(openingChallenge(before,'Rh2').effect).toContain('la torre')
    const black=new Chess('4k3/8/8/8/8/8/r7/4K2R b K - 0 1')
    expect(openingOpponent(black.fen(),'Rh2','Rxh2').text).toContain('La torre in h2')
    const after=new Chess(before.fen());after.move('Rh2')
    expect(openingChallenge(after,'Rxh2').situation).toContain('la torre avversaria')
    expect(openingChallenge(after,'Rxh2').effect).toContain('cattura la torre in h2')
    const guided=course('italian:scotch-gambit')
    expect(journeyCoach(guided,25,'b').hint).toContain('sulla torre')
  })

  it('explains the captured pawn square and the destination separately for en passant',()=>{
    const before=boardAt('four-knights:italian',25)
    expect(before.get('d4')).toMatchObject({type:'p',color:'w'})
    const context=openingChallenge(before,'exd3')
    expect(context.situation).toContain('un solo turno')
    expect(context.effect).toContain('cattura il pedone in d4 en passant, raggiungendo d3')
    const move=before.move('exd3')
    expect(move.isEnPassant()).toBe(true)
    expect(before.get('d4')).toBeUndefined()
    expect(before.get('d3')).toMatchObject({type:'p',color:'b'})
    expect(strategicNotes['four-knights:italian'].notes[24]).toContain('cattura quello arrivato in d4 e raggiunge d3')
  })
})
