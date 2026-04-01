import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mapgen/',
  build: {
    outDir: '../../prototypes/mapgen',
    emptyOutDir: true,
  },
})
