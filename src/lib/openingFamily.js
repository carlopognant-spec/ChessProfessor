// Library navigation only. These groups do not decide opening-book membership.
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[’‘]/g, "'").replace(/\bdefence\b/gi, 'defense').trim()

// Match the primary name, before ':' or ',', so a subvariation cannot steal
// its parent's group (French: Two Knights, QGD: Alekhine, English: Caro-Kann).
const primaryFamilies = [
  ['italian', /^(italian|giuoco|two knights|evans gambit|fried liver|hungarian defense)\b/i],
  ['spanish', /^(ruy lopez|spanish)\b/i],
  ['sicilian', /^sicilian\b/i], ['french', /^french\b/i], ['caro', /^caro.kann\b/i],
  ['scandinavian', /^(scandinavian|center counter)\b/i],
  ['pirc', /^(pirc|modern(?: defense)?$|modern defense\b|robatsch|pterodactyl)\b/i],
  ['alekhine', /^alekhine\b/i], ['petrov', /^(petrov|petroff|russian game)\b/i],
  ['scotch', /^scotch\b/i], ['vienna', /^vienna\b/i],
  ['kings-gambit', /^(king'?s (?:gambit|bishop gambit)|kga|kgd)\b/i],
  ['philidor', /^philidor\b/i],
  ['queens-gambit', /^(queen'?s gambit|qgd|qga|semi.slav|slav|semi.tarrasch|tarrasch defense|albin|chigorin defense)\b/i],
  ['london', /^(london|jobava|rapport.jobava)\b/i],
  ['kings-indian', /^(?:neo.)?king'?s indian(?! attack)\b|^kid\b/i],
  ['grunfeld', /^(?:neo.)?gr(?:u|ue)nfeld\b/i], ['nimzo', /^nimzo.indian\b/i],
  ['queens-indian', /^(?:pseudo )?queen'?s indian\b/i], ['catalan', /^catalan\b/i],
  ['dutch', /^dutch\b/i], ['benoni', /^(?:neo.)?(?:old )?benoni\b|^(benko|volga)\b/i],
  ['budapest', /^budapest\b/i],
  ['owen', /^(owen|english defense)\b/i], ['english', /^(english|anglo)\b/i],
  ['reti', /^(r[e]?ti|king'?s indian attack|zukertort (?:opening|defense))\b/i],
  ['four-knights', /^(four knights|three knights)\b/i],
  ['larsen', /^(larsen|nimzo.larsen|nimzowitsch.larsen)\b/i], ['bird', /^bird\b/i],
  ['trompowsky', /^trompowsky\b/i], ['colle', /^(colle|torre attack)\b/i],
  ['bogo', /^bogo.indian\b/i], ['old-indian', /^(?:neo.)?old indian\b/i],
  ['nimzowitsch', /^nimzowitsch defense\b/i],
  ['open-games', /^(bishop'?s opening|cent(?:er|re) game|danish|ponziani|king'?s (?:pawn|knight)|open game|latvian|elephant gambit|portuguese opening|parham)\b/i],
  ['queens-pawn', /^(queen'?s pawn|blackmar|englund|richter.veresov|veresov|hodgson|blumenfeld|neo.indian|rubinstein opening)\b/i],
  ['other', /^(hungarian opening|van geet|grob|amar|anderssen|barnes|clemenz|durkin|gunderam|kadas|mieses opening|polish|sokolsky|sodium|ware|van't kruijs|irregular|formation|st\. george|borg|hippopotamus)\b/i],
]

const ecoRanges = {
  A:[[1,1,'larsen'],[2,3,'bird'],[4,9,'reti'],[10,39,'english'],[41,42,'old-indian'],
    [48,49,'kings-indian'],[51,52,'budapest'],[53,55,'old-indian'],[56,79,'benoni'],[80,99,'dutch']],
  B:[[1,1,'scandinavian'],[2,5,'alekhine'],[6,9,'pirc'],[10,19,'caro'],[20,99,'sicilian']],
  C:[[0,19,'french'],[20,24,'open-games'],[25,29,'vienna'],[30,39,'kings-gambit'],
    [40,40,'open-games'],[41,41,'philidor'],[42,43,'petrov'],[44,44,'open-games'],[45,45,'scotch'],
    [46,49,'four-knights'],[50,59,'italian'],[60,99,'spanish']],
  D:[[0,5,'queens-pawn'],[6,69,'queens-gambit'],[70,99,'grunfeld']],
  E:[[1,9,'catalan'],[10,10,'queens-pawn'],[11,11,'bogo'],[12,19,'queens-indian'],
    [20,59,'nimzo'],[60,99,'kings-indian']],
}

export function resolveOpeningFamily(name, eco = '') {
  const text = normalize(name)
  const primary = text.split(/[:,]/, 1)[0].trim()
  // Only generic parents allow an explicitly named system to choose its group.
  // This must never reclassify e.g. French: Rubinstein or English: Anglo-Dutch.
  const generic = /^(queen'?s pawn(?: game| opening)?|indian(?: defense)?|neo.indian)$/i.test(primary)
  if (generic) {
    const detail = text.slice(primary.length).replace(/^\s*[:,]\s*/, '')
    const system = [
      ['london', /^(?:accelerated )?(london|jobava|rapport.jobava)\b/i],
      ['colle', /^(colle|torre attack)\b/i],
      ['trompowsky', /^trompowsky\b/i],
      ['budapest', /^budapest\b/i],
    ].find(([, rule]) => rule.test(detail))
    if (system) return {id:system[0],basis:'named-system',needsReview:false,primary}
  }
  const named = primaryFamilies.find(([, rule]) => rule.test(primary))
  // Mixed historical headings describe multiple systems; retain a visible review flag.
  if (named) return {id:named[0],basis:'primary-name',needsReview:primary.includes('/')||(generic&&text!==primary),primary}
  if (/^[A-E]\d{2}$/.test(eco)) {
    const number = Number(eco.slice(1))
    const range = ecoRanges[eco[0]]?.find(([from,to]) => number >= from && number <= to)
    if (range) return {id:range[2],basis:'eco-range',needsReview:true,primary}
  }
  return {id:'other',basis:'unclassified',needsReview:true,primary}
}
