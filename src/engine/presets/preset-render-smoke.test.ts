import { describe, expect, it, test } from 'vitest'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import type { VisualNode } from '../../contracts/renderer-like'
import { LAYER_NODE_TYPES, type LayerNodeType } from '../../contracts/node-types'
import { createMockRenderer } from '../../test/fixtures/renderer-mock'
import { deserializePreset } from './preset-deserializer'
import { FrameBufferNode } from '../frame-buffer/frame-buffer-node'
import { DuperscopeNode } from '../nodes/duperscope-node'
import { DUPERSCOPE_TEMPLATES } from '../nodes/duperscope-templates'
import { StaticImageNode } from '../nodes/static-image-node'
import { TestVisualNode } from '../visual-node'

/**
 * Fixture registry providing preset parameters and engine node constructors.
 * Any new node added to LAYER_NODE_TYPES must provide a valid fixture here.
 */
const NODE_FIXTURE_REGISTRY: Record<
  LayerNodeType,
  {
    params: Record<string, unknown>
    instantiate: (id: string, params: Record<string, unknown>) => VisualNode
  }
> = {
  duperscopeNode: {
    params: {
      drawMode: 'lines',
      audioMode: 'waveform',
      channel: 'center',
      opacity: 1.0,
      initCode: DUPERSCOPE_TEMPLATES[0].initCode,
      beatCode: DUPERSCOPE_TEMPLATES[0].beatCode,
      frameCode: DUPERSCOPE_TEMPLATES[0].frameCode,
      pointCode: DUPERSCOPE_TEMPLATES[0].pointCode,
    },
    instantiate: (id, params) =>
      new DuperscopeNode({
        id,
        name: 'Duperscope Smoke Node',
        drawMode: params.drawMode as 'lines',
        audioMode: params.audioMode as 'waveform',
        channel: params.channel as 'center',
        opacity: params.opacity as number,
        initCode: String(params.initCode),
        beatCode: String(params.beatCode),
        frameCode: String(params.frameCode),
        pointCode: String(params.pointCode),
      }),
  },
  frameBuffer: {
    params: {
      inputBlendMode: 'normal',
      outputBlendMode: 'normal',
      feedback: false,
      opacity: 1.0,
    },
    instantiate: (id) => new FrameBufferNode({ id, name: 'FrameBuffer Smoke Node' }),
  },
  staticImage: {
    params: {
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      fitMode: 'contain',
      opacity: 1.0,
    },
    instantiate: (id, params) =>
      new StaticImageNode({
        id,
        url: String(params.imageUrl),
        fit: params.fitMode as 'contain',
        opacity: params.opacity as number,
      }),
  },
  testVisual: {
    params: {
      shape: 'crystal',
      reactive: true,
      scale: 1.0,
    },
    instantiate: (id) => new TestVisualNode(id),
  },
}

describe('Preset WebGL Pipeline Smoke Tests (High-Fidelity Verification)', () => {
  test.each(LAYER_NODE_TYPES)(
    'dynamic registry gate: layer node type "%s" must have fixture, deserialize cleanly, and execute render pass',
    (nodeType) => {
      const fixture = NODE_FIXTURE_REGISTRY[nodeType]
      expect(
        fixture,
        `FAIL CLOSED: New node type "${nodeType}" is registered in LAYER_NODE_TYPES but missing from NODE_FIXTURE_REGISTRY! ` +
          `Future agents MUST add a preset fixture and verify its render pass in src/engine/presets/preset-render-smoke.test.ts.`
      ).toBeDefined()

      // 1. Build and deserialize a preset containing this node
      const rawPreset = {
        schemaVersion: 2,
        metadata: {
          name: `Smoke Preset for ${nodeType}`,
          version: 1,
          created: new Date().toISOString(),
        },
        settings: {
          targetFps: 60,
          resolutionScale: 1.0,
          audioBands: {
            bass: [20, 250],
            mid: [250, 4000],
            treble: [4000, 20000],
          },
        },
        root: {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          params: {
            inputBlendMode: 'normal',
            outputBlendMode: 'normal',
          },
          children: [
            {
              id: `test-node-${nodeType}`,
              type: nodeType,
              label: `Smoke ${nodeType}`,
              params: fixture.params,
            },
          ],
        },
      }

      const result = deserializePreset(rawPreset)
      expect(result.success, `Failed to deserialize preset for node type "${nodeType}": ${result.errors.join(', ')}`).toBe(true)
      expect(result.nodes.some((n) => n.type === nodeType)).toBe(true)

      // 2. Wire and execute the engine node
      const renderer = createMockRenderer()
      const node = fixture.instantiate(`smoke-${nodeType}`, fixture.params)

      if (node.init) {
        node.init(renderer)
      }
      if (node.resize) {
        node.resize(1920, 1080, 1.0)
      }

      const ctx = createDefaultFrameContext()
      ctx.$WIDTH = 1920
      ctx.$HEIGHT = 1080
      ctx.$ASPECT = 1920 / 1080
      ctx.$TIME = 2.0
      ctx.$BEAT = 1.0

      node.update(ctx)

      // 3. For visual nodes, verify render execution
      if (nodeType !== 'frameBuffer') {
        expect(renderer.render, `Node type "${nodeType}" update() did not call renderer.render()!`).toHaveBeenCalled()
      }
    }
  )

  it('guarantees that all built-in Duperscope templates produce visible geometry with zero errors', () => {
    const renderer = createMockRenderer()
    const ctx = createDefaultFrameContext()
    ctx.$WIDTH = 1280
    ctx.$HEIGHT = 720
    ctx.$ASPECT = 1280 / 720
    ctx.$BEAT = 1.0

    for (const template of DUPERSCOPE_TEMPLATES) {
      const node = new DuperscopeNode({
        id: `scope-${template.id}`,
        name: template.name,
        drawMode: template.drawMode,
        audioMode: template.audioMode,
        channel: template.channel,
        opacity: template.opacity,
        initCode: template.initCode,
        beatCode: template.beatCode,
        frameCode: template.frameCode,
        pointCode: template.pointCode,
      })

      node.init(renderer)
      node.resize(1280, 720, 1.0)
      node.update(ctx)

      // Verification gate: No syntax/runtime error
      expect(node.hasErrors, `Template "${template.name}" has compilation errors: ${node.errorMessage}`).toBe(false)

      // Verification gate: Geometry buffer populated
      if (template.drawMode === 'points') {
        expect(node.getActivePointCount(), `Template "${template.name}" has 0 points`).toBeGreaterThan(0)
      } else {
        expect(node.getActiveSegmentCount(), `Template "${template.name}" has 0 segments`).toBeGreaterThan(0)
      }

      // Verification gate: Frustum culling is disabled on screen-space ribbon & point scene meshes
      expect(node.scene.children.length).toBeGreaterThan(0)
      for (const obj of node.scene.children) {
        expect(obj.frustumCulled).toBe(false)
      }
    }
  })
})
