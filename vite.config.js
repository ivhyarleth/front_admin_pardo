import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    watch: {
      usePolling: true
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React y React DOM
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separar Recharts (es una librería grande)
          'recharts-vendor': ['recharts'],
          // Separar utilidades
          'utils-vendor': ['clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
