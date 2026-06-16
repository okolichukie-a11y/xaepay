import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Code-splitting strategy: pull the heaviest third-party libs into their own
// chunks so the main bundle is smaller on first load. Each chunk is
// content-hashed and immutable (see vercel.json cache headers), so once a
// chunk is in the browser cache it never needs to be re-fetched.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdf-lib')) return 'pdf';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('marked')) return 'marked';
            if (id.includes('react-dom') || /\/react\//.test(id)) return 'react';
            if (id.includes('lucide-react')) return 'icons';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
