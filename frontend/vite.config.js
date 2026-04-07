import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
<<<<<<< HEAD
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
    },
  },
})
