# Interpretazione della diagnosi: categorie ordinarie e Forzata

Analisi di 592 mosse delle otto partite consentite, senza nuove ricerche motore e senza modificare le classificazioni dell'app. Dati riproducibili in results.json e report.md. La concordanza misura le etichette di riferimento disponibili: non dimostra che ogni etichetta di riferimento sia scacchisticamente corretta.

## Forzata

Una categoria Forzata ha un criterio strutturale verificabile: nella posizione prima della mossa esiste una sola mossa legale. Non confonderla con l'unica mossa buona: quest'ultima richiede valutazioni affidabili delle alternative ed eventualmente appartiene alla logica Grande.

Le sole tre posizioni con una mossa legale coincidono esattamente con le tre etichette Forzata del riferimento: personal-02/52 (26...Kxf7), personal-03/32 (16...Kxe7), personal-04/42 (21...Ke7). Attualmente sono Migliore. Una categoria primaria Forzata correggerebbe questi tre casi; un badge secondario permetterebbe invece di conservare anche la valutazione numerica. Nessuna delle due opzioni è stata attivata in questa diagnosi.

## I tre falsi positivi Errore grave

Tutti usano il confronto tra una ricerca della posizione iniziale e una ricerca separata della posizione dopo la mossa. I valori sono nella prospettiva del giocatore che muove; cp / 100 corrisponde ai pedoni.

| Partita e mossa | Riferimento | Alternativa migliore | Valutazione migliore -> giocata | Perdita indice locale |
|---|---|---|---|---|
| personal-01, 23...Nf8 | Errore | Qd8 | -3.17 -> -11.89 | 26.29 punti |
| personal-03, 14...Nxe5 | Mossa mancata | O-O | -1.22 -> -5.16 | 20.85 punti |
| personal-05, 7.Bxd7+ | Errore | Qe2 | +0.74 -> -3.45 | 24.93 punti |

La soglia locale Errore grave è oltre 20 punti: i tre risultati seguono direttamente questa regola, senza un'esclusione apposita per le opportunità mancate.

Per 14...Nxe5 l'avversario aveva appena sbagliato con Nxe5. La regola Mossa mancata riconosce l'errore precedente, ma richiede anche una possibilità vincente: l'alternativa O-O vale -1.22, indice locale 0.4243, sotto la soglia 0.75. Il rifiuto è no-confirmed-winning-opportunity. La variante giocata prosegue Qxe5+ Qe7 gxf4 gxf4 Qxe7+ Kxe7: restituisce il cavallo catturato e porta a un finale sfavorevole. La variante alternativa comincia O-O Ng4 Nf6 Nxf6+ Rxf6; non termina in matto e non prova una vittoria del Nero. È confermata la divergenza di etichetta, non una vittoria mancata dimostrata. Possibili cause da distinguere sono ricerca insufficiente, diversa scala/definizione del riferimento e opportunità difensiva. Allargare indiscriminatamente Mossa mancata maschererebbe questa distinzione.

Per 23...Nf8 il Nero era già inferiore; anche la migliore Qd8 resta negativa. La precedente Qxc7 non è un errore numerico e non crea una possibilità vincente: no-opponent-error. La variante dopo Nf8 comprende Qe5, Qxf6 e successivamente Qxb7, con perdita della donna. Il riferimento è Errore, non Mossa mancata: la divergenza è di gravità.

Per 7.Bxd7+ la precedente Nxf2 è un'imprecisione nella classificazione locale. Qe2 conserva una posizione quasi equilibrata; Bxd7+ viene risposta con Bxd7 e lascia una posizione inferiore. L'analisi delle alternative segnala già missed-defense per Qe2, con copertura parziale, ma non una vittoria disponibile. Anche qui il riferimento è Errore e il conflitto principale riguarda la gravità.

## Perché Buona, Imprecisione ed Errore hanno bassa concordanza

| Riferimento | Corrette | Assegnazioni più indulgenti |
|---|---|---|
| Buona | 17/94 | 52 Ottima e 10 Migliore |
| Imprecisione | 17/57 | 19 Ottima, 17 Buona e 1 Migliore |
| Errore | 10/36 | 10 Ottima, 5 Buona, 7 Imprecisione e 2 Migliore |

1. Le soglie locali non sono quelle pubbliche del riferimento: Ottima arriva a 3 punti anziché 2. Il confronto isolato con le bande pubbliche porta Buona da 17 a 34 corrette, ma Ottima da 83 a 77. Imprecisione resta 17/57 ed Errore 10/36. In totale si passa da 326 a 337/592 (+11): 17 correzioni e 6 regressioni, con 40 cambi di etichetta. Questa simulazione mantiene fisse le categorie speciali e non equivale a un rilascio completo.

2. Il problema non si esaurisce nelle bande. L'indice locale è sigmoid(cp/400), indipendente dal rating. La documentazione del riferimento descrive Expected Points dipendente da rating e valutazione; la curva completa non è pubblicata nella pagina consultata. Le mediane delle perdite locali sono 2.18 punti per Buona, 3.81 per Imprecisione e 5.16 per Errore: molte mosse attese come Imprecisione o Errore ricadono quindi in fasce troppo indulgenti. In posizioni già molto vinte o perse la curva si appiattisce, riducendo la perdita numerica anche per variazioni importanti in centipedoni. Questi effetti richiedono una valutazione del modello, non eccezioni per singole mosse.

3. Per la mossa che coincide con PV1 l'app riutilizza la stessa valutazione per migliore e giocata: perdita zero per costruzione. Succede a 44 mosse etichettate diversamente dal riferimento: 31 Ottima, 10 Buona, 1 Imprecisione e 2 Errore. Le soglie non possono risolvere quei casi. Occorre verificare se la divergenza riguarda la scelta del motore, il budget o il riferimento; il child separato non è automaticamente una verità superiore.

4. La qualità delle evidenze limita il confronto: 221/592 mosse usano una ricerca separata della posizione successiva, 438 posizioni hanno linee root di profondità diverse, 65 hanno radici duplicate e 12 perdite grezze sono negative, poi tagliate a zero. Nessuna delle 592 cache originarie contiene specialLines (snapshot completato); l'app attuale può produrli nelle nuove analisi. Questi conteggi descrivono problemi di confrontabilità, senza dimostrare che ogni posizione coinvolta sia classificata male.

Il fenomeno ricorre in più partite: per esempio Buona è riconosciuta 5/23 in personal-03 e 2/25 in Saint-Amant–Staunton. Non è una singola partita anomala.

## Prossimo intervento proposto

- Definire Forzata attraverso l'unica mossa legale, conservando a parte la valutazione numerica per riepiloghi e spiegazioni.
- Rendere esplicita la provenienza e l'affidabilità del confronto numerico, usando snapshot coerenti quando disponibili e segnalando le discordanze invece di tradurle silenziosamente in una valutazione sicura.
- Valutare separatamente la curva cp -> indice e le bande. Qualunque candidato dovrà essere misurato su tutte le categorie, con regressioni esplicite e partite separate da quelle usate per svilupparlo. Non cercare soglie ottimali sulle stesse 592 etichette per poi dichiarare generalizzazione.
- Per 14...Nxe5 verificare in un successivo esperimento con budget dichiarato se O-O nasconde una risorsa migliore. Fino ad allora mantenere distinta l'opportunità difensiva da una vittoria mancata.

Fonte primaria per bande, Expected Points e definizione pubblica di Miss: [Chess.com Help Center](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc), consultata il 9 ottobre 2026. Le definizioni attuali potrebbero differire da quelle usate quando sono state generate le etichette di riferimento.
