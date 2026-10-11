import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' makes every asset path relative, so the built game runs from any folder or host.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
