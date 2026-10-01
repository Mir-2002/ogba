import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// mGBA's WASM core needs SharedArrayBuffer (its audio/pthread workers), which
// browsers only expose to cross-origin-isolated pages. vercel.json carries
// the same two headers in production; this plugin does it for `vite dev` /
// `vite preview` so local testing matches.
const crossOriginIsolationPlugin: Plugin = {
  name: 'cross-origin-isolation',
  configureServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
      next()
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
      next()
    })
  },
}

export default defineConfig({
  plugins: [crossOriginIsolationPlugin, tailwindcss(), react()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  server: { host: true },
  preview: { host: true },
  build: { target: 'esnext' },
  worker: { format: 'es' },
  // mgba.js self-spawns a pthread Worker via `new Worker(new URL('mgba.js', import.meta.url), { type: 'module' })`.
  // Excluding it from dep pre-bundling keeps that import.meta.url pointed at its real file so the
  // worker/wasm URLs resolve correctly; see the Vercel/local header plugin above for the COOP/COEP
  // it needs at runtime.
  optimizeDeps: { exclude: ['@thenick775/mgba-wasm'] },
})
