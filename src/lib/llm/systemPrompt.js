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

/**
 * Costruisce il messaggio utente con tutto il contesto oggettivo su cui
 * il modello deve basare la spiegazione.
 */
export function buildUserMessage({ fen, opening, engineData, question, moveHistorySan }) {
  const openingBlock = opening
    ? `Apertura: ${opening.eco ?? '—'} ${opening.name ?? '(nome non disponibile)'}
Statistiche Lichess: Bianco ${opening.white} - Patta ${opening.draws} - Nero ${opening.black}
Mosse più giocate da qui: ${opening.moves.map((m) => m.san).join(', ') || 'nessuna'}`
    : 'Nessun dato Lichess disponibile per questa posizione (probabilmente fuori teoria).'

  const engineBlock = engineData
    ? `Valutazione Stockfish: ${engineData.mate !== null ? `matto in ${engineData.mate}` : `${(engineData.evalCp / 100).toFixed(2)} pedoni`}
Linea principale (PV, notazione UCI): ${engineData.pv.slice(0, 6).join(' ')}`
    : 'Nessuna valutazione motore disponibile al momento.'

  return `Posizione attuale (FEN): ${fen}
Mosse giocate finora: ${moveHistorySan.join(' ') || '(partita appena iniziata)'}

${openingBlock}

${engineBlock}

Domanda dell'utente: "${question}"`
}
