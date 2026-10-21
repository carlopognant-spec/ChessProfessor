// Fixed source sequences with separately checked authored continuations.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-03",
  "entries": [
    {
      "id": "sicilian:chekhover-c4-g6",
      "family": "sicilian",
      "title": "Chekhover: 7.c4 e preparazione del fianchetto",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Nc6",
        "Bb5",
        "Bd7",
        "Bxc6",
        "Bxc6",
        "c4",
        "Nf6",
        "Nc3",
        "g6"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-03",
      "contrast": "Dopo il cambio in c6 il Bianco gioca c4 prima di Cc3. Il pedone c4 controlla d5; nel ramo già disponibile il Bianco sviluppa subito il cavallo.",
      "whitePlan": "Sostieni il centro con c4 e sviluppa Cc3, che difende e4. Completa poi lo sviluppo e prepara la sicurezza del re: il percorso non ha ancora raggiunto una posizione con sviluppo concluso.",
      "blackPlan": "Sviluppa Cf6 con pressione su e4 e prepara il fianchetto con g6. L’alfiere è ancora in f8: Ag7 resta una possibilità successiva, da valutare nella posizione concreta.",
      "endpointReason": "La fonte termina dopo 8...g6. Sono visibili il controllo di d5 con c4 e la preparazione del fianchetto; entrambi i re sono ancora al centro. È un modulo di confronto, non una partita completa verso il mediogioco.",
      "sourceDisclosure": "Tutte le 16 semimosse del percorso sono presenti nella sequenza del catalogo; il passaggio intermedio dopo 7.c4 corrisponde a un secondo record della stessa fonte.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Qxd4 Nc6 Bb5 Bd7 Bxc6 Bxc6 c4 Nf6 Nc3 g6",
      "editorialNotes": {
        "12": "Con c4 il Bianco controlla d5 con un pedone prima di sviluppare il cavallo b1. Il Nero risponde Cf6, sviluppando un pezzo che attacca e4. La donna d4 difende già quel pedone: pressione e guadagno di materiale non sono la stessa cosa.",
        "14": "Cc3 aggiunge una difesa a e4. Con g6 il Nero prepara Ag7, ma l’alfiere si trova ancora in f8. Entrambi i re restano al centro: il confronto delle strutture prosegue con lo sviluppo e la scelta dell’arrocco, non con un attacco già pronto."
      },
      "provenance": {
        "kind": "documented-line",
        "documentedPlies": 16,
        "authoredContinuationPlies": 0,
        "generatedPlies": 0,
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "cab3a0b1cf0331d6",
        "sourceName": "Sicilian, Chekhover, 7.c4 Nf6 8.Nc3 g6",
        "sourceEco": "B53",
        "sourceRecords": [
          {
            "id": "eco:e3db46f894b3eb7c",
            "positionId": "position:65a7a0f0faa6092b",
            "plies": 13
          },
          {
            "id": "eco:cab3a0b1cf0331d6",
            "positionId": "position:559d29741ab02c1f",
            "plies": 16
          }
        ],
        "rootPositionId": "position:65a7a0f0faa6092b",
        "engineSignature": "224a6e3df49b39c738224e68bf0f7e3466117a9f44fea1f337bc7336512e8987"
      }
    },
    {
      "id": "sicilian:chekhover-qd3",
      "family": "sicilian",
      "title": "Chekhover: 10.Dd3 e arrocco del Nero",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Nc6",
        "Bb5",
        "Bd7",
        "Bxc6",
        "Bxc6",
        "Nc3",
        "Nf6",
        "Bg5",
        "e6",
        "O-O-O",
        "Be7",
        "Qd3",
        "O-O"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-03",
      "contrast": "Al decimo tratto il Bianco sposta la donna in d3 invece di portare la torre h1 in e1. La differenza resta visibile dopo l’arrocco nero scelto come seguito didattico.",
      "whitePlan": "Conserva il sostegno a e4 dalla donna d3 e coordina i pezzi dopo l’arrocco lungo. La torre h1 non è ancora entrata in e1: valuta il suo sviluppo senza trattarlo come già avvenuto.",
      "blackPlan": "Nell’esempio, arrocca corto e porta la torre in f8. Controlla il centro e la sicurezza del re prima di iniziare operazioni sulle ali; gli arrocchi opposti da soli non dimostrano un attacco vincente.",
      "endpointReason": "Dopo il seguito didattico 10...O-O i re sono su ali opposte e si può confrontare la posizione della donna con il ramo 10.The1. La fonte termina una semimossa prima, a 10.Dd3.",
      "sourceDisclosure": "La fonte documenta le prime 19 semimosse, fino a 10.Dd3. L’arrocco 10...O-O è una continuazione didattica scelta separatamente e soggetta a controllo motore limitato; non viene attribuita a questo record del catalogo.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Qxd4 Nc6 Bb5 Bd7 Bxc6 Bxc6 Nc3 Nf6 Bg5 e6 O-O-O Be7 Qd3 O-O",
      "editorialNotes": {
        "18": "Dd3 mantiene la difesa di e4 lungo la diagonale d3-e4. Nel seguito didattico ...O-O porta il re nero in g8 e la torre in f8. Le torri bianche sono in d1 e h1: a differenza del ramo 10.The1, la torre di re deve ancora essere coordinata."
      },
      "provenance": {
        "kind": "documented-prefix-with-authored-continuation",
        "documentedPlies": 19,
        "authoredContinuationPlies": 1,
        "generatedPlies": 0,
        "continuationStatus": "bounded-engine-checked",
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "ce70dab23d629d53",
        "sourceName": "Sicilian, Chekhover, Main Line, 10.Qd3",
        "sourceEco": "B53",
        "sourceRecords": [
          {
            "id": "eco:ce70dab23d629d53",
            "positionId": "position:cb47b173ef24af42",
            "plies": 19
          }
        ],
        "rootPositionId": "position:cb47b173ef24af42",
        "engineSignature": "224a6e3df49b39c738224e68bf0f7e3466117a9f44fea1f337bc7336512e8987"
      }
    },
    {
      "id": "sicilian:chekhover-qd2",
      "family": "sicilian",
      "title": "Chekhover: 11.Dd2 e coordinazione delle torri",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Nc6",
        "Bb5",
        "Bd7",
        "Bxc6",
        "Bxc6",
        "Nc3",
        "Nf6",
        "Bg5",
        "e6",
        "O-O-O",
        "Be7",
        "Rhe1",
        "O-O",
        "Qd2",
        "Qc7"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-03",
      "contrast": "Il percorso continua il corso con ...Ad7 oltre la sua posizione finale: 11.Dd2 è un nuovo tratto, non una scelta alternativa a una mossa già presente in quel corso.",
      "whitePlan": "Riposiziona la donna in d2 dopo aver portato la torre h1 in e1. Le torri sono in d1 ed e1; e4 resta sostenuto anche dal cavallo c3 e dalla torre e1.",
      "blackPlan": "Nel seguito didattico Dc7 libera d8 e collega le torri a8 e f8. L’alfiere c6 interrompe la colonna davanti alla donna: non attribuirle un attacco diretto al pedone c2.",
      "endpointReason": "La fonte arriva a 11.Dd2; il seguito dimostrativo ...Dc7 rende visibile il collegamento delle torri nere. È una prosecuzione breve del percorso già disponibile, con una mossa attiva per ciascun colore dopo il punto di ripresa.",
      "sourceDisclosure": "La fonte documenta 21 semimosse, fino a 11.Dd2. La risposta 11...Dc7 è una continuazione didattica scelta separatamente e soggetta a controllo motore limitato, non una mossa attribuita a questo record del catalogo.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Qxd4 Nc6 Bb5 Bd7 Bxc6 Bxc6 Nc3 Nf6 Bg5 e6 O-O-O Be7 Rhe1 O-O Qd2 Qc7",
      "editorialNotes": {
        "20": "Dd2 sposta la donna dalla sua casa centrale senza cambiare la disposizione delle torri bianche in d1 ed e1. Nel seguito scelto ...Dc7 libera d8: le torri nere a8 e f8 sono ora collegate. L’alfiere nero in c6 blocca la colonna c davanti alla donna, che non attacca direttamente c2."
      },
      "provenance": {
        "kind": "documented-prefix-with-authored-continuation",
        "documentedPlies": 21,
        "authoredContinuationPlies": 1,
        "generatedPlies": 0,
        "continuationStatus": "bounded-engine-checked",
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "aed1668deddb6fa8",
        "sourceName": "Sicilian, Chekhover, Main Line, 11.Qd2",
        "sourceEco": "B53",
        "sourceRecords": [
          {
            "id": "eco:aed1668deddb6fa8",
            "positionId": "position:1e26b7829d87dc1e",
            "plies": 21
          }
        ],
        "rootPositionId": "position:1e26b7829d87dc1e",
        "engineSignature": "224a6e3df49b39c738224e68bf0f7e3466117a9f44fea1f337bc7336512e8987"
      }
    }
  ]
}
