import {describe,it,expect} from 'vitest'
import {matchingOpeningInfo} from '../scripts/opening-expansion-engine.mjs'

describe('UCI evidence belongs to the selected move',()=>{
  it('keeps the last complete PV for bestmove when the final printed PV belongs to another root',()=>{
    const lines=[
      'info depth 9 score cp 12 nodes 30000 pv f7f6 e4e5',
      'info depth 10 score cp 18 nodes 40000 pv f7f6 g1f3',
      'info depth 11 score cp 20 nodes 50000 pv e7e6 d2d4',
      'bestmove f7f6 ponder g1f3',
    ]
    expect(matchingOpeningInfo(lines,'f7f6')).toBe(lines[1])
  })
  it('requires confirmation when only a bound or another move was printed for the final choice',()=>{
    const lines=[
      'info depth 10 score cp 18 nodes 40000 pv e7e6 d2d4',
      'info depth 11 score cp 40 lowerbound nodes 50000 pv f7f6 e4e5',
      'bestmove f7f6',
    ]
    expect(matchingOpeningInfo(lines,'f7f6')).toBeUndefined()
  })
})
