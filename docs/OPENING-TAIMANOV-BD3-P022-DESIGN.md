# SIC-08: Taimanov con Ae3 e Ad3

Progetto del 28 ottobre 2026 per ampliare P02 da 302 a **309 corsi ed esercizi**, preservando identificatori e progressi precedenti. Segue i nove percorsi con Ae2 di SIC-07 R1, già integrati e collaudati.

Il prefisso è `e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Bd3`. Il corpus A congelato contiene 14 record, 14 posizioni attualmente assenti e sette ordini terminali. Il lotto comprende tutte le sette foglie, senza equiparare questa completezza locale alla completezza della Taimanov. Fonti, revisioni e licenze sono quelle già approvate e conservate nel piano; non viene rivendicata una nuova consultazione remota.

I percorsi confrontano ...b5 con cambio immediato o arrocco, ...Cf6 seguito da ...b5, ...Ad6, ...h5, ...Cxd4 oppure ...Ce5/h3/Ac5/Rh1. I finali didattici completano cambi e sviluppo, offrendo almeno un turno attivo a entrambi i colori da ogni bivio. Sono 113 semimosse documentate e 13 didattiche, con 21 note specifiche da Ad3 in poi. Una mossa presente nel catalogo non è automaticamente una scelta migliore.

Il [progetto scacchistico](data/opening-taimanov-bd3-p022-course-design.json), il [piano](data/opening-taimanov-bd3-p022-plan.json) e la [prova offline](data/opening-taimanov-bd3-p022-design-verification.json) separano fonti e aggiunte. La revisione ha controllato 28 fatti geometrici. In particolare, il pedone e4 interrompe la diagonale Ad3-h7; dopo ...Ad6 l'alfiere nero difende h2, quindi il relativo esercizio non propone una cattura illegale del re in h2.

Sette deviazioni costruite, in FEN complete distinte, hanno 197 repliche immediate legalmente enumerate e saldo minimo almeno +2. Alcuni temi si ripetono: non sono sette temi tattici nuovi né errori di frequenza misurata. Il materiale non sostituisce il confronto motore.

Prima di qualsiasi raccolta: Stockfish 16 congelato, un thread, hash 32 MB, MultiPV 1, hash azzerato prima di ogni ricerca, 200.000 nodi richiesti e timeout 30 secondi. I job sono **34 primari**, 6.800.000 nodi richiesti; al massimo una conferma per job secondo la politica precedente, fino a **68 go e 13.600.000 nodi richiesti**, contando anche interruzioni e fallimenti. Sei baseline degli esercizi condividono un controllo didattico; la settima ha un controllo distinto. Nessuna ricerca compatibile dei lotti registrati è da ripetere.

Gate invariati: perdita massima delle aggiunte 100 cp, variazione minima degli esercizi 200 cp, materiale immediato almeno +2. Pubblicazione congiunta soltanto dopo tutti i 13 confronti e sette esercizi. Un fallimento conserva il ledger e richiede una revisione esplicita: niente ricerca automatica di sostituti, ripetizioni, aumento del budget o delle soglie.

La copertura prevista è **1.994 posizioni esatte, 203 solo trasposte e 10.125 assenti**: 14 nuove esatte. I due ordini con ...b5 e arrocco convergono, ma hanno contatori FEN diversi e progressi separati. Sono verificati 56 confronti diretti tra le sette linee e il genitore con Ae2, per entrambi i colori. La scelta Dd2 al settimo tratto resta legale e documentata ma fuori dai percorsi correnti.

QA pianificata: 64 nuovi casi browser (14 completamenti, sette esercizi, 14 cambi live, 28 checkpoint e una scelta scoperta) più otto regressioni: **72 selezionati**, conservando 223 casi precedenti per **287 disponibili**. Usare la build no-env compilata, stessi scenari e timeout del collaudo precedente; controllare i conteggi con `--list`. Gli aggregatori sono ammessi solo se annullare import e spread dichiarati ripristina esattamente la baseline. Nessun altro codice runtime viene modificato.

Il generatore [design-opening-taimanov-bd3.mjs](../scripts/design-opening-taimanov-bd3.mjs) controlla il progetto senza motore. Eseguirne `--check` prima dell'integrazione; dopo usare baseline, `build --check`, report, inventari e QA della pipeline comune. I 412 file protetti comprendono anche i ledger originali e R1 di SIC-07. Il timeout noto del test dello strumento per le bozze resta distinto dai controlli del lotto e non viene modificato.

Gli altri ingressi Taimanov con a3, f4, Dd2 e ...Cf6 anticipato, i rami Taimanov successivi e gli ingressi siciliani Ac4/Ad3/f3 già rinviati restano nel perimetro A. Nessun commit, push o deploy è autorizzato.
