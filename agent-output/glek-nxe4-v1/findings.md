# 4...Nxe4: Geniale senza essere la migliore

12 ottobre 2026. Caso ricostruito dalle due immagini fornite da Carlo:
1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.g3 Nxe4. Il Nero muove Cf6xe4.
Le varianti 3.Bb5 e 4.d4 visibili nella lista delle immagini non sono la
posizione esaminata. Il repertorio locale comprende 4.g3, non 4...Nxe4.

## Risultato con le regole attive, senza modificarle

- Migliore: **4...Bc5** (Ac5), score +18 cp per il Nero.
- Giocata: **4...Nxe4** (Cxe4), score -20 cp per il Nero.
- Entrambi gli score provengono dallo stesso snapshot completato.
- Perdita locale: **2.37455 punti**, categoria numerica **Ottima**.
- La giocata non è PV1 e non è Libro.
- Prima della corroborazione: Ottima, candidato Geniale con motivo
  `unresolved-tactical-sequence`.
- Dopo la corroborazione della posizione successiva: **Geniale**, motivo
  `compensated-new-offer`, categoria numerica Ottima conservata.

La presa legale di accettazione è 5.Nxe4 con il cavallo da c3. Il Nero ha
guadagnato un pedone e offre un cavallo: saldo materiale dopo la presa -2
rispetto alla posizione iniziale. La variante di compensazione comincia
5.Nxe4 d5 6.Nc3 d4. Nella PV raccolta il recupero non è una ripresa immediata;
la sequenza tattica termina ancora con scacco, perciò il solo finale della PV
non basta al criterio prudente. L'analisi dopo la presa fornisce una seconda
stima concorde: indici locali 0.48875 e 0.49375 per il Nero, circa equilibrio.
Questa concordanza conferma la compensazione secondo la politica v6;
non è una dimostrazione matematica contro tutte le difese.

Il risultato conferma che la nostra regola **già ammette un sacrificio quasi
migliore**: non richiede sempre PV1. La corroborazione arriva solo analizzando
la semimossa successiva e il percorso live aggiorna allora la mossa precedente.
Se l'analisi si ferma subito dopo 4...Nxe4, conserva correttamente il candidato
anziché anticipare una conferma che non ha ancora.

## Budget e limiti

Cinque ricerche, ciascuna 200.000 nodi nominali, MultiPV 5, Stockfish npm 19.0.0
large-single, un thread, Hash 16 MB, ucinewgame + Clear Hash. Totale telemetrico:
**1.000.586 nodi**, sotto il tetto prefissato 1.025.000. Nessuna ricerca aggiunta
o rilanciata. Raw e telemetria sono conservati in search-0.json … search-4.json;
manifest, protocollo e risultati sono separati dalle cache precedenti.

Le schermate utilizzano Stockfish 19 Lite e depth 18/20; questi controlli usano
large-single con budget a nodi e non riproducono esattamente quelle ricerche.
Il riferimento Geniale è fornito dall'immagine, non recuperato con una nuova
Game Review. È un esempio positivo selezionato, non una misura generale di
precisione. Non modifica il conteggio precedente 329/592 né le sue categorie.

Nessuna modifica al classificatore, a soglie, rating o repertorio. Nessuna
lettura delle partite riservate 7–10 o di .env. Aggiunti soltanto diagnostica,
evidenze e due test di regressione che passano dati motore senza annotazioni
ai classificatori.
