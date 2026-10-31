import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
import {
  buildPresetCatalog,
  getAvailablePresets,
  hasChildLayers,
} from './preset-catalog'
import type { Preset } from '../../contracts/preset-schema'

describe('preset-catalog: dynamic preset discovery & emptiness detection', () => {
  describe('hasChildLayers', () => {
    it('returns false when graphNodes is empty or contains only master-frame-buffer', () => {
      expect(hasChildLayers([])).toBe(false)
      const rootOnly: Node[] = [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
      ]
      expect(hasChildLayers(rootOnly)).toBe(false)
    })

    it('returns true when graphNodes contains 1 or more child layers', () => {
      const nodesWithChild: Node[] = [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
        {
          id: 'test-layer-1',
          type: 'duperscopeNode',
          parentId: 'master-frame-buffer',
          position: { x: 10, y: 10 },
          data: { label: 'Scope 1' },
        },
      ]
      expect(hasChildLayers(nodesWithChild)).toBe(true)
    })
  })

  describe('buildPresetCatalog', () => {
    it('parses raw glob modules into sorted PresetCatalogItem records', () => {
      const mockModules: Record<string, { default?: Preset } | Preset> = {
        '/presets/b-preset.json': {
          default: {
            schemaVersion: 2,
            metadata: {
              name: 'B Dynamic Preset',
              description: 'Second preset',
              author: 'VJ Alpha',
              version: 1,
              created: '2026-10-30T00:00:00.000Z',
            },
            root: { id: 'master-frame-buffer', type: 'masterFrameBuffer', children: [] },
          } as unknown as Preset,
        },
        '/presets/a-preset.json': {
          schemaVersion: 2,
          metadata: {
            name: 'A Dynamic Preset',
            description: 'First preset',
            version: 1,
            created: '2026-10-30T00:00:00.000Z',
          },
          root: { id: 'master-frame-buffer', type: 'masterFrameBuffer', children: [] },
        } as unknown as Preset,
      }

      const catalog = buildPresetCatalog(mockModules)
      expect(catalog).toHaveLength(2)
      expect(catalog[0].id).toBe('a-preset')
      expect(catalog[0].name).toBe('A Dynamic Preset')
      expect(catalog[0].description).toBe('First preset')

      expect(catalog[1].id).toBe('b-preset')
      expect(catalog[1].name).toBe('B Dynamic Preset')
      expect(catalog[1].author).toBe('VJ Alpha')
    })

    it('falls back to file slug if metadata.name is absent', () => {
      const mockModules: Record<string, { default?: Preset } | Preset> = {
        '/presets/custom-flow.json': {
          default: {
            schemaVersion: 2,
            metadata: { name: '', version: 1, created: '2026-10-30T00:00:00.000Z' },
            root: { id: 'master-frame-buffer', type: 'masterFrameBuffer', children: [] },
          } as unknown as Preset,
        },
      }

      const catalog = buildPresetCatalog(mockModules)
      expect(catalog).toHaveLength(1)
      expect(catalog[0].id).toBe('custom-flow')
      expect(catalog[0].name).toBe('custom-flow')
    })
  })

  describe('getAvailablePresets', () => {
    it('discovers the actual repository presets dynamically from root presets/*.json', () => {
      const presets = getAvailablePresets()
      expect(presets.length).toBeGreaterThanOrEqual(3)

      const ids = presets.map((p) => p.id)
      expect(ids).toContain('mirrored-t-spectrum')
      expect(ids).toContain('quadrant-mirrored-spectrum')
      expect(ids).toContain('quadrant-spectrum-frame')

      // Verify each item has parsed preset object
      const quadrant = presets.find((p) => p.id === 'quadrant-mirrored-spectrum')
      expect(quadrant?.name).toBe('Quadrant Mirrored Spectrum')
      expect(quadrant?.preset.schemaVersion).toBe(2)
      expect(quadrant?.preset.root?.id).toBe('master-frame-buffer')
    })
  })
})
