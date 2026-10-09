# Proposta logica per Mossa mancata, Grande e Geniale

9 ottobre 2026. Studio delle definizioni e dei casi già disponibili; nessuna
nuova ricerca motore, taratura, modifica al codice o attivazione in questo
passaggio. È una proposta da verificare, non un modello già validato.

## Conclusione

Un classificatore basato soltanto sul calo di una valutazione non può
riconoscere queste categorie. Occorre descrivere **l'occasione disponibile,
le alternative reali e il motivo per cui la mossa la sfrutta o la perde**.
Scacco, forchetta o pezzo catturabile sono indizi; il confronto con le
migliori difese stabilisce se l'indizio produce una conseguenza reale.

La soluzione proposta conserva tre informazioni distinte per ogni mossa:

- qualità numerica: differenza rispetto alla miglior continuazione;
- evento scacchistico: vittoria ottenibile, difesa necessaria, matto,
  guadagno materiale o sacrificio compensato;
- sufficienza delle prove: confermato nel budget dichiarato, candidato,
  oppure sconosciuto.

Queste informazioni possono sovrapporsi. Un errore grave può essere anche
un'occasione vincente mancata; una mossa migliore può essere un sacrificio
valido. La spiegazione resta utile anche quando l'etichetta speciale non è
confermata.

## Definizioni pubbliche e politica locale

[Chess.com](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc)
descrive Grande come decisione critica, Geniale come sacrificio valido
migliore o quasi e Mossa mancata come occasione vincente non sfruttata dopo
un errore avversario. Rating e valutazione partecipano al suo modello;
l'articolo non pubblica un algoritmo completo. I criteri seguenti sono
nostre ipotesi operative e non specifiche interne della piattaforma.

Anche la [profondità/modalità della revisione](https://support.chess.com/en/articles/11845102-why-did-my-move-classification-change-in-game-review)
può cambiare le etichette della piattaforma. Un riferimento senza quei
metadati documenta un risultato osservato, non una decisione riproducibile
con qualsiasi ricerca.

## Il confronto causale necessario

Tutte le valutazioni devono essere riportate alla prospettiva del giocatore
che deve scegliere la mossa corrente. Considerare:

1. **Scenario precedente:** posizione che avrebbe lasciato la miglior
   risposta avversaria, prima dell'errore effettivamente giocato.
2. **Occasione attuale:** miglior risultato disponibile dopo la mossa
   avversaria effettiva, contro la miglior difesa.
3. **Risultato della scelta:** risultato della mossa realmente giocata,
   sempre contro la miglior difesa.

L'occasione creata è la differenza fra 2 e 1. L'occasione persa è la
differenza fra 2 e 3. Una mossa avversaria può creare un evento tattico anche
senza oltrepassare la soglia numerica Errore/Errore grave: quella categoria
non deve essere l'unica porta d'accesso al riconoscimento.

Con gioco perfetto, il valore della posizione al proprio turno è già il
valore della migliore mossa disponibile. Confrontare ingenuamente il valore
prima e dopo la propria miglior mossa non dimostra che questa abbia creato
una vittoria. La sua importanza si misura contro le alternative proprie,
oppure contro l'occasione concessa dalla precedente scelta avversaria.

## Mossa mancata: occasione concreta, non sinonimo di grande perdita

Separare i fenomeni:

| Evento | Prova necessaria | Proposta di presentazione |
|---|---|---|
| Nuova occasione vincente persa | Opportunità creata dalla scelta avversaria; alternativa vincente; giocata che non mantiene la vittoria | Mossa mancata, con categoria numerica conservata |
| Matto indicato non mantenuto | Alternativa di matto e analisi della giocata che non conserva quel segnale | Motivo specifico di matto mancato, dichiarando il limite della ricerca |
| Difesa decisiva non trovata | Alternativa che regge; giocata che perde contro una risposta concreta | Difesa mancata; non chiamarla automaticamente occasione vincente |
| Guadagno tattico non sfruttato | Sequenza favorevole contro le difese pertinenti e confronto con la giocata | Motivo tattico; etichetta principale subordinata all'importanza sull'esito |

Il secondo criterio è quello appena aggiunto all'app, distinto dalla prima
politica. Gli ultimi due sono nuove famiglie proposte per lo studio; non
sono nuove classificazioni ufficiali già verificate.

Un calo da +8 a +4 non dimostra da solo che si sia mancata una vittoria.
Un calo da +0,5 a −2 può essere un grave peggioramento senza che prima
esistesse una continuazione vincente. Un matto più lungo ancora mantenuto
non è un matto perso. Anche l'assenza di un segnale di matto a budget finito
non ne prova l'inesistenza.

**Casi della repo:** personale 3/27 Nxe5 passa da miglior score +398 cp a
giocata +122; la sigmoid locale assegna circa 0,73 alla migliore e la soglia
0,75 la esclude. È un caso sensibile alla definizione di posizione vincente,
non una ragione per scegliere una soglia che recuperi quell'esempio.
Personale 3/28 Nxe5 ha miglior score −122 e giocata −516: con queste prove
non possiamo affermare che sia stata persa una vittoria. Personale 3/94
Qg1+ passa da +1041 a +884 senza mate: potrebbe esserci una conseguenza
tattica non rappresentata nel solo score, ma la cache non la dimostra.

## Grande: decisione critica rispetto alle alternative

Studiare due famiglie, con criteri e risultati separati:

1. **Difesa necessaria:** la giocata mantiene un risultato accettabile,
   mentre le alternative plausibili non lo mantengono. Comprende combinazioni
   che restituiscono materiale, controforchette e risposte a minacce.
2. **Sfruttamento decisivo di un'occasione:** la giocata realizza una
   conseguenza importante concessa dall'avversario; le alternative non la
   realizzano o lasciano un esito sostanzialmente peggiore.

Non vietare le prese o richiedere sempre uno scacco. Un doppio attacco può
essere il mezzo con cui la decisione viene realizzata, ma non è la decisione
stessa. L'unicità assoluta è una proprietà più forte della semplice
superiorità sulle alternative analizzate: va dichiarata solo con copertura
sufficiente delle mosse legali, o limitando esplicitamente l'affermazione.

Evidenze nelle cache:

| Caso | Migliore | Alternative rilevanti salvate | Interpretazione da verificare |
|---|---:|---|---|
| P4/29 Nd6+, riferimento Grande | +661, depth 15 | Rc1: −472, stessa depth | Candidata a decisione che salva/trasforma l'esito |
| P6/35 Nxf6+, riferimento Migliore | +951, depth 15 | Qh4 +720, f4 +627, Rd1 +595, g5 +591, depth 14 | La forchetta può essere evitata conservando vantaggio; confronto meno profondo |
| P6/13 d4, riferimento Grande | +25, depth 15 | Ne2 −426, stessa depth | Candidata a difesa necessaria, anche se l'attaccante può essere catturato |
| P3/19 Nxd6+, riferimento Grande | +118, depth 15 | Nc7 −460, stessa depth | Lo scambio iniziale può essere necessario per reggere |
| P3/29 Qxe5+, riferimento Migliore | +516, depth 15 | O-O-O −149, stessa depth | Controesempio: anche un forte distacco può non ricevere Grande nel riferimento |

Questi dati rendono plausibile la direzione, ma non una regola già riuscita:
Qxe5+ impedisce di identificare Grande soltanto con «PV1 molto migliore della
PV2». Inoltre alcune cache contengono radici duplicate e depth differenti.
Una seconda linea più debole non certifica che tutte le altre mosse perdano.

## Geniale: sacrificio valido con compensazione concreta

Il confronto deve partire dalla stessa posizione e dalle reali possibilità
di difesa, non dalla sola fotografia di un pezzo in presa.

1. Identificare il materiale realmente offerto dalla scelta: pezzo mosso
   oppure pezzo lasciato esposto. Distinguere un'offerta nuova da una minaccia
   già presente senza il contributo della giocata.
2. Esaminare l'accettazione: può l'avversario prendere il materiale senza
   subire una conseguenza che renda quella scelta sfavorevole?
3. Esaminare il rifiuto e le mosse intermedie: una difesa più forte può evitare
   la variante spettacolare della PV e confutare il sacrificio.
4. Dopo la presa, verificare la compensazione: matto, recupero materiale
   sostenibile, promozione, patta forzabile o vantaggio posizionale valutato.
   Un recupero immediato disponibile non basta a escludere il sacrificio:
   quella ricattura potrebbe perdere contro una risposta successiva.
5. Confrontare le alternative senza sacrificio, e quelle che offrono lo
   stesso pezzo: la giocata è necessaria per la compensazione o l'offerta
   qualificante esiste già anche senza di essa?
6. Confermare che la giocata sia migliore o quasi e che il risultato non
   diventi cattivo contro la difesa migliore. Con prove assenti, conservare
   la categoria comune e registrare il candidato.

Il saldo va seguito finché la sequenza tattica rilevante si chiarisce; un
numero fisso di due, quattro o otto semimosse non definisce un sacrificio.
Se una combinazione non è risolta entro il budget, l'esito è sconosciuto.
Il valore didattico o la sorpresa della mossa possono accompagnare la
spiegazione; non dimostrano da soli bontà e compensazione.

Nei casi già studiati, Nxe5 della personale 6 ha una compensazione tramite
combinazione, non una semplice ricattura immediata. Rb3 e Rxf5+ storici
sono invece esclusi dal criterio corrente sulle alternative già vincenti.
Quel veto va studiato come controfattuale scacchistico, non cancellato per
recuperare due etichette.

## Qualità delle prove e probabilità

La sigmoid(cp/400) dell'app è un indice locale: non è stata calibrata come
probabilità di vittoria dei giocatori delle partite. Quindi «0,75» non
dimostra in senso statistico una probabilità umana del 75%.

Il [WDL ufficiale Stockfish](https://github.com/official-stockfish/WDL_model)
può distinguere vittoria, patta e sconfitta e tiene conto del materiale;
è però calibrato su auto-gioco fra motori. È utile come seconda lettura
dell'esito e non sostituisce una calibrazione per rating umano.

Proposta: inizialmente mantenere score grezzi, mate, eventuale WDL e fatto
tattico separati. Trattare i casi vicini ai confini come incerti. Confermare
solo i candidati la cui decisione resta coerente con ricerche confrontabili;
se servono più ricerche, selezione e budget devono essere dichiarati prima.
Non convertire assenza di una difesa nella PV in prova che quella difesa
non esista.

## Politica delle etichette e verifica successiva

Quando le prove sono sufficienti, una categoria speciale può prevalere
sulla numerica, che resta memorizzata. Protezioni: Libro, dati mancanti,
mosse terminali e mosse forzate vanno gestiti esplicitamente. Un sacrificio
qualificante può sovrapporsi a una decisione critica: registrare entrambi
i motivi e usare una priorità dichiarata per il simbolo principale.

La prossima prova logica dovrebbe confrontare **coppie contrastanti**:
forchetta efficace decisiva/forchetta efficace evitabile; sacrificio valido/
pezzo lasciato in presa senza compensazione; occasione vincente persa/
peggioramento senza occasione vincente. Aggiungere casi sintetici costruiti
per confutare la regola, poi partite intere nuove con tutte le etichette.

Non aggiungere un'eccezione per ogni mancata coincidenza. Congelare prima
criteri e politica di astensione, poi misurare precisione, richiamo,
copertura e falsi positivi su dati indipendenti. Il rating può entrare in
una politica successiva solo con dati adeguati; non inventarne i coefficienti.

Conclusione operativa: il lavoro più utile è ricostruire il **controfattuale
scacchistico** della scelta. Più nodi possono migliorare le prove; non
correggono una definizione che confonde perdita numerica, occasione e motivo
tattico. Questa proposta non ha ancora misure di efficacia nuove.
