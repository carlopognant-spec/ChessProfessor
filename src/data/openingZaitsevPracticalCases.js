// Constructed deviation checked by its own frozen engine ledger.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-02",
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
      "id": "practice:sicilian:chekhover-zaitsev",
      "courseId": "sicilian:chekhover-zaitsev",
      "family": "sicilian",
      "title": "Chekhover Zaitsev: 5...Dd7 e cambio in c6: il ritiro che lascia la donna",
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
        "Qd7",
        "Bd3",
        "Nxd4"
      ],
      "startIndex": 11,
      "exerciseSide": "b",
      "variant": true,
      "practice": true,
      "signature": "585e6714f7e9c72d822ab51cb3d9de0f47e5ac8a0605bbcd1159c7b5bdaf0e15",
      "kind": "constructed-deviation-v1",
      "objective": "Trova la cattura della donna dopo il ritiro dell’alfiere.",
      "contrast": "Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.",
      "whitePlan": "Nel seguito dimostrativo, cambia l’alfiere per il cavallo c6 e togli il pezzo che attacca d4. Dopo ...Dxc6 controlla la pressione su e4, sviluppa i pezzi rimasti e prepara la sicurezza del re. Non dare per obbligatorio il cambio in c6.",
      "blackPlan": "Interponi la donna in d7; dopo Axc6, riprendi con la donna senza doppiare i pedoni. Conservi i due alfieri, entrambi ancora sulle case iniziali: completa lo sviluppo e controlla i tempi che il Bianco può guadagnare attaccando la donna.",
      "prevention": "Prima della deviazione, Qe3 è una possibilità proposta dal controllo. Non è l'unica difesa valida: confrontala con la scelta del corso.",
      "explanation": "Dopo 6.Ad3 l’alfiere non si trova più sulla diagonale verso d7. ...Cxd4 cattura la donna bianca e non espone la donna nera alla risposta Axd7. Il Bianco può riprendere con Cxd4: il guadagno immediato minimo è di sei punti materiali, non di nove."
    }
  ],
  "uncovered": []
}
