import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/classify': {
        target: 'https://apiclassify.zenclass.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/classify/, ''),
      }
    }
  }
})
