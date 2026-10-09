# Diagnosi categorie ordinarie

- version: "counterfactual-v6"
- plies: 592
- newSearches: 0
- appChanged: false
- exactCurrent: 326
- exactPublicBandsOnly: 337
- directBandChanges: 40
- wrongBlunders: 3
- forcedLegalMoves: 3
- forcedReferences: 3
- sourceCounts: {"root-pv":368,"independent-position":221,"checkmate":3}
- mixedRootDepths: 438
- duplicateRootPositions: 65
- negativeRawDrop: 12
- ordinaryReferenceMovesWithPlayedPv1: 44
- sourceHashesUnchanged: true

## Distribuzioni delle perdite locali

| Riferimento | Numero | Mediana perdita | Q25 | Q75 | Giocata PV1 | Perdita grezza negativa |
|---|---:|---:|---:|---:|---:|---:|
| Migliore | 178 | 0.00 | 0.00 | 0.00 | 120 | 5 |
| Ottima | 121 | 0.22 | 0.00 | 1.18 | 31 | 5 |
| Buona | 94 | 2.18 | 0.47 | 3.85 | 10 | 2 |
| Imprecisione | 57 | 3.81 | 2.33 | 5.79 | 1 | 0 |
| Errore | 36 | 5.16 | 2.30 | 10.82 | 2 | 0 |
| Errore grave | 8 | 36.98 | 22.93 | 59.83 | 0 | 0 |

## Tre Errore grave discordanti

### personal-01/46 Nf8

Riferimento Errore; attuale Errore grave; perdita 26.29 punti. Migliore Qd8: -317 cp / mate null; giocata -1189 cp / mate null.
Contesto precedente: {"san":"Qxc7","numerical":"best","bestEval":265,"playedEval":265,"beforeMoverIndex":0.34017824502794247,"offeredMoverIndex":0.34017824502794247}. Blocco Mossa mancata: no-opponent-error. Eventi secondari: [].
PV migliore: Qd8 Qxa7 Kh7 Rad1 Bxd1 Rxd1 Re7 Qb7 f6 b4 Ne5 Qe4+ f5 Rxd8. PV dopo la giocata: Qe5 f6 Qxf6 e5 Rxe5 Rxe5 Bxe5 Qb7 Qh8+ Kf7 Qg7+ Ke8 Qxb7 Nd7 Qa8+ Kf7 Qd5+ Ke8.

### personal-03/28 Nxe5

Riferimento Mossa mancata; attuale Errore grave; perdita 20.85 punti. Migliore O-O: -122 cp / mate null; giocata -516 cp / mate null.
Contesto precedente: {"san":"Nxe5","numerical":"mistake","bestEval":398,"playedEval":122,"beforeMoverIndex":0.2699256160188812,"offeredMoverIndex":0.4243356489574506}. Blocco Mossa mancata: no-confirmed-winning-opportunity. Eventi secondari: [].
PV migliore: O-O Ng4 Nf6 Nxf6+ Rxf6 O-O-O fxg3 hxg3 Rxf2 Qe8+ Kg7 Qe5+ Kg6 Rd2. PV dopo la giocata: Qxe5+ Qe7 gxf4 gxf4 Qxe7+ Kxe7 Kd2 Kf6 Bg2 Rg8 Be4 Bf5 Rae1.

### personal-05/13 Bxd7+

Riferimento Errore; attuale Errore grave; perdita 24.93 punti. Migliore Qe2: 74 cp / mate null; giocata -345 cp / mate null.
Contesto precedente: {"san":"Nxf2","numerical":"inaccuracy","bestEval":105,"playedEval":-51,"beforeMoverIndex":0.4347492524329001,"offeredMoverIndex":0.5318318894162243}. Blocco Mossa mancata: no-opponent-error. Eventi secondari: [{"kind":"missed-defense","status":"supported","coverage":{"analyzed":4,"available":4,"legal":43,"allLegal":false,"scope":"analyzed-alternatives","source":"legacy-lines","discarded":[{"uci":"c1g5","depth":11}]},"alternative":{"san":["Qe2","dxc6","Bg5","Qd7","Rf1","h6","Bc1","Qe7"]}}].
PV migliore: Qe2 dxc6 Bg5 Qd7 Rf1 h6 Bc1 Qe7 Rxf2 Bxf2+ Kxf2 Bg4 Nbd2 O-O-O Qc4 Bh5. PV dopo la giocata: Bxd7 Qd5 Qe7 Qxb7 O-O Rf1 Rab8 Qd5 Be6 Qd2 Ne4.

## Posizioni forzate

- personal-02/52 Kxf7: 1 mosse legali, riferimento Forzata, attuale Migliore.
- personal-03/32 Kxe7: 1 mosse legali, riferimento Forzata, attuale Migliore.
- personal-04/42 Ke7: 1 mosse legali, riferimento Forzata, attuale Migliore.

## Limiti

Le bande pubbliche sono applicate solo per una simulazione numerica isolata: score e categorie speciali restano fissi, senza fitting. L’indice locale sigmoid(cp/400) non è Expected Points calibrato sul rating. Il child può essere più profondo ma non è automaticamente una verità più affidabile; ricerche separate possono divergere. Nessuna modifica alle soglie dell’app.

[Documentazione primaria](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc).
