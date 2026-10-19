const label=(move,index)=>`${Math.floor(index/2)+1}${move.color==='w'?'.':'…'} ${move.san}`

export default function OpeningTurnReview({review}){
  if(!review)return null
  return <div className="opening-turn-review" aria-label="Spiegazione delle mosse giocate">
    {[[review.played,review.index,'La tua mossa'],[review.reply,review.index+1,`Risposta del ${review.reply?.color==='w'?'Bianco':'Nero'}`]].filter(([move])=>move).map(([move,index,title])=><section key={index} aria-label={title} data-review-index={index} data-fen-after={move.after}>
      <h4>{title} · {label(move,index)}</h4><p>{move.summary}</p>
      {move.details.map((fact,i)=><p key={i}>{fact.text}</p>)}
    </section>)}
  </div>
}
