# Partite confermate

Aggiornato il 14 ottobre 2026: 11 partite personali (5 nuove) e 2 storiche di confronto.
661 semimosse personali; 854 contando anche le storiche.

Ogni cartella contiene partita.pgn, riferimento.json, lista.md e analisi.txt. indice.json registra provenienza, hash e confronto.
Le cinque nuove sono confermate da Carlo e confrontate col profilo applicativo a 200k il 14 ottobre: 167/262 categorie concordanti (63,7%).
Report: [confronto nuovo](../../agent-output/new-references-200k-v1/report.md); [esito e limiti](../../agent-output/new-references-200k-v1/findings.md).
La prima nuova ha il PGN ricostruito dalle SAN; gli altri quattro PGN sono originali. Riferimenti e hash sono invariati.
Misura successiva del 15 ottobre sulle stesse cinque partite di sviluppo:
concordanza iniziale corrente 172/262; fino a due approfondimenti con la nuova
priorità 188/262, rispetto a 184/262 con l'ordine precedente (5 correzioni,
1 regressione). [Report delle priorità](../../agent-output/refinement-quality-priority-v2/report.md).
I risultati del 14 ottobre sopra restano storici; nessuna etichetta è stata modificata.
Il gruppo successivo `counterfactual-v12` porta l'approfondita da 188 a 189/262,
con una correzione esatta e zero regressioni, eliminando inoltre una falsa
Geniale in entrambe le modalità (il caso resta numericamente diverso dal
riferimento). Iniziale 172/262 e precedenti 338/592 invariati.
[Report Mosse mancate e false Geniali](../../agent-output/opportunity-sacrifice-batch-v1/report.md).
Il dossier successivo `counterfactual-v13` recupera prove già salvate: due
Mosse mancate distinte corrette, zero regressioni; iniziale 173/262,
approfondita 191/262 e precedenti 338/592. Mosse mancate recenti approfondite
8 -> 10 riconosciute su 19, con una falsa attribuzione invariata. Nessuna
nuova ricerca e nessuna modifica delle etichette confermate.
[Dossier e verifica](../../agent-output/special-evidence-dossier-v1/report.md).
La successiva v14 corregge due false Grandi distinte (Be7 e Nd6) in entrambi
i profili: iniziale 175/262, approfondita 193/262, precedenti 338/592. Zero
regressioni; Grandi recenti corrette ferme a 7/10, false attribuzioni 4 -> 2.
[Report Grandi](../../agent-output/grande-decision-evidence-v1/report.md).
La v15 distingue la storia del vantaggio già perso e restituito: 31.Nf6+
passa da Mossa mancata a Errore grave in entrambi i profili. Una correzione
distinta, zero regressioni: iniziale 176/262, approfondita 194/262,
precedenti 338/592. False Mosse mancate recenti 1 -> 0; quelle correttamente
riconosciute restano 8/19 iniziali e 10/19 approfondite. Le due false Grandi
residue restano aperte. Nessuna nuova ricerca o modifica dei riferimenti.
[Audit delle precedenze e verifica v15](../../agent-output/rule-precedence-audit-v1/report.md).
Il nuovo controllo facoltativo **Verifica le Grandi**, dopo i due
approfondimenti canonici, porta 194 -> 195/262: Bc4 torna Migliore, zero
regressioni; false Grandi 2 -> 1, corrette 7/10 invariate. Servono due ricerche
aggiuntive nel campione, con riuso delle posizioni già approfondite. Iniziale
176/262 e precedenti 338/592 invariati; i riferimenti non sono modificati.
L'estensione che recuperava Nxe4 è esclusa per la regressione su Qd3.
[Risultati e limiti della verifica](../../agent-output/empirical-grande-verification-v1/report.md).
Le successive v16/v17 correggono sei mosse distinte senza regressioni:
180/262 iniziali, 198/262 approfondite e 340/592 precedenti. Sulle 854 mosse
distinte, nel profilo piu completo: Grandi21/34 e Geniali3/4, entrambe con
zero false attribuzioni. Restano14 casi aperti. Le etichette di riferimento
non sono state modificate; Rxf5+ storica ora e riconosciuta Geniale.
[Report del lotto](../../agent-output/special-completion-v1/report.md).
Gli originali in Partite/1-6, le fixture e gli artefatti agent-output restano per riprodurre i test e i report. Le vecchie 7-10 senza annotazioni sono in ../Archivio-non-analizzate/.

| ID | Data | Bianco | Nero | Semimosse | Stato |
|---|---|---|---|---:|---|
| [personal-01](personal-01/lista.md) | 2026.10.01 | BUMCestinait0 | boyjonbum | 51 | gia-confrontata-con-motore |
| [personal-02](personal-02/lista.md) | 2026.10.03 | BUMCestinait0 | skui1 | 75 | gia-confrontata-con-motore |
| [personal-03](personal-03/lista.md) | 2026.10.04 | BUMCestinait0 | ProprioI0 | 136 | gia-confrontata-con-motore |
| [personal-04](personal-04/lista.md) | 2026.10.04 | ProprioI0 | BUMCestinait0 | 55 | gia-confrontata-con-motore |
| [personal-05](personal-05/lista.md) | 2026.10.04 | BUMCestinait0 | ProprioI0 | 37 | gia-confrontata-con-motore |
| [personal-06](personal-06/lista.md) | 2026.10.04 | BUMCestinait0 | ProprioI0 | 45 | gia-confrontata-con-motore |
| [chesscom-185262315732](chesscom-185262315732/lista.md) | 2026.10.13 | BUMCestinait0 | Smisiano | 66 | confrontata-200k-2026-10-14 |
| [chesscom-184316820266](chesscom-184316820266/lista.md) | 2026.09.24 | ProprioI0 | Smisiano | 66 | confrontata-200k-2026-10-14 |
| [chesscom-184316313800](chesscom-184316313800/lista.md) | 2026.09.24 | Smisiano | ProprioI0 | 46 | confrontata-200k-2026-10-14 |
| [chesscom-185230271130](chesscom-185230271130/lista.md) | 2026.10.12 | ProprioI0 | BUMCestinait0 | 55 | confrontata-200k-2026-10-14 |
| [game-1-chigorin-steinitz-1892](Storiche/game-1-chigorin-steinitz-1892/lista.md) | 1892.01.01 | Mikhail Chigorin | Wilhelm Steinitz | 61 | gia-confrontata-con-motore |
| [game-2-saintamant-staunton-1843](Storiche/game-2-saintamant-staunton-1843/lista.md) | 1843.12.19 | Pierre Charles Fournier de Saint Amant | Howard Staunton | 132 | gia-confrontata-con-motore |
| [chesscom-185230000668](chesscom-185230000668/lista.md) | 2026.10.12 | BUMCestinait0 | ProprioI0 | 29 | confrontata-200k-2026-10-14 |


Aggiornamento v18: Qh5 storica riconosciuta Grande con prova di una nuova
minaccia Ng4# e confronto causale valido; Kb6 resta Migliore. Nel campione
piu completo: Grandi22/34,Geniali3/4,FP0; restano13casi aperti.
341/592 precedenti,180/262 iniziali e198/262 approfondite,zero regressioni.
Nessuna etichetta di riferimento modificata.


Versione v20,profilo piu completo con verifica facoltativa:Nxe4Grande e
Re1storicaGrande,senza regressioni o cambi nei settecampinumerici.
24/34Grandi e3/4Geniali,FP0;10/10Grandi nelle5recenti,14/24precedenti.
180/262initial,199/262refined,342/592old. Restano11casi aperti.
[Report v19/v20](../../agent-output/grande-recovery-proof-v1/report.md).


## v21: verifica completa dei sacrifici

Integrato il comando Verifica i sacrifici:accettazioni e riprese immediate
con ricerche dedicate,senza cambiare i sette campi numerici. Conserva anche
i tentativi terminati fra iterazioni MultiPV,senza certificarli o ripeterli
automaticamente. Preserva prove complete nei risalvataggi vecchi/parziali.

Verificati1116 osservazioni e5archivi canonici recenti:zero regressioni,
Grandi24/34 eGeniali4/4,zerofalseattribuzioni. Restano10Grandi. Rb3corretta
eQxe5corretta anche nel profilo di partenza,giaGeniale in quello raffinato.
Dopo verifica181/262,199/262,343/592. Dati di sviluppo,nessunariserva usata.
[Report v21](../../agent-output/all-sacrifice-proofs-v1/report.md).


## v22: scelte decisive e alternative indipendenti

Verificati1116 casi e5archivi canonici. Qxc7,Nc4,e6+,Nxc3 diventano Grandi
con prove separate e punteggi invariati.28/34Grandi e4/4Geniali,zero false
attribuzioni e regressioni.181/262,199/262,347/592 dopo verifiche facoltative.
Nessuna modifica alle etichette di riferimento;restano6Grandi.

Le prime ipotesi sono state respinte per falseNc3/Qxf6. La versione integrata
verifica tutte le alternative indipendentemente e distingue il ripristino
di una rotta di matto gia disponibile da una nuova decisione. Nuovo comando
Verifica le scelte decisive,max12mosse24FEN per richiesta;risultati incompleti
e prove complete conservati,nessunretryautomatico,riusooffline0worker.
509test+1TODO57file,build e5browserPASS. Dati di sviluppo,nonvalidazione
indipendente. [Report v22](../../agent-output/native-winning-integration-v1/report.md).
