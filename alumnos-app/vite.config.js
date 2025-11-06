import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar Firebase en su propio chunk
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
          // Separar React Router
          'react-router': ['react-router-dom'],
          // Separar librerías de UI
          'ui-libs': ['@headlessui/react', '@heroicons/react'],
          // Separar QR code
          'qrcode': ['qrcode.react'],
        },
      },
    },
    // Aumentar el límite de advertencia para chunks grandes
    chunkSizeWarningLimit: 600,
  },
})
