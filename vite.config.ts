import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this project from https://sane24.github.io/flow-of-water/
export default defineConfig({
  base: '/flow-of-water/',
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
})
