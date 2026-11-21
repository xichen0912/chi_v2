import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Builds the two scripts the static pages share:
 *   --mode data   → <repo root>/shared/data.js   (window.CHI: sessions, venue, rooms …)
 *   --mode widget → <repo root>/shared/askchi.js (Ask CHI chatbot)
 */
export default defineConfig(({ mode }) => {
  const widget = mode === 'widget'
  return {
    plugins: [react()],
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      outDir: '../../shared',
      emptyOutDir: false,
      copyPublicDir: false,
      lib: {
        entry: widget ? 'src/widget.tsx' : 'src/exportData.ts',
        formats: ['iife'],
        name: widget ? 'AskChi' : 'ChiData',
        fileName: () => (widget ? 'askchi.js' : 'data.js'),
      },
    },
  }
})
