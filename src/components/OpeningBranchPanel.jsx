import {orderedBranches,OPENING_FREQUENCY_SAMPLE} from '../lib/openingCurriculum.js'

export default function OpeningBranchPanel({fork,statistics,main,active,completed,onChoose}){
  const row=statistics[fork.prefix.join(' ')]
  const branches=orderedBranches(fork,statistics,main)
  const turn=fork.prefix.length%2===0?'Bianco':'Nero'
  return <details className="opening-branches" key={fork.prefix.join(' ')}>
    <summary>Bivio del {turn}: {branches.length} continuazioni</summary>
    <p className="opening-small">Seguiamo {active.title}. Puoi scegliere un altro ramo; al termine torneremo ai bivi per studiare le alternative.</p>
    <div className="opening-branch-options">{branches.map(({san,node,count})=>{
      const course=node.courses.find(c=>!completed.includes(c.id))??node.courses[0]
      const selected=node.courses.some(c=>c.id===active.id)
      return <button key={san} aria-pressed={selected} onClick={()=>onChoose(course)}>
        <strong>{course.title}</strong>
        <span>{selected?'Ramo attuale':node.courses.every(c=>completed.includes(c.id))?'Già affrontato':'Esplora questo ramo'}{node.courses.length>1?` · ${node.courses.length} percorsi`:''}</span>
        {row?.status==='ready'&&count!==null&&<span>{count.toLocaleString('it-IT')} partite nel campione</span>}
      </button>
    })}</div>
    <p className="opening-small">{row?.status==='ready'?`${OPENING_FREQUENCY_SAMPLE}. Linea principale del corso prima; alternative ordinate per frequenza.`:row?'Frequenze non disponibili per questa posizione: seguiamo l’ordine didattico.':'Caricamento delle frequenze. Puoi continuare a giocare.'}</p>
    {row?.status==='ready'&&<a className="opening-small" href="https://lichess.org/analysis#explorer" target="_blank" rel="noreferrer">Fonte: Lichess Opening Explorer</a>}
  </details>
}
