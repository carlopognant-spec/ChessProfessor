# Esito dei due esperimenti successivi

Due ipotesi provate senza modificare soglie, app o file esistenti. Protocolli scritti prima delle rispettive esecuzioni. Entrambe usano 592 mosse delle personali 1–6 e delle due storiche; nessuna validazione indipendente, lettura di .env/7–10 o nuova ricerca motore.

## 1. Completamento di una tattica prevista

Output: stockfish-specials-continuation-2026-10-07T19-50-15-744Z/results.json e report.md.

La regola sopprime una sola Grande: personale 6, d4 (ply 13), prevista nella PV del sacrificio Nxe5 (ply 11). Chess.com assegna Geniale alla prima e Grande alla seconda. Quindi essere parte di una combinazione già prevista non basta per negare Grande.

- Grande: da 4 TP, 4 FP, 20 FN a 3 TP, 4 FP, 21 FN.
- Nessun falso positivo eliminato; un vero positivo perso.
- Concordanza complessiva: da 310/586 a 309/586.
- Geniale invariata: 1 TP, 0 FP, 2 FN.

Decisione: filtro respinto. La v1 originale è stata riprodotta esattamente prima del confronto. Non sono state aggiunte eccezioni per recuperare d4.

## 2. Ricerca alternativa della stessa posizione

Output: stockfish-specials-root-reuse-2026-10-07T19-55-52-888Z/results.json e report.md.

La politica preferisce sempre il root corrente e considera la ricerca della posizione precedente solo quando PV1/PV2 non sono confrontabili o le radici sono duplicate. La scelta dipende dalla struttura, mai dall'etichetta o dal valore desiderato.

- 584 coppie di posizioni adiacenti verificate.
- 164 confronti root correnti inutilizzabili nell'intero campione, comprese mosse fuori dal filtro speciale. In tutti questi 164 casi anche il corrispondente playedEngine precedente non supera i controlli strutturali.
- Zero sostituzioni e zero cambiamenti; risultati v1 invariati.
- Le linee delle due fonti non sono normalmente identiche: solo 6 coppie hanno lines identiche. La mancata sostituzione non è dovuta a una loro generale identità, ma ai controlli di utilizzabilità.

Decisione: nessun vantaggio disponibile da questo riuso sulle cache esistenti. Non deduplicare o mescolare score di profondità diverse per forzare una classificazione.

## Stato conservato

Il miglior risultato delle versioni provate in questo confronto resta la v1 semplice: Grande 4/24 con 4 falsi positivi; Geniale 1/3 senza falsi positivi. Nessuna attivazione nell'app. I risultati restano di sviluppo; Geniale ha soltanto tre positivi complessivi, uno personale.

Per avanzare sulla qualità degli input serve raccogliere confronti MultiPV completi alla stessa profondità per le posizioni irrisolte, con gestione esplicita delle radici duplicate. Tale raccolta non è stata eseguita qui. Risolverla non eliminerebbe automaticamente i quattro falsi positivi già valutabili: restano distinti i problemi degli input e quelli della definizione di Grande.

## Verifiche eseguite

- 39 test superati: 6 nuovi sul contesto temporale, 5 sulla scelta della fonte e 28 precedenti.
- Replay legale e catene FEN verificati nelle due esecuzioni.
- Hash dei file letti invariati prima/dopo: 17 sorgenti originali e risultato v1 nel secondo confronto.
- Controllo sintattico dei due nuovi runner superato. Nessuna modifica a file tracciati.
- Suite app/build/browser: NON ESEGUITI; app invariata.
- Nessun nuovo commit/push. Checkpoint d833c58 conservato.
