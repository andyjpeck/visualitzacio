import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * Vite plugin that serves root `presets/*.json` under `/visualitzacio/presets/` during dev
 * and emits them directly as Rollup assets during production build without mutating disk.
 */
function presetsPlugin(): Plugin {
  return {
    name: 'visualitzacio-presets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const hasImportQuery = /[?&]import\b/.test(req.url || '')
        if (req.url && !hasImportQuery && (req.url.startsWith('/visualitzacio/presets/') || req.url.startsWith('/presets/'))) {
          const cleanUrl = req.url.split('?')[0]
          const filename = path.basename(cleanUrl)
          if (filename.endsWith('.json')) {
            const filePath = path.resolve(import.meta.dirname, 'presets', filename)
            if (existsSync(filePath) && statSync(filePath).isFile()) {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
              res.end(readFileSync(filePath))
              return
            }
          }
        }
        next()
      })
    },
    generateBundle() {
      const srcDir = path.resolve(import.meta.dirname, 'presets')
      if (existsSync(srcDir)) {
        for (const file of readdirSync(srcDir)) {
          if (file.endsWith('.json')) {
            this.emitFile({
              type: 'asset',
              fileName: `presets/${file}`,
              source: readFileSync(path.join(srcDir, file)),
            })
          }
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/visualitzacio/',
  plugins: [react(), presetsPlugin()],
})
