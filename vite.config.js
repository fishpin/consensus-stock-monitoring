import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@cometchat'))           return 'vendor-cometchat';
          if (id.includes('recharts'))             return 'vendor-recharts';
          if (id.includes('node_modules/react'))   return 'vendor-react';
        },
      },
    },
  },
})
