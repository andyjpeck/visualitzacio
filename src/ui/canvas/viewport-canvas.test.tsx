import fs from 'node:fs'
import path from 'node:path'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ViewportCanvas } from './viewport-canvas'
import { useAppStore } from '../store/app-store'
import { TestVisualNode } from '../../engine/visual-node'
import { FrameBufferNode } from '../../engine/frame-buffer/frame-buffer-node'
import { DuperscopeNode } from '../../engine/nodes/duperscope-node'
import type { RenderEngine } from '../../engine/render-engine'

// Mock Three.js WebGLRenderer for jsdom
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    })),
  }
})

describe('ViewportCanvas', () => {
  it('mounts canvas container into DOM and initializes RenderEngine', () => {
    const onEngineReady = vi.fn()
    const { unmount } = render(<ViewportCanvas onEngineReady={onEngineReady} />)

    const container = screen.getByTestId('viewport-canvas-container')
    expect(container).toBeInTheDocument()
    expect(onEngineReady).toHaveBeenCalledTimes(1)

    // Unmount cleans up engine
    unmount()
    expect(container.children.length).toBe(0)
  })

  it('synchronizes graphNodes parameter changes to engine nodes in real time', () => {
    let capturedEngine: RenderEngine | null = null
    const { unmount } = render(
      <ViewportCanvas
        onEngineReady={(engine) => {
          capturedEngine = engine
        }}
      />,
    )

    expect(capturedEngine).not.toBeNull()
    const allNodes = capturedEngine!.getAllNodes()
    const testVisual = allNodes.find((n) => n instanceof TestVisualNode) as TestVisualNode
    expect(testVisual).toBeDefined()
    expect(testVisual.getShape()).toBe('Crystal')

    // Change shape to 'Cube' in graphNodes store
    act(() => {
      useAppStore.getState().updateGraphNodeData('test-visual-1', {
        shape: 'Cube',
        scale: 2.5,
      })
    })

    expect(testVisual.getShape()).toBe('Cube')

    unmount()
  })

  it('synchronizes hierarchical parentId to nest visual nodes inside child frame buffers', () => {
    let capturedEngine: RenderEngine | null = null
    const { unmount } = render(
      <ViewportCanvas
        onEngineReady={(engine) => {
          capturedEngine = engine
        }}
      />,
    )

    expect(capturedEngine).not.toBeNull()

    // Add nested frame buffer and a child visual synth inside it
    act(() => {
      useAppStore.setState({
        graphNodes: [
          {
            id: 'master-frame-buffer',
            type: 'masterFrameBuffer',
            position: { x: 0, y: 0 },
            data: { label: 'Master Output' },
          },
          {
            id: 'child-buffer',
            type: 'frameBuffer',
            parentId: 'master-frame-buffer',
            position: { x: 20, y: 65 },
            data: { label: 'Child Buffer', scale: 1.5, rotation: 10 },
          },
          {
            id: 'nested-synth',
            type: 'testVisual',
            parentId: 'child-buffer',
            position: { x: 20, y: 65 },
            data: { label: 'Nested Synth', shape: 'Torus' },
          },
        ],
      })
    })

    const allNodes = capturedEngine!.getAllNodes()
    const masterNode = allNodes.find(
      (n) => n instanceof FrameBufferNode && (n as FrameBufferNode).id === 'master-frame-buffer',
    ) as FrameBufferNode
    const childBufferNode = allNodes.find(
      (n) => n instanceof FrameBufferNode && (n as FrameBufferNode).id === 'child-buffer',
    ) as FrameBufferNode
    const nestedSynth = allNodes.find(
      (n) => n instanceof TestVisualNode && (n as TestVisualNode).id === 'nested-synth',
    ) as TestVisualNode

    expect(childBufferNode).toBeDefined()
    expect(nestedSynth).toBeDefined()
    expect(nestedSynth.getShape()).toBe('Torus')

    // Verify hierarchy: master contains childBuffer, childBuffer contains nestedSynth
    expect(masterNode.getChildren()).toContain(childBufferNode)
    expect(masterNode.getChildren()).not.toContain(nestedSynth)
    expect(childBufferNode.getChildren()).toContain(nestedSynth)

    // Reparent nestedSynth to master-frame-buffer
    act(() => {
      useAppStore.getState().setNodeParent('nested-synth', 'master-frame-buffer')
    })

    expect(childBufferNode.getChildren()).not.toContain(nestedSynth)
    expect(masterNode.getChildren()).toContain(nestedSynth)

    unmount()
  })

  it('instantiates and synchronizes DuperscopeNode in the engine when duperscopeNode exists in graphNodes', () => {
    let capturedEngine: RenderEngine | null = null
    const { unmount } = render(
      <ViewportCanvas
        onEngineReady={(engine) => {
          capturedEngine = engine
        }}
      />,
    )

    expect(capturedEngine).not.toBeNull()

    // Add duperscopeNode
    let scopeId = ''
    act(() => {
      scopeId = useAppStore.getState().addLayerNode('duperscopeNode')
    })

    const allNodes = capturedEngine!.getAllNodes()
    const scopeNode = allNodes.find((n) => n instanceof DuperscopeNode) as DuperscopeNode
    expect(scopeNode).toBeDefined()
    expect(scopeNode.drawMode).toBe('lines')
    expect(scopeNode.audioMode).toBe('waveform')

    // Update draw mode and script
    act(() => {
      useAppStore.getState().updateGraphNodeData(scopeId, {
        drawMode: 'lineLoop',
        initCode: 'n = 360;',
      })
    })

    expect(scopeNode.drawMode).toBe('lineLoop')
    expect(scopeNode.getScripts().init).toBe('n = 360;')

    unmount()
  })

  it('does not leak rotation twist or parameter expressions when loading sunset preset after mirrored spectrum', () => {
    const mirroredPath = path.resolve(__dirname, '../../../presets/quadrant-mirrored-spectrum.json')
    const sunsetPath = path.resolve(__dirname, '../../../presets/rainy-ocean-sunset.json')
    const mirroredPreset = JSON.parse(fs.readFileSync(mirroredPath, 'utf-8'))
    const sunsetPreset = JSON.parse(fs.readFileSync(sunsetPath, 'utf-8'))

    let capturedEngine: RenderEngine | null = null
    const { unmount } = render(
      <ViewportCanvas
        onEngineReady={(engine) => {
          capturedEngine = engine
        }}
      />,
    )

    expect(capturedEngine).not.toBeNull()
    const engine = capturedEngine!
    const masterNode = engine.getAllNodes().find(
      (n) => n instanceof FrameBufferNode && (n as FrameBufferNode).id === 'master-frame-buffer',
    ) as FrameBufferNode
    expect(masterNode).toBeDefined()

    // 1. Load Mirrored Spectrum Preset (which specifies beat-reactive angular twist on rotation)
    act(() => {
      const res = useAppStore.getState().loadPreset(mirroredPreset)
      expect(res.success).toBe(true)
    })

    // Trigger update with audio energies and elapsed beat decay
    const ctx = engine.getFrameContext()
    ctx.$BASS = 0.9
    ctx.$RMS = 0.8
    ctx.$TIME = 2.0
    ctx.secondsSinceLastBeat = 0.1
    masterNode.update(ctx)

    // Master should have non-zero rotation angle reacting to beat
    expect(Math.abs(masterNode.rotation)).toBeGreaterThan(0)

    // 2. Load Rainy Ocean Sunset Preset (which has no rotation expression in root params)
    act(() => {
      const res = useAppStore.getState().loadPreset(sunsetPreset)
      expect(res.success).toBe(true)
    })

    // Update again with heavy bass and elapsed beat decay
    ctx.$BASS = 1.0
    ctx.$RMS = 1.0
    ctx.$TIME = 3.0
    ctx.secondsSinceLastBeat = 0.1
    masterNode.update(ctx)

    // Sunset preset MUST NOT twist to the beat or leak rotation from previous preset!
    expect(masterNode.rotation).toBe(0.0)

    unmount()
  })
})