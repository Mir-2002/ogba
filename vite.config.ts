import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const reactGbajsNonstrictPlugin = {
  name: 'react-gbajs-nonstrict',
  enforce: 'pre' as const,
  resolveId(id: string) {
    if (id === 'react-gbajs') return '\0virtual:react-gbajs'
  },
  load(id: string) {
    if (id !== '\0virtual:react-gbajs') return
    const cjsPath = resolve(import.meta.dirname, 'node_modules/react-gbajs/dist/react-gbajs.js')
    const cjsBundle = readFileSync(cjsPath, 'utf-8')
    // Execute bundle via Function constructor to escape ESM strict mode.
    // GBA.js uses bare global assignments (ARMCoreArm = function(){}) that throw
    // ReferenceError in strict mode. new Function() runs in non-strict global scope.
    // The only external require('react') is satisfied by the shim; all other
    // requires are handled by webpack's internal i() closure inside the bundle.
    return `
import React from 'react'
const __m = { exports: {} }
;(new Function('module', 'exports', 'require',
  ${JSON.stringify(cjsBundle)}
))(__m, __m.exports, (n) => n === 'react' ? React : {})
export default __m.exports.default
export const GbaProvider = __m.exports.GbaProvider
export const GbaContext = __m.exports.GbaContext
export const LogLevel = __m.exports.LogLevel
`
  },
}

export default defineConfig({
  plugins: [reactGbajsNonstrictPlugin, tailwindcss(), react()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  build: { target: 'esnext' },
  optimizeDeps: { exclude: ['react-gbajs'] },
})
