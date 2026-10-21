import {useEffect,useState} from 'react'
import {OPENING_LESSONS} from '../lib/openingLessons.js'
import {familyJourneys} from '../lib/openingJourneys.js'
import {normalizeOpeningQuery} from '../lib/openingLibrary.js'
import practicalCases from '../lib/openingPracticalLibrary.js'

export default function OpeningCourses({family,onFamily,onStart,onCatalog,progress}){
  const [query,setQuery]=useState('')
  const [variantQuery,setVariantQuery]=useState('')
  useEffect(()=>setVariantQuery(''),[family])
  const guide=OPENING_LESSONS.find(g=>g.id===family)
  const tokens=normalizeOpeningQuery(query.replace(/karo/gi,'caro')).split(' ').filter(Boolean)
  const families=OPENING_LESSONS.filter(g=>tokens.every(t=>normalizeOpeningQuery([g.title,g.id,...familyJourneys(g.id).map(j=>j.title)].join(' ')).includes(t)))
  const courses=guide?familyJourneys(guide.id):[]
  const wanted=normalizeOpeningQuery(variantQuery).split(' ').filter(Boolean)
  const visible=courses.filter(course=>wanted.every(token=>normalizeOpeningQuery(course.title).includes(token)))
  const exercises=guide?practicalCases.entries.filter(item=>item.family===guide.id):[]
  return <main className="opening-library opening-courses">
    <header className="opening-course-header"><div><p className="opening-eyebrow">PERCORSI DI APERTURA</p><h1>{guide?guide.title:'Quale apertura vuoi studiare?'}</h1><p>{guide?'Parti dalle basi, poi affronta le risposte alternative.':'Un’apertura, più strutture da riconoscere e giocare.'}</p></div><button onClick={onCatalog}>Catalogo completo</button></header>
    {guide?<>
      <button className="opening-back-link" onClick={()=>onFamily(null)}>← Tutte le aperture</button>
      <p className="opening-small">Inizia dalla linea principale: al termine il corso ti riporta ai bivi per affrontare le altre varianti. Puoi anche scegliere direttamente un percorso qui sotto.</p>
      <label className="opening-course-search">Cerca fra le varianti di questa apertura<input type="search" value={variantQuery} onChange={event=>setVariantQuery(event.target.value)} placeholder="Nome della variante"/></label>
      <div className="opening-course-grid">{visible.map(journey=>{
        const i=courses.indexOf(journey)
        const completed=['w','b'].reduce((n,side)=>n+(progress.sessions[`journey:v1:${journey.id}:${side}`]?.completed??0),0)
        return <article className="opening-course-card" data-course={journey.id} key={journey.id}>
          <p className="opening-eyebrow">{i===0?'INIZIA DA QUI':`VARIANTE ${i}`}{completed?' · GIÀ AFFRONTATA':''}</p>
          <h2>{i===0?'Basi e partita guidata':journey.title}</h2>
          <p>{i===0?journey.title:journey.contrast}</p>
          <p className="opening-small">{Math.ceil(journey.moves.length/2)} mosse · Bianco o Nero</p>
          <button className={i===0?'opening-primary':''} onClick={()=>onStart(journey)}>{i===0?'Inizia dalle basi':`Studia ${journey.title}`}</button>
        </article>
      })}</div>
      {!visible.length&&<p>Nessuna variante trovata in questa apertura.</p>}
      {exercises.length>0&&<details className="opening-practical-list"><summary>Metti alla prova le idee: deviazioni da riconoscere ({exercises.length})</summary><p className="opening-small">Situazioni di allenamento costruite a partire dai percorsi: cerca la risorsa concreta prima di continuare il piano.</p>{exercises.filter(item=>wanted.every(token=>normalizeOpeningQuery(item.title).includes(token))).map(item=><button key={item.id} onClick={()=>onStart(item)}>{item.title}</button>)}</details>}
    </>:<>
      <label className="opening-course-search">Cerca un’apertura o una variante<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Caro-Kann, Italiana, Panov…"/></label>
      <div className="opening-family-grid">{families.map(g=><button className="opening-family-card" data-family={g.id} key={g.id} onClick={()=>onFamily(g.id)}><strong>{g.title}</strong><span>Basi + {familyJourneys(g.id).length-1} {familyJourneys(g.id).length===2?'variante':'varianti'}</span></button>)}</div>
      {!families.length&&<p>Nessun percorso trovato. Prova il nome dell’apertura.</p>}
    </>}
  </main>
}
