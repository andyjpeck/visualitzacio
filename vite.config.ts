import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Vite plugin that serves root `presets/*.json` under `/visualitzacio/presets/` during dev
 * and synchronizes them to `public/presets/` prior to production bundle.
 */
function presetsPlugin(): Plugin {
  return {
    name: 'visualitzacio-presets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url.startsWith('/visualitzacio/presets/') || req.url.startsWith('/presets/'))) {
          const cleanUrl = req.url.split('?')[0]
          const filename = path.basename(cleanUrl)
          const filePath = path.resolve(import.meta.dirname, 'presets', filename)
          if (existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/json')
            res.end(readFileSync(filePath))
            return
          }
        }
        next()
      })
    },
    buildStart() {
      const srcDir = path.resolve(import.meta.dirname, 'presets')
      const targetDir = path.resolve(import.meta.dirname, 'public/presets')
      if (existsSync(srcDir)) {
        if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true })
        for (const file of readdirSync(srcDir)) {
          if (file.endsWith('.json')) {
            copyFileSync(path.join(srcDir, file), path.join(targetDir, file))
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
