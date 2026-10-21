// Frozen constructed deviations verified separately from the historic corpus.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-01",
  "policy": {
    "engine": "Stockfish 16",
    "engineHash": "5568b400df3425718d310050b5b77fcc81d30b82fdf231a90f40b520c74de3bf",
    "nodes": 200000,
    "threads": 1,
    "hashMb": 32,
    "minimumCpChange": 200,
    "minimumImmediateMaterial": 2,
    "kind": "constructed-deviation-v1"
  },
  "entries": [
    {
      "id": "practice:sicilian:najdorf-bg5-classical",
      "courseId": "sicilian:najdorf-bg5-classical",
      "family": "sicilian",
      "title": "Najdorf con 6.Ag5: sviluppo classico: la donna esposta",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Nxd4",
        "Nf6",
        "Nc3",
        "a6",
        "Bg5",
        "e6",
        "f4",
        "Nxe4",
        "Bxd8"
      ],
      "startIndex": 14,
      "exerciseSide": "w",
      "variant": true,
      "practice": true,
      "signature": "6a2ec25b5af3ce1565c879eb348fe42cdf9a03d7936d76677f10372ae650f48b",
      "kind": "constructed-deviation-v1",
      "objective": "Trova la cattura della donna resa possibile dallo spostamento del cavallo.",
      "contrast": "Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.",
      "whitePlan": "Sostieni e4 con i pezzi e collega f4 alla pressione centrale. Df3 libera d1 per l'arrocco lungo; Ad3 e The1 completano il sostegno di e4. Prima di avanzare sul lato di re, controlla l'attività nera contro c3 ed e4.",
      "blackPlan": "Sviluppa l'alfiere in e7 e il cavallo b8 in d7, mantenendo d6 ed e6. La coppia ...b5 e ...Ab7 attiva l'alfiere sulla diagonale verso e4. Il re è ancora in e8: valuta la sicurezza e la rottura ...d5 prima di aprire il centro.",
      "prevention": "Prima della deviazione, h6 è una possibilità proposta dal controllo. Non è l'unica difesa valida: confrontala con la scelta del corso.",
      "explanation": "Dopo 7...Cxe4, 8.Axd8 cattura la donna lungo la diagonale liberata. ...Rxd8 è legale, ma il Nero ha ceduto la donna per alfiere e pedone. Anche ...Cxc3 limita il guadagno immediato a cinque punti: controllare tutte le repliche evita di descrivere la cattura come gratuita."
    },
    {
      "id": "practice:sicilian:chekhover-bd7",
      "courseId": "sicilian:chekhover-bd7",
      "family": "sicilian",
      "title": "Chekhover: 4.Dxd4 e risposta ...Ad7: la donna esposta",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Nc6",
        "Bc4",
        "Nxd4"
      ],
      "startIndex": 9,
      "exerciseSide": "b",
      "variant": true,
      "practice": true,
      "signature": "20d19642174d7f3f9ed790c5b351b78b414b4be99f5e0efba810912cb4c1bd35",
      "kind": "constructed-deviation-v1",
      "objective": "Trova la cattura della donna dopo uno sviluppo che ignora la minaccia.",
      "contrast": "Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.",
      "whitePlan": "Gestisci i tempi sulla donna e completa lo sviluppo. Il cambio in c6 elimina il cavallo che attaccava d4, ma cede uno dei due alfieri. Con Cc3, Ag5, arrocco lungo e The1 sostieni e4 e coordina i pezzi prima di aprire nuove linee.",
      "blackPlan": "Attacca la donna con lo sviluppo del cavallo e rispondi all'inchiodatura interponendo l'alfiere. Dopo ...Axc6 mantieni la coppia degli alfieri, sviluppa il lato di re e arrocca. Cerca attività contro e4 e sulla colonna c semiaperta, senza presumere che la donna esposta sia già perduta.",
      "prevention": "Prima della deviazione, Qd3 è una possibilità proposta dal controllo. Non è l'unica difesa valida: confrontala con la scelta del corso.",
      "explanation": "Dopo 5.Ac4, il cavallo c6 può catturare la donna in d4. Il Bianco può riprendere con Cxd4: il Nero guadagna la donna per un cavallo, sei punti materiali alla replica immediata. Nel corso Ab5 evita questa cattura grazie all'inchiodatura al re."
    }
  ],
  "uncovered": []
}
