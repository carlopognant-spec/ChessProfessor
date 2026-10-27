// Fixed source sequences with separately checked authored continuations.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-05",
  "entries": [
    {
      "id": "sicilian:chekhover-nf6",
      "family": "sicilian",
      "title": "Chekhover: 4...Cf6 e sostegno con 5.Cc3",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Nf6",
        "Nc3",
        "Bd7"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-05",
      "contrast": "Al quarto tratto il Nero sviluppa il cavallo g8 in f6, attaccando e4, invece di attaccare la donna d4 con Cc6. Il confronto con l’ordine ...Ad7/Cc3/Cf6 mostra come due scelte iniziali possano convergere nella stessa posizione.",
      "whitePlan": "Sviluppa Cc3 e aggiungi una difesa al pedone e4, già sostenuto dalla donna d4. Completa poi lo sviluppo degli alfieri e valuta la sicurezza del re: il percorso termina ancora in apertura.",
      "blackPlan": "Sviluppa Cf6 con pressione su e4. Nell’esempio didattico, Ad7 porta poi l’alfiere c8 fuori dalla casa iniziale; il cavallo b8 resta da sviluppare e il re è ancora in e8.",
      "endpointReason": "La fonte termina a 5.Cc3. La risposta didattica 5...Ad7 offre una mossa attiva al Nero e raggiunge la stessa posizione dell’altro ordine di mosse progettato. È un confronto breve di ordini, non una partita completa fino al mediogioco.",
      "sourceDisclosure": "La fonte documenta nove semimosse fino a 5.Cc3, oltre al nodo intermedio 4...Cf6. La risposta 5...Ad7 è una scelta didattica separata, soggetta a controllo motore limitato; la posizione comune finale non viene attribuita a questo record della fonte.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Qxd4 Nf6 Nc3 Bd7",
      "editorialNotes": {
        "6": "Dxd4 riprende con la donna. Il Nero sviluppa il cavallo g8 in f6: il suo bersaglio è il pedone e4, che la donna d4 difende già. Il cavallo f6 non attacca la donna d4; questo distingue la risposta da ...Cc6.",
        "8": "Cc3 sviluppa il cavallo b1 e aggiunge una difesa a e4. Nel seguito didattico ...Ad7 sviluppa l’alfiere c8; il cavallo nero b8 lascia libera la diagonale d7-c6-b5-a4. La posizione finale coincide con quella dell’ordine 4...Ad7 5.Cc3 Cf6: stesso schieramento, ma un diverso ingresso da giocare."
      },
      "provenance": {
        "kind": "documented-prefix-with-authored-continuation",
        "documentedPlies": 9,
        "authoredContinuationPlies": 1,
        "generatedPlies": 0,
        "continuationStatus": "bounded-engine-checked",
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "2e1f03274972c77b",
        "sourceName": "Sicilian, Chekhover, 4...Nf6 5.Nc3",
        "sourceEco": "B53",
        "sourceRecords": [
          {
            "id": "eco:db3b24f2c8f7bcc1",
            "positionId": "position:7161d5217d6da902",
            "plies": 8
          },
          {
            "id": "eco:2e1f03274972c77b",
            "positionId": "position:2b356881d43ce8ce",
            "plies": 9
          }
        ],
        "rootPositionId": "position:7161d5217d6da902",
        "engineSignature": "2fa1a90bf0744e51999f636028b42e816eff4c65a9c786ef9ae6e67e85cbe54b"
      }
    },
    {
      "id": "sicilian:chekhover-early-bd7",
      "family": "sicilian",
      "title": "Chekhover: 4...Ad7 prima dello sviluppo dei cavalli",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Bd7",
        "Nc3",
        "Nf6"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-05",
      "contrast": "Il Nero gioca Ad7 già al quarto tratto, con entrambi i cavalli nelle case iniziali. Questo ordine è distinto dal corso esistente con 4...Cc6 5.Ab5 Ad7 e può convergere nell’esempio con il nuovo percorso 4...Cf6.",
      "whitePlan": "Nell’esempio scelto, sviluppa Cc3 sostenendo e4 e prepara lo sviluppo degli alfieri. Controlla la diagonale dell’alfiere d7 prima di spostare la donna verso l’ala di donna.",
      "blackPlan": "Sviluppa l’alfiere c8 in d7 prima dei cavalli. La diagonale verso a4 è libera perché il cavallo b8 non è ancora in c6. Nel seguito didattico Cf6 attacca e4, difeso dalla donna d4 e dal cavallo c3.",
      "endpointReason": "La fonte termina dopo 4...Ad7. La coppia didattica 5.Cc3 Cf6 rende il modulo giocabile con entrambi i colori dal bivio e consente il confronto con l’altra sequenza che raggiunge la stessa posizione. Entrambi i re restano al centro.",
      "sourceDisclosure": "La fonte documenta otto semimosse, fino a 4...Ad7. La coppia 5.Cc3 Cf6 è una continuazione didattica scelta separatamente, con un confronto motore per ciascuna mossa. Non viene attribuita al record sorgente né confusa con il corso 5...Ad7 già disponibile.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Qxd4 Bd7 Nc3 Nf6",
      "editorialNotes": {
        "6": "Dxd4 riprende il pedone con la donna. Il Nero gioca subito Ad7: i cavalli sono ancora in b8 e g8 e la diagonale d7-c6-b5-a4 è libera. Nel vecchio ordine con ...Cc6 e Ab5 la disposizione è diversa: non trasferire automaticamente una scelta della donna da una posizione all’altra.",
        "8": "Nella coppia didattica Cc3 sviluppa il cavallo bianco e sostiene e4; ...Cf6 sviluppa il cavallo nero e attacca lo stesso pedone. Donna d4 e cavallo c3 difendono e4. Si raggiunge esattamente la posizione dell’ordine 4...Cf6 5.Cc3 Ad7: il confronto riguarda l’ordine delle mosse con cui si è arrivati qui."
      },
      "provenance": {
        "kind": "documented-prefix-with-authored-continuation",
        "documentedPlies": 8,
        "authoredContinuationPlies": 2,
        "generatedPlies": 0,
        "continuationStatus": "bounded-engine-checked",
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "7cd29665e2cfcb77",
        "sourceName": "Sicilian, Chekhover, 4...Bd7",
        "sourceEco": "B53",
        "sourceRecords": [
          {
            "id": "eco:7cd29665e2cfcb77",
            "positionId": "position:c9c6ddc7d60aa2cf",
            "plies": 8
          }
        ],
        "rootPositionId": "position:c9c6ddc7d60aa2cf",
        "engineSignature": "2fa1a90bf0744e51999f636028b42e816eff4c65a9c786ef9ae6e67e85cbe54b"
      }
    }
  ]
}
