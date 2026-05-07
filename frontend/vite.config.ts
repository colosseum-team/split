import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      buffer: 'buffer',
      process: 'process',
    },
  },
  define: {
    global: 'globalThis',
  },
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
