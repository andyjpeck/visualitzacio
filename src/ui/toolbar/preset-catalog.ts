import type { Node } from '@xyflow/react'
import type { Preset } from '../../contracts/preset-schema'

export interface PresetCatalogItem {
  id: string
  name: string
  description?: string
  author?: string
  version?: number
  schemaVersion?: number
  preset: Preset
}

/**
 * Determines whether a graph contains 1 or more child layers under Master Output.
 * Returns false if the canvas contains only master-frame-buffer or is empty.
 */
export function hasChildLayers(graphNodes: Node[] = []): boolean {
  return graphNodes.some((node) => node.id !== 'master-frame-buffer')
}

/**
 * Parses raw glob import records from Vite into a cleanly sorted array of PresetCatalogItem.
 */
export function buildPresetCatalog(
  rawModules: Record<string, { default?: Preset } | Preset>,
): PresetCatalogItem[] {
  const items: PresetCatalogItem[] = []

  for (const [filepath, mod] of Object.entries(rawModules)) {
    const rawPreset = (mod && typeof mod === 'object' && 'default' in mod && mod.default)
      ? mod.default
      : (mod as Preset)

    if (!rawPreset || typeof rawPreset !== 'object') continue

    // Derive ID from filename e.g. /presets/mirrored-t-spectrum.json -> mirrored-t-spectrum
    const filename = filepath.split('/').pop() || filepath
    const id = filename.replace(/\.json$/i, '')
    const name = rawPreset.metadata?.name?.trim() || id

    items.push({
      id,
      name,
      description: rawPreset.metadata?.description,
      author: rawPreset.metadata?.author,
      version: rawPreset.metadata?.version,
      schemaVersion: rawPreset.schemaVersion,
      preset: rawPreset,
    })
  }

  // Sort alphabetically by display name
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Dynamically discovers all presets residing in root `presets/*.json` via Vite's glob import.
 */
export function getAvailablePresets(): PresetCatalogItem[] {
  const modules = import.meta.glob('/presets/*.json', { eager: true }) as Record<
    string,
    { default?: Preset } | Preset
  >
  return buildPresetCatalog(modules)
}
