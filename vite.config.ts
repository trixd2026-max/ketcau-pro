import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // jspdf has optional peer deps that are not needed for basic PDF export
      external: [],
      onwarn(warning, warn) {
        // Suppress unresolved dynamic imports from jspdf optional features
        if (warning.code === 'UNRESOLVED_IMPORT' && 
            (warning.message.includes('canvg') || 
             warning.message.includes('html2canvas') ||
             warning.message.includes('dompurify'))) {
          return
        }
        warn(warning)
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    exclude: ['canvg', 'html2canvas', 'dompurify'],
  },
})