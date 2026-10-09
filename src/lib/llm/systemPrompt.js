// Prompt di sistema condiviso da entrambi i provider (Gemini/Groq).
// Regola fondamentale del progetto: il modello NON deve mai calcolare
// scacchi da solo (varianti, valutazioni). Deve solo spiegare, in linguaggio
// naturale, i dati oggettivi che riceve da Stockfish e dal database Lichess.

export const SYSTEM_PROMPT = `Sei un maestro di scacchi che spiega le aperture a uno studente.

REGOLE FONDAMENTALI:
- Non calcolare mai autonomamente varianti, minacce o valutazioni: usa SOLO i dati
  forniti nel contesto (nome apertura, statistiche Lichess, valutazione e linea
  principale di Stockfish).
- Se il contesto non contiene dati sufficienti per una posizione, dillo esplicitamente
  invece di inventare una motivazione scacchistica.
- Rispondi SOLO a domande di scacchi. Se la domanda dell'utente non riguarda gli
  scacchi, rispondi che questo assistente tratta solo argomenti scacchistici.
- Tono didattico, frasi brevi, adatto a chi studia le aperture per capire il "perché"
  delle mosse, non solo per memorizzarle.

FORMATO DI RISPOSTA:
Rispondi SEMPRE con un oggetto JSON valido, senza testo prima o dopo, con questa forma:
{
  "explanation": "spiegazione in linguaggio naturale, in italiano",
  "moveToPlay": "mossa in notazione SAN se la domanda dell'utente implica di giocarla sulla scacchiera, altrimenti null"
}`

export const CRITICAL_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

CONTESTO CRITICO:
- Spiega solo la categoria e i fatti verificati ricevuti.
- Forzata indica una sola mossa legale, non una scelta particolarmente meritevole.
  Libro indica presenza nel repertorio; la categoria numerica è separata.
  Con evaluationEvidence independent o conflicting presenta il giudizio come
  indicativo o provvisorio, senza descrivere le analisi come una prova certa.
- Per Mossa mancata usa la mossa avversaria e la variante alternativa verificata;
  le probabilità e i limiti sono del modello locale, non di chess.com.
- Per Grande e Geniale usa solo le prove in specialAssessment. Rispetta lo scope:
  alternative analizzate non significa tutte le mosse legali. Un candidato non
  è un riconoscimento confermato. I punteggi sono indici locali, non probabilità umane.
- Con evidenceKind empirical-family descrivi il criterio empirico e l'errore
  numerico avversario; non affermare che la risposta sia l'unica mossa buona.
- Il confronto della distanza del matto parte dalla posizione prima della mossa;
  con source independent-position le distanze sono stime da analisi separate.
  Non trasformare una variazione della distanza in una perdita percentuale o in una nuova categoria.
- Non inventare struttura pedonale, sicurezza del re, sviluppo o varianti.
- Se un fatto non è presente, dichiaralo invece di dedurlo.`

/**
 * Costruisce il messaggio utente con tutto il contesto oggettivo su cui
 * il modello deve basare la spiegazione.
 */
export function buildUserMessage({ fen, opening, engineData, question, moveHistorySan, criticalContext }) {
  const openingBlock = opening
    ? `Apertura: ${opening.eco ?? '—'} ${opening.name ?? '(nome non disponibile)'}
Statistiche Lichess: Bianco ${opening.white} - Patta ${opening.draws} - Nero ${opening.black}
Mosse più giocate da qui: ${opening.moves.map((m) => m.san).join(', ') || 'nessuna'}`
    : 'Nessun dato Lichess disponibile per questa posizione (probabilmente fuori teoria).'

  const engineBlock = engineData
    ? `Valutazione Stockfish: ${engineData.mate !== null ? `matto in ${engineData.mate}` : `${(engineData.evalCp / 100).toFixed(2)} pedoni`}
Linea principale (PV, notazione UCI): ${engineData.pv.slice(0, 6).join(' ')}`
    : 'Nessuna valutazione motore disponibile al momento.'

  const criticalBlock = criticalContext
    ? `Contesto critico verificato: categoria ${criticalContext.classification ?? 'non disponibile'}
Mossa giocata: ${criticalContext.playedMove ?? 'non disponibile'}
Eval migliore: ${criticalContext.bestEval ?? 'non disponibile'}
Eval mossa giocata: ${criticalContext.playedEval ?? 'non disponibile'}
Matto migliore (prospettiva di chi muove): ${criticalContext.bestMate ?? 'non disponibile'}
Matto mossa giocata (prospettiva di chi muove): ${criticalContext.playedMate ?? 'non disponibile'}
Confronto distanza matto: ${JSON.stringify(criticalContext.mateComparison ?? null)}
Occasione mancata verificata: ${JSON.stringify(criticalContext.missedOpportunity ?? null)}
Prove delle categorie speciali: ${JSON.stringify(criticalContext.specialAssessment ?? null)}
Categoria numerica: ${criticalContext.numericalClassification ?? 'non disponibile'}
Fatti della mossa: ${JSON.stringify(criticalContext.moveFacts ?? null)}
Affidabilità del confronto: ${JSON.stringify(criticalContext.evaluationEvidence ?? null)}
Perdita: ${criticalContext.evalDelta ?? 'non disponibile'}`
    : 'Nessun contesto critico aggiuntivo disponibile.'

  const factsBlock = criticalContext?.facts
    ? `Fatti locali verificati: ${JSON.stringify(criticalContext.facts)}`
    : 'Nessun fatto locale verificato disponibile.'

  return `Posizione attuale (FEN): ${fen}
Mosse giocate finora: ${moveHistorySan.join(' ') || '(partita appena iniziata)'}

${openingBlock}

${engineBlock}

${criticalBlock}

${factsBlock}

Domanda dell'utente: "${question}"`
}
