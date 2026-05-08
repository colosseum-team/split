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
  // Dev-only proxy: in production the SPA hits same-origin `/api/*` and
  // nginx forwards it to the backend container. In `vite dev` there's no
  // nginx, so we point /api/* directly at the backend started locally
  // (`docker compose up -d backend` or `npm run dev --workspace backend`).
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
