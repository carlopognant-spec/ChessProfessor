# QA classification fixtures

This directory contains historical games with annotated categories intended as reference fixtures for QA and calibration of move-quality classification.

Files:

- game-1-chigorin-steinitz-1892.json
- game-2-saintamant-staunton-1843.json

Each file contains:
- a PGN description
- the original game moves
- expected category labels by ply, covering: Libro, Migliore, Ottima, Buona, Imprecisione, Errore, Grande, Geniale, and other relevant labels

Use these fixtures to compare the system's generated categories against the expected historical annotations.
