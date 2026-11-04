# SIC-08 R1: sette percorsi Taimanov con Ad3

Revisione esplicita del 28 ottobre 2026 per completare l'ampliamento già concordato: **302 → 309 corsi ed esercizi**. Il [progetto originale](OPENING-TAIMANOV-BD3-P022-DESIGN.md), il suo piano, il ledger e la [diagnosi dei gate](data/opening-taimanov-bd3-p022-gate-review.json) restano conservati.

Gli altri sei percorsi e relativi esercizi sono invariati. Nel percorso con ...Cf6, arrocco e ...h5, le aggiunte Cxc6/dxc6 hanno perso rispettivamente 123 e 134 cp rispetto ai controlli, oltre il limite di 100. Il nuovo seguito didattico è `h3 Nxd4 Bxd4 Bc5 Bxc5 Qxc5`: h3 controlla g4 senza rendere illegale ...Cg4, poi il percorso gioca fino in fondo i cambi centrali e degli alfieri. La sequenza è scelta dopo revisione delle analisi salvate, non attribuita alla fonte.

Il vecchio esercizio di quel percorso dipendeva dalla posizione dopo Cxc6 e non è riutilizzato. Il nuovo esercizio parte dal prefisso documentato e propone Cf5/exf5: una cattura del cavallo con 42 repliche immediate e saldo minimo +2. La qualità del compenso deve superare il confronto motore, non viene dedotta dal solo materiale. Gli altri sei esercizi conservano le prove compatibili.

Il [progetto scacchistico R1](data/opening-taimanov-bd3-p022-r1-course-design.json), il [piano](data/opening-taimanov-bd3-p022-r1-plan.json) e la [prova offline](data/opening-taimanov-bd3-p022-r1-design-verification.json) contengono sette percorsi: 113 semimosse documentate e 17 didattiche, 23 note, 213 repliche, 31 fatti geometrici e 56 transizioni dirette verificate per entrambi i colori. La copertura prevista resta 1.994 esatte, 203 trasposte, 10.125 assenti, con tutte le 14 posizioni del sottoramo esatte.

Budget prima della nuova raccolta: **42 job logici, 30 riusati con FEN completa/radici/politica identiche e 12 nuovi primari**. I nuovi job sono sei ricerche vincolate delle mosse aggiunte, cinque controlli liberi sulle posizioni nuove e una ricerca dopo Cf5. Il controllo libero iniziale viene riusato e condiviso con la nuova baseline dell'esercizio. Firme e trascrizioni originali restano intatte e vengono rilette in fase di verifica.

Stockfish 16, hash dell'eseguibile, un thread, hash 32 MB, MultiPV 1, clear hash, 200.000 nodi e timeout 30 secondi invariati. Al massimo **24 nuovi go e 4.800.000 nodi richiesti**, con eventuali conferme/interruzioni. Includendo i 34 go precedenti, il tetto aggregato è **58 go e 11.600.000 nodi**, sotto i 68 go del piano originale. Nessuna ripetizione compatibile, ricerca automatica di candidati o variazione delle soglie.

Pubblicare congiuntamente i sette percorsi e sette esercizi soltanto dopo tutti i **17 confronti didattici e sette esercizi**: perdita massima 100 cp, swing minimo 200 cp, materiale almeno +2. Un ulteriore fallimento richiede una nuova revisione esplicita.

QA invariata: 64 casi nuovi più otto regressioni, **72 selezionati** e **287 roadmap Siciliana disponibili**, con la build no-env e gli stessi timeout. Restano protetti **523 file**, inclusi il lotto iniziale fallito e tutti i lotti precedenti. Gli aggregatori devono tornare esattamente ai loro hash di baseline annullando i soli import e spread dichiarati.

Prima dell'integrazione verificare [revise-opening-taimanov-bd3.mjs](../scripts/revise-opening-taimanov-bd3.mjs) con `--check`; dopo usare i controlli della pipeline comune, senza rigenerare la prova congelata. Il timeout noto del test dello strumento per le bozze rimane distinto dal collaudo dei contenuti. Nessun commit, push o deploy.
