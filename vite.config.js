import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANTE: se il repo GitHub si chiama es. "chess-study-app" e pubblichi
// su https://tuonome.github.io/chess-study-app/, imposta base a '/chess-study-app/'.
// Se invece pubblichi su un dominio custom o su <tuonome>.github.io (repo utente),
// lascia base: '/'.
export default defineConfig({
  plugins: [react()],
  base: '/ChessProfessor/',
})
