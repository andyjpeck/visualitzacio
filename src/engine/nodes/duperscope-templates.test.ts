import { describe, expect, it } from 'vitest'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import {
  DEFAULT_DUPERSCOPE_CONFIG,
  DUPERSCOPE_TEMPLATES,
  getDuperscopeTemplateById,
} from './duperscope-templates'
import { isNodeDirty } from '../../ui/inspector/component-preset-utils'
import type { Node } from '@xyflow/react'

describe('Duperscope Templates & Dirty-State Guard (Task 3.1)', () => {
  it('defines 4 built-in classic generative templates', () => {
    expect(DUPERSCOPE_TEMPLATES).toHaveLength(4)
    const ids = DUPERSCOPE_TEMPLATES.map((t) => t.id)
    expect(ids).toEqual([
      'oscilloscope-tunnel',
      'frequency-spectrum-ribbon',
      'reactive-lissajous',
      'beat-particle',
    ])
  })

  it('compiles and instantiates every built-in template cleanly without errors', () => {
    const ctx = createDefaultFrameContext()
    ctx.$BASS = 0.8
    ctx.$MID = 0.5
    ctx.$TREBLE = 0.4
    ctx.$TIME = 2.5
    ctx.timeDomainData = new Float32Array(512).fill(0.25)
    ctx.frequencyData = new Uint8Array(256).fill(128)

    for (const template of DUPERSCOPE_TEMPLATES) {
      const node = template.instantiate(`scope-${template.id}`)
      expect(node.hasErrors).toBe(false)
      expect(node.drawMode).toBe(template.drawMode)
      expect(node.audioMode).toBe(template.audioMode)

      // Verify update executes without throwing
      expect(() => node.update(ctx)).not.toThrow()
      expect(node.getActivePointCount()).toBeGreaterThan(0)

      node.dispose()
    }
  })

  it('retrieves template by ID or returns undefined for unknown IDs', () => {
    const tunnel = getDuperscopeTemplateById('oscilloscope-tunnel')
    expect(tunnel).toBeDefined()
    expect(tunnel?.name).toBe('Oscilloscope Tunnel')

    expect(getDuperscopeTemplateById('non-existent')).toBeUndefined()
  })

  describe('isNodeDirty detection for duperscopeNode', () => {
    it('returns false for default clean duperscope node', () => {
      const cleanNode: Node = {
        id: 'scope-1',
        type: 'duperscopeNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'Duperscope',
          drawMode: DEFAULT_DUPERSCOPE_CONFIG.drawMode,
          audioMode: DEFAULT_DUPERSCOPE_CONFIG.audioMode,
          channel: DEFAULT_DUPERSCOPE_CONFIG.channel,
          opacity: 1.0,
          initCode: DEFAULT_DUPERSCOPE_CONFIG.initCode,
          beatCode: '',
          frameCode: '',
          pointCode: '',
        },
      }

      expect(isNodeDirty(cleanNode)).toBe(false)
    })

    it('returns true when scripts or modes are customized', () => {
      const modifiedScriptsNode: Node = {
        id: 'scope-2',
        type: 'duperscopeNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'Duperscope',
          initCode: 'n = 500;',
          beatCode: '',
          frameCode: '',
          pointCode: '',
        },
      }
      expect(isNodeDirty(modifiedScriptsNode)).toBe(true)

      const modifiedModeNode: Node = {
        id: 'scope-3',
        type: 'duperscopeNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'Duperscope',
          drawMode: 'lineLoop',
        },
      }
      expect(isNodeDirty(modifiedModeNode)).toBe(true)

      const appliedTemplateNode: Node = {
        id: 'scope-4',
        type: 'duperscopeNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'Duperscope',
          appliedTemplateId: 'oscilloscope-tunnel',
        },
      }
      expect(isNodeDirty(appliedTemplateNode)).toBe(true)
    })
  })
})
