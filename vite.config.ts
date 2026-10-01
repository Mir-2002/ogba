import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
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

// Precache the app shell and the mGBA core (wasm + pthread worker) so repeat
// visits load instantly and work offline. Cached responses keep their
// COOP/COEP headers, so the page stays cross-origin isolated when served by
// the service worker. Supabase traffic is never cached.
const pwaPlugin = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
  manifest: {
    name: 'oGBA',
    short_name: 'oGBA',
    description: 'Browser GBA emulator with cloud save states',
    theme_color: '#4b2e83',
    background_color: '#0b0a10',
    display: 'standalone',
    icons: [
      { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,wasm,woff2,png,svg,ico}'],
    // mgba.wasm is ~1.8 MB, just under Workbox's 2 MiB default; leave headroom
    // so a bigger core release doesn't silently fall out of the precache

    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    navigateFallback: 'index.html',
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
        handler: 'NetworkOnly',
      },
    ],
  },
})

export default defineConfig({
  plugins: [crossOriginIsolationPlugin, tailwindcss(), react(), pwaPlugin],
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
