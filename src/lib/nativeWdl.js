import {Chess} from 'chess.js'
// Stockfish sf_19/src/uci.cpp win_rate_params, win_rate_model and to_cp.
// The cp display has lost precision. Enumerate every internal integer that
// rounds to it instead of presenting a reconstructed WDL as an exact engine output.
const as=[-142.72052667,372.35176398,-340.71073572,415.23490212]
const bs=[5.93832785,15.61267078,-30.57816876,69.63866711]
const polynomial=(p,m)=>((p[0]*m+p[1])*m+p[2])*m+p[3]
const cppRound=v=>Math.sign(v)*Math.floor(Math.abs(v)+0.5)
export function nativeWdlInterval(fen,cp){
 if(!Number.isInteger(cp)||Math.abs(cp)>=20000)return null
 const value={p:1,n:3,b:3,r:5,q:9,k:0}
 const material=new Chess(fen).board().flat().filter(Boolean).reduce((s,p)=>s+value[p.type],0)
 const m=Math.max(17,Math.min(78,material))/58,a=polynomial(as,m),b=polynomial(bs,m),possibilities=[]
 for(let v=Math.floor((cp-.5)*a/100)-1;v<=Math.ceil((cp+.5)*a/100)+1;v++){
  if(cppRound(100*v/a)!==cp)continue
  const w=Math.floor(.5+1000/(1+Math.exp((a-v)/b))),l=Math.floor(.5+1000/(1+Math.exp((a+v)/b))),d=1000-w-l
  possibilities.push({internal:v,w,d,l,points:(w+d/2)/1000})
 }
 if(!possibilities.length)return null
 const bounds=Object.fromEntries(['w','d','l','points'].map(k=>[k,{min:Math.min(...possibilities.map(p=>p[k])),max:Math.max(...possibilities.map(p=>p[k]))}]))
 const outcomes=possibilities.map(p=>['w','d','l'].filter(k=>['w','d','l'].every(z=>z===k||p[k]>p[z])))
 const dominant=outcomes.every(o=>o.length===1&&o[0]===outcomes[0][0])?outcomes[0][0]:null
 return {source:'Stockfish-sf19-material-WDL',inferredFromRoundedCp:true,material,a,b,cp,bounds,dominant,possibilities}
}
