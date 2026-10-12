# Approfondimento facoltativo: risultati e limiti

Il nuovo comando conserva l'analisi iniziale e approfondisce fino a 12 mosse
dubbie per richiesta. Le due versioni si possono confrontare, salvare e
riaprire offline. Le ricerche si possono interrompere; i risultati parziali
validi restano riutilizzabili. Nessun errore avvia nuove ricerche automaticamente.

## Verifica reale sulla partita completa

personal-01, 51 semimosse: concordanza con le etichette di riferimento da
32/51 a 37/51, cinque correzioni e zero regressioni.

| Semimossa | Mossa | Iniziale | Approfondita |
|---|---|---|---|
| 15 | h3 | Ottima | Buona |
| 16 | O-O | Migliore | Ottima |
| 17 | Bd3 | Ottima | Migliore |
| 18 | h6 | Buona | Imprecisione |
| 24 | Qd5 | Ottima | Buona |

L'arrocco alla semimossa 16 beneficia della posizione condivisa con una mossa
selezionata. Buona passa da 1/7 a 3/7; Imprecisione da 0/4 a 1/4;
Migliore da 12/13 a 13/13; Ottima da 7/10 a 8/10. Le altre categorie
presenti mantengono la stessa concordanza. Questa partita non contiene
etichette di riferimento Geniale o Forzata.

Prime 12 mosse dubbie, 17 FEN distinte, cinque ricerche precedenti riutilizzate
e 12 nuove ricerche: 12.004.815 nodi effettivi, limite prefissato 12.060.000.
Il manifest e la raccolta sono monouso: non rilanciarli.

La partita era già stata studiata: il risultato misura un miglioramento in
questo caso, non una precisione generale su partite nuove. Il controllo
dell'analisi iniziale sulle cache resta 329/592. Soglie, rating e budget
dell'analisi iniziale sono invariati.

## Verifica del codice finale

- Suite unitaria completa: 265 test superati, un TODO preesistente.
- Ultima verifica mirata: 34 test superati.
- Regressioni browser: 17 scenari superati.
- Ultima verifica browser: quattro scenari superati, comprendenti confronto,
  salvataggio, riapertura offline, interruzione, cambio partita ed errori del
  motore durante avvio e ricerca. Il motore è simulato in questi test.
- Build di produzione e controllo del diff superati.

Le ultime rifiniture riguardano presentazione e gestione degli errori.
final-compatibility-check.json verifica senza nuove ricerche che il codice
finale riproduce tutte le 51 classificazioni approfondite raccolte e che i
20 input congelati sono integri. Gli hash originali della raccolta restano
immutati; gli hash del codice finale sono registrati separatamente.
