# SIC-07: revisione richiesta dai gate motore

Ripresa del 27 ottobre 2026. Il lotto non è stato integrato: l'app resta a **293 corsi e 293 esercizi**. Piano, prova di progetto, soglie e file protetti sono invariati.

Preflight e preparazione PASS: nove percorsi, 216 file preservati, 341 repliche legali, 90 transizioni e 27 fatti geometrici. Raccolte tutte le 37 ricerche primarie Stockfish 16 del piano, senza conferme: 7.400.000 nodi richiesti e 7.405.261 effettivi. Il ledger è in [opening-taimanov-be2-p022-engine](data/opening-taimanov-be2-p022-engine/manifest.json).

Il builder ha rifiutato la continuazione di `sicilian:taimanov-be2-nge7`, prima di generare i moduli. La lettura diagnostica di tutti i risultati salvati trova due soglie non rispettate nello stesso percorso:

| Controllo | Misura osservata | Soglia congelata |
| --- | ---: | ---: |
| 8.O-O dopo 7...Nge7 | perdita 160 cp (controllo +242, scelta +82) | massimo 100 cp |
| Esercizio 8.Ndb5, risposta ...axb5 | variazione 23 cp (+242 e -219) | minimo 200 cp |

Il controllo libero propone proprio `Ndb5`: il saldo materiale immediato dell'esercizio non basta a definirla una deviazione da punire. La ricerca limitata non dimostra una verità teorica generale, ma impedisce di pubblicare questo progetto secondo i suoi gate. Gli altri 13 confronti di continuazione e gli altri otto swing degli esercizi rispettano numericamente le rispettive soglie; questa diagnosi non equivale al replay completo di pubblicazione, interrotto al primo fallimento.

Il [dettaglio strutturato](data/opening-taimanov-be2-p022-gate-review.json) collega confronti, FEN e job. Il log completo del fallimento è nella cache indicata dal suo campo `buildEvidence`.

Come previsto dal [progetto](OPENING-TAIMANOV-BE2-P022-DESIGN.md), il prossimo passo è una revisione scacchistica della continuazione e dell'esercizio `nge7`. Non ripetere la raccolta, aumentare budget o soglie, sostituire automaticamente candidati o modificare in loco il piano congelato. Una revisione dovrà definire esplicitamente nuovi input e il trattamento del ledger già consumato prima di eventuali nuove ricerche. La pubblicazione resta congiunta per i nove percorsi e nove esercizi.

Nessuna integrazione runtime, build applicativa o esecuzione browser di SIC-07. Le aggiunte browser preparate in parallelo sono state rimosse, conservando il file preesistente. Nessun commit, push o deploy.
