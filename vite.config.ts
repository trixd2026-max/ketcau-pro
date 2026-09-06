import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Stub optional jspdf peer deps that we don't need for basic PDF generation
      canvg: path.resolve(__dirname, 'src/empty-module.js'),
      html2canvas: path.resolve(__dirname, 'src/empty-module.js'),
      dompurify: path.resolve(__dirname, 'src/empty-module.js'),
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})