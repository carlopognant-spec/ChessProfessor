// Fixed source sequences with separately checked authored continuations.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-06",
  "entries": [
    {
      "id": "sicilian:early-g6-bc4",
      "family": "sicilian",
      "title": "Siciliana: 4...g6 e sviluppo con Ac4",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Nxd4",
        "g6",
        "Nc3",
        "Bg7",
        "Be3",
        "Nf6",
        "Bc4",
        "Nc6"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-06",
      "contrast": "Il Nero prepara il fianchetto con g6 prima di Cf6, avendo già giocato d6. Il percorso segue un ordine documentato fino ad Ac4 e Cc6; confrontalo con il Dragone già disponibile, che sviluppa prima Cf6 e sceglie f3 prima di Ac4.",
      "whitePlan": "Sviluppa Cc3 per sostenere e4, poi Ae3 per sostenere il cavallo d4. Ac4 punta verso f7 lungo la diagonale c4-d5-e6-f7. Valuta poi la sicurezza del re: la linea si ferma prima degli arrocchi.",
      "blackPlan": "Prepara Ag7 con g6, poi sviluppa Cf6 e Cc6. Cf6 attacca e4 ma interrompe temporaneamente la diagonale dell'alfiere g7; Cc6 mette pressione sul cavallo bianco d4.",
      "endpointReason": "La sequenza documentata termina con 7...Cc6. Entrambi i cavalli neri sono sviluppati, il fianchetto è realizzato e i due alfieri bianchi sono fuori dalle case iniziali; entrambi i re sono ancora al centro.",
      "sourceDisclosure": "Tutte le quattordici semimosse sono documentate. Il record iniziale chiama l'ordine Accelerated Dragon, ma qui il pedone nero è già in d6: il titolo del corso esplicita le mosse e mantiene distinto il corso Dragone accelerato che passa da 2...Cc6. Gli altri ordini che raggiungono la stessa posizione non sono automaticamente percorsi giocati.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Nxd4 g6 Nc3 Bg7 Be3 Nf6 Bc4 Nc6",
      "editorialNotes": {
        "6": "Cxd4 riprende con il cavallo e libera f3. Il Nero gioca g6, preparando Ag7 senza aver ancora sviluppato il cavallo g8. Il pedone d è già in d6: osserva questo ordine concreto prima di trasferire i piani di un altro corso del Dragone.",
        "8": "Cc3 sviluppa il cavallo b1 e difende e4. Con Ag7 il Nero completa il fianchetto: in questa posizione la diagonale g7-f6-e5-d4 è libera fino al cavallo bianco d4, sostenuto dalla donna d1.",
        "10": "Ae3 aggiunge una difesa al cavallo d4. Il Nero sviluppa Cf6 e attacca e4, difeso dal cavallo c3. Ora il cavallo f6 interrompe la diagonale dell'alfiere g7: la pressione diretta su d4 non va descritta come se quella casa fosse ancora libera.",
        "12": "Ac4 sviluppa l'alfiere lungo la diagonale verso f7. Con Cc6 il Nero attacca il cavallo d4, sostenuto dalla donna d1 e dall'alfiere e3. Il Bianco non ha ancora giocato f3 e nessun re ha arroccato: la posizione va distinta dal seguito del corso Dragone già presente."
      },
      "provenance": {
        "kind": "documented-line",
        "documentedPlies": 14,
        "authoredContinuationPlies": 0,
        "generatedPlies": 0,
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "fc2ae42fb689cbe2",
        "sourceName": "Sicilian Defense, Dragon Variation",
        "sourceEco": "B35",
        "sourceRecords": [
          {
            "id": "eco:2298d57ac45d558b",
            "positionId": "position:37ad4d193ecfba38",
            "plies": 8
          },
          {
            "id": "eco:fc2ae42fb689cbe2",
            "positionId": "position:138f2afb197c959e",
            "plies": 14
          }
        ],
        "rootPositionId": "position:37ad4d193ecfba38",
        "engineSignature": "98f6f1c0768b8f78f0a8d1541de38b0102714a6d450a22c07397f5c44b1aa3ab"
      }
    },
    {
      "id": "sicilian:early-a6",
      "family": "sicilian",
      "title": "Siciliana: 4...a6 prima di Cf6",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Nxd4",
        "a6",
        "Nc3",
        "Nf6"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-06",
      "contrast": "Il Nero gioca a6 prima di Cf6. La coppia didattica Cc3/Cf6 porta alla disposizione iniziale della Najdorf, ma attraverso un ordine diverso: la scelta precoce a6 è il punto da confrontare.",
      "whitePlan": "Sviluppa Cc3 e sostieni il pedone e4. Prima di portare un pezzo in b5 controlla il pedone a6; dopo il seguito didattico confronta la posizione con l'ingresso della Najdorf.",
      "blackPlan": "Con a6 controlla b5 senza attaccare il cavallo d4. Nel seguito scelto sviluppa Cf6 contro e4; gli altri pezzi e la sicurezza del re richiedono ancora attenzione.",
      "endpointReason": "La fonte termina dopo 4...a6. La coppia didattica Cc3/Cf6 offre mosse attive ai due colori dal bivio e permette di confrontare due ingressi nella stessa disposizione della Najdorf.",
      "sourceDisclosure": "La fonte documenta otto semimosse. Le due successive, Cc3 e Cf6, sono scelte didattiche con controlli separati. L'ordine del corso Najdorf rimane distinto e non viene attribuito a questo record.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Nxd4 a6 Nc3 Nf6",
      "editorialNotes": {
        "6": "Cxd4 riprende con il cavallo. Il Nero risponde a6: il pedone controlla b5, ma non attacca il cavallo d4. Entrambi i cavalli neri sono ancora nelle case iniziali e l'alfiere f1 può svilupparsi attraverso e2.",
        "8": "Nel seguito didattico Cc3 sostiene e4 e Cf6 lo attacca. Si raggiunge la disposizione della Najdorf dopo 4...Cf6 5.Cc3 a6, con lo stesso lato al tratto e le stesse possibilità di arrocco. Le mosse sono state giocate in un ordine diverso: studiare questo ingresso aiuta a riconoscere ciò che coincide e ciò che cambia prima della convergenza."
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
        "sourceId": "8d1d21aff6e14300",
        "sourceName": "Sicilian: Open, 2...d6, 4...a6",
        "sourceEco": "B54",
        "sourceRecords": [
          {
            "id": "eco:8d1d21aff6e14300",
            "positionId": "position:1c0c85c09af4e9e7",
            "plies": 8
          }
        ],
        "rootPositionId": "position:1c0c85c09af4e9e7",
        "engineSignature": "98f6f1c0768b8f78f0a8d1541de38b0102714a6d450a22c07397f5c44b1aa3ab"
      }
    },
    {
      "id": "sicilian:early-e5",
      "family": "sicilian",
      "title": "Siciliana: 4...e5 e ritirata Cb3",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Nxd4",
        "e5",
        "Nb3",
        "Nf6"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-06",
      "contrast": "La spinta e5 attacca subito il cavallo d4, prima dello sviluppo dei cavalli neri. Il percorso sceglie Cb3 come ritirata didattica e Cf6 come risposta; altre ritirate legali non sono automaticamente errori.",
      "whitePlan": "Riconosci l'attacco del pedone e5 al cavallo d4. Nell'esempio ritira il cavallo in b3 e poi considera lo sviluppo dei pezzi rimasti; la ritirata non difende il pedone e4.",
      "blackPlan": "Guadagna spazio con e5 e sviluppa Cf6 contro e4. Il pedone d6 sostiene e5; i pedoni c ed e non controllano d5, ma i pezzi possono ancora influire su quella casa.",
      "endpointReason": "La fonte termina dopo 4...e5. La coppia didattica Cb3/Cf6 rende visibile la risposta a un attacco di pedone e la successiva pressione su e4, lasciando entrambe le parti ancora in apertura.",
      "sourceDisclosure": "Otto semimosse sono documentate; Cb3 e Cf6 costituiscono una coppia didattica con un confronto limitato per ciascuna mossa. Non è dichiarata una sequenza forzata né l'unica ritirata valida.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Nxd4 e5 Nb3 Nf6",
      "editorialNotes": {
        "6": "Cxd4 riprende il pedone, ma e5 attacca subito il cavallo d4. Il pedone d6 sostiene e5. Questo richiede attenzione al cavallo prima di proseguire lo sviluppo: a differenza di a6 e g6, la spinta crea un attacco immediato contro quel pezzo.",
        "8": "Nell'esempio Cb3 porta il cavallo fuori dall'attacco del pedone e5. Il Nero sviluppa Cf6 contro e4, che il cavallo b3 non difende. Il cavallo bianco b1 è ancora fermo; la linea termina qui e non afferma che le altre ritirate legali siano sbagliate."
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
        "sourceId": "5b821d81f6456cf4",
        "sourceName": "Sicilian: Open, 2...d6, 4...e5",
        "sourceEco": "B54",
        "sourceRecords": [
          {
            "id": "eco:5b821d81f6456cf4",
            "positionId": "position:90d2577b74c0d2da",
            "plies": 8
          }
        ],
        "rootPositionId": "position:90d2577b74c0d2da",
        "engineSignature": "98f6f1c0768b8f78f0a8d1541de38b0102714a6d450a22c07397f5c44b1aa3ab"
      }
    }
  ]
}
