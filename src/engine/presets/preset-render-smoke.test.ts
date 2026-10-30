import { describe, expect, it } from 'vitest'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import { createMockRenderer } from '../../test/fixtures/renderer-mock'
import { deserializePreset } from './preset-deserializer'
import { FrameBufferNode } from '../frame-buffer/frame-buffer-node'
import { DuperscopeNode } from '../nodes/duperscope-node'
import { DUPERSCOPE_TEMPLATES } from '../nodes/duperscope-templates'

describe('Preset WebGL Pipeline Smoke Tests (High-Fidelity Verification)', () => {
  it('deserializes and renders a full multi-node hierarchy without pipeline disconnection', () => {
    const rawPreset = {
      schemaVersion: 2,
      metadata: {
        name: 'Full Pipeline Integration Smoke',
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
            id: 'scope-layer-1',
            type: 'duperscopeNode',
            label: 'Oscilloscope Tunnel',
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
          },
          {
            id: 'crystal-layer-1',
            type: 'testVisual',
            label: 'Crystal Synth',
            params: {
              shape: 'crystal',
              reactive: true,
              scale: '1.0 + $BASS * 0.5',
            },
          },
        ],
      },
    }

    // 1. Verify deserialization success
    const result = deserializePreset(rawPreset)
    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.nodes.length).toBe(3)

    const masterNodeData = result.nodes.find((n) => n.id === 'master-frame-buffer')
    const scopeNodeData = result.nodes.find((n) => n.id === 'scope-layer-1')
    expect(masterNodeData).toBeDefined()
    expect(scopeNodeData).toBeDefined()
    expect(scopeNodeData?.type).toBe('duperscopeNode')

    // 2. Wire up the actual WebGL engine nodes
    const renderer = createMockRenderer()
    const masterBuffer = new FrameBufferNode({ id: 'master-frame-buffer', name: 'Master' })
    masterBuffer.init(renderer)
    masterBuffer.resize(1920, 1080, 1.0)

    const scopeNode = new DuperscopeNode({
      id: 'scope-layer-1',
      name: 'Oscilloscope Tunnel',
      drawMode: scopeNodeData?.data.drawMode as 'lines',
      audioMode: scopeNodeData?.data.audioMode as 'waveform',
      channel: scopeNodeData?.data.channel as 'center',
      opacity: scopeNodeData?.data.opacity as number,
      initCode: String(scopeNodeData?.data.initCode),
      beatCode: String(scopeNodeData?.data.beatCode),
      frameCode: String(scopeNodeData?.data.frameCode),
      pointCode: String(scopeNodeData?.data.pointCode),
    })

    scopeNode.init(renderer)
    scopeNode.resize(1920, 1080, 1.0)
    masterBuffer.addChild(scopeNode)

    // 3. Execute frame lifecycle
    const ctx = createDefaultFrameContext()
    ctx.$WIDTH = 1920
    ctx.$HEIGHT = 1080
    ctx.$ASPECT = 1920 / 1080
    ctx.$TIME = 1.5
    ctx.$BASS = 0.8
    ctx.$BEAT = 1.0

    masterBuffer.update(ctx)

    // 4. Assert non-empty geometry & active render pass
    expect(scopeNode.hasErrors).toBe(false)
    expect(scopeNode.getActiveSegmentCount()).toBeGreaterThan(0)
    expect(scopeNode.getActivePointCount()).toBeGreaterThan(0)
    expect(renderer.render).toHaveBeenCalledWith(scopeNode.scene, scopeNode.camera)
  })

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
