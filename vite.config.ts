/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativo: funciona no GitHub Pages (subpasta) e em qualquer hospedagem estática
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Recharts (Dashboard) e jsPDF (PDFs) ficam em partes separadas carregadas sob demanda
  build: { chunkSizeWarningLimit: 450 },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
