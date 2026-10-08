# Esperimento: nuova decisione o continuazione

Protocollo fissato prima di calcolare i risultati. La v1 semplice e i suoi output restano invariati. Nessuna ricerca motore, modifica all'app, ai file esistenti o alle cache. Solo personali 1–6 e due storiche; 7–10 e .env esclusi.

## Ipotesi

Una Grande assegnata per il divario dalle alternative può essere il completamento di una combinazione già individuata. Verificare se il contesto temporale aiuta a separare questi casi, senza escludere tutte le prese o ricatture e senza leggere le etichette dentro il riconoscitore.

## Regola sperimentale

Partire dalle assegnazioni del classificatore semplice v1, con tutte le sue soglie invariate. Per una candidata Grande dei rami only-good/only-winning:

- Cercare le precedenti mosse dello stesso colore nella finestra di 8 ply già usata dalla v1. Nessuna ricerca nelle mosse future della partita.
- Richiedere catena FEN/mosse legale e contigua, stesso colore del punto iniziale e mossa attuale.
- Richiedere che la precedente mossa fosse candidata Grande o Geniale secondo la v1, indipendentemente dalle annotazioni Chess.com.
- La PV1 della mossa precedente deve contenere come prefisso esatto tutte le mosse realmente giocate da quel punto alla mossa attuale. È evidenza di una continuazione già prevista, non prova della motivazione di Chess.com.
- Nessuna mossa intermedia dell'avversario deve essere Errore/Errore grave secondo la classificazione numerica locale: un nuovo errore può creare un'opportunità distinta.
- Se tutte le condizioni tengono, ripristinare per la mossa attuale la categoria comune e registrare il punto precedente e il prefisso previsto. Non sopprimere Geniale o il ramo opportunità creata dall'errore.

Calcolare la regola sui risultati v1 originali di tutte le mosse precedenti, non su una sequenza di risultati già soppressi, per evitare effetti a cascata.

## Misure e decisione

Riportare confronto v1/v2 di TP, FP, FN per categoria e gruppo, tutte le soppressioni, quanti falsi positivi restano e quante vere Grande vengono perse. Zero cambiamenti è un risultato valido. Non modificare la regola per far sparire i quattro falsi positivi noti. Non attivare nell'app sulla base di questo studio di sviluppo. Test per prefisso divergente, colori, FEN, finestra, nuovo errore, categorie protette e immutabilità.
