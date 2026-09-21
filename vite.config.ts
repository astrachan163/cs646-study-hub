import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// BASE_PATH is the URL prefix the site is served from.
// GitHub Pages project sites live at https://<user>.github.io/<repo>/, so CI sets
// BASE_PATH=/<repo>/ (see .github/workflows/deploy.yml). Local dev uses "/".
const basePath = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base: basePath,
  plugins: [react()],
  build: {
    // Content chunks are many small files; raise the limit only for the mermaid vendor chunk noise.
    chunkSizeWarningLimit: 1600,
  },
})
