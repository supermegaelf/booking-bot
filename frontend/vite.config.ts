import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const getBackendUrl = () => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL
  }
  const apiUrl = process.env.VITE_API_URL
  if (apiUrl && apiUrl.startsWith('http')) {
    return apiUrl.replace('/api', '')
  }
  return 'http://localhost:8000'
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: ['localhost', '127.0.0.1', 'frontend', '.'],
    hmr: {
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: getBackendUrl(),
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

