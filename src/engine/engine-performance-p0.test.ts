import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createDefaultFrameContext } from '../contracts/frame-context'
import type { VisualNode } from '../contracts/renderer-like'
import { createMockRenderer } from '../test/fixtures/renderer-mock'
import { createMockScheduler } from '../test/fixtures/scheduler-mock'
import { BufferPool } from './frame-buffer/buffer-pool'
import { FrameBufferNode } from './frame-buffer/frame-buffer-node'
import { RenderEngine } from './render-engine'

describe('Track 14 — Phase 1: Core Engine, FrameBuffer & Pacing Optimizations (#14)', () => {
  describe('Main Canvas WebGLRenderer Initialization', () => {
    it('initializes WebGLRenderer with antialias: false, depth: false, and stencil: false', () => {
      const mockRenderer = createMockRenderer()
      const factorySpy = vi.fn().mockReturnValue(mockRenderer)
      const canvas = document.createElement('canvas')

      const engine = new RenderEngine({
        canvas,
        rendererFactory: factorySpy,
      } as ConstructorParameters<typeof RenderEngine>[0])

      expect(factorySpy).toHaveBeenCalledTimes(1)
      expect(factorySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          canvas,
          antialias: false,
          depth: false,
          stencil: false,
          alpha: false,
          powerPreference: 'high-performance',
        }),
      )

      engine.dispose()
    })
  })

  describe('High-Refresh Display Accumulator Frame Pacing', () => {
    it('paces 60 FPS smoothly on a 144Hz display without stalling at frame 1', () => {
      const mockRenderer = createMockRenderer()
      const mockScheduler = createMockScheduler(1000)

      const engine = new RenderEngine({
        renderer: mockRenderer,
        scheduler: mockScheduler,
        presetSettings: { target_fps: 60, resolution_scale: 1.0 },
      })

      engine.start()

      // Simulate 144 ticks over 1000ms (~6.944ms per tick)
      for (let tick = 1; tick <= 144; tick++) {
        mockScheduler.triggerFrame(1000 + tick * (1000 / 144))
      }

      const renderedFrames = engine.getFrameContext().$FRAME
      expect(renderedFrames).toBeGreaterThanOrEqual(58)
      expect(renderedFrames).toBeLessThanOrEqual(62)

      engine.dispose()
    })

    it('paces 60 FPS smoothly on a 120Hz display', () => {
      const mockRenderer = createMockRenderer()
      const mockScheduler = createMockScheduler(1000)

      const engine = new RenderEngine({
        renderer: mockRenderer,
        scheduler: mockScheduler,
        presetSettings: { target_fps: 60, resolution_scale: 1.0 },
      })

      engine.start()

      // Simulate 120 ticks over 1000ms (8.333ms per tick)
      for (let tick = 1; tick <= 120; tick++) {
        mockScheduler.triggerFrame(1000 + tick * (1000 / 120))
      }

      const renderedFrames = engine.getFrameContext().$FRAME
      expect(renderedFrames).toBeGreaterThanOrEqual(59)
      expect(renderedFrames).toBeLessThanOrEqual(61)

      engine.dispose()
    })

    it('does not drop frames on a 60Hz display with minor VSync jitter (+/- 0.4ms)', () => {
      const mockRenderer = createMockRenderer()
      const mockScheduler = createMockScheduler(1000)

      const engine = new RenderEngine({
        renderer: mockRenderer,
        scheduler: mockScheduler,
        presetSettings: { target_fps: 60, resolution_scale: 1.0 },
      })

      engine.start()

      for (let tick = 1; tick <= 60; tick++) {
        const jitter = tick % 2 === 0 ? -0.4 : 0.4
        mockScheduler.triggerFrame(1000 + tick * (1000 / 60) + jitter)
      }

      const renderedFrames = engine.getFrameContext().$FRAME
      expect(renderedFrames).toBe(60)

      engine.dispose()
    })

    it('clamps $DT to 0.1s and prevents burst catch-up after a long background tab stall', () => {
      const mockRenderer = createMockRenderer()
      const mockScheduler = createMockScheduler(1000)

      const engine = new RenderEngine({
        renderer: mockRenderer,
        scheduler: mockScheduler,
        presetSettings: { target_fps: 60, resolution_scale: 1.0 },
      })

      engine.start()
      mockScheduler.triggerFrame(1016.67) // Frame 1
      expect(engine.getFrameContext().$FRAME).toBe(1)

      // 3-second stall (e.g., backgrounded tab)
      mockScheduler.triggerFrame(4016.67) // Frame 2
      expect(engine.getFrameContext().$FRAME).toBe(2)
      expect(engine.getFrameContext().$DT).toBeCloseTo(0.1, 4)

      // Next 144Hz tick 6.94ms later should be skipped (no burst catch-up)
      mockScheduler.triggerFrame(4016.67 + 6.94)
      expect(engine.getFrameContext().$FRAME).toBe(2)

      engine.dispose()
    })
  })

  describe('FrameBufferNode Depth Stripping & Pass-Through FBO Elimination', () => {
    it('defaults depthBuffer to false on FBO allocations and skips clearDepth() between 2D sibling children', () => {
      const mockRenderer = createMockRenderer()
      const node = new FrameBufferNode({
        id: 'fb-no-depth',
        feedback: true,
      })

      node.init(mockRenderer)
      node.resize(1920, 1080, 1.0, 1.0)

      expect(node.getWriteTarget()?.depthBuffer).toBe(false)
      expect(node.getReadTarget()?.depthBuffer).toBe(false)

      const child1: VisualNode = { update: vi.fn() }
      const child2: VisualNode = { update: vi.fn() }
      node.addChild(child1)
      node.addChild(child2)

      node.update(createDefaultFrameContext())

      expect(child1.update).toHaveBeenCalledTimes(1)
      expect(child2.update).toHaveBeenCalledTimes(1)
      expect(mockRenderer.clearDepth).not.toHaveBeenCalled()

      node.dispose()
    })

    it('allocates depthBuffer and calls clearDepth() between siblings when depthBuffer: true is explicitly requested', () => {
      const mockRenderer = createMockRenderer()
      const node = new FrameBufferNode({
        id: 'fb-with-depth',
        depthBuffer: true,
      } as ConstructorParameters<typeof FrameBufferNode>[0])

      node.init(mockRenderer)
      node.resize(1280, 720, 1.0, 1.0)

      expect(node.getWriteTarget()?.depthBuffer).toBe(true)

      const child1: VisualNode = { update: vi.fn() }
      const child2: VisualNode = { update: vi.fn() }
      node.addChild(child1)
      node.addChild(child2)

      node.update(createDefaultFrameContext())

      expect(mockRenderer.clearDepth).toHaveBeenCalledTimes(1)

      node.dispose()
    })

    it('skips allocating FBO render targets for direct pass-through replicator nodes and allocates on-demand if mutated', () => {
      const mockRenderer = createMockRenderer()
      const pool = new BufferPool()
      const sourceTex = new THREE.DataTexture(new Uint8Array(4), 1, 1)
      pool.register('@FRAME', sourceTex)

      // Direct pass-through configuration (like the 4 quadrants in quadrant-mirrored-spectrum)
      const quadrantNode = new FrameBufferNode({
        id: 'quadrant-upper-left',
        loadFrom: '@FRAME',
        outputBlendMode: 'additive',
        scale: 0.5,
        positionX: -0.5,
        positionY: 0.5,
      })

      quadrantNode.init(mockRenderer, pool)
      quadrantNode.resize(1920, 1080, 1.0, 1.0)

      // Must NOT allocate any offscreen FBO in pass-through mode
      expect(quadrantNode.getWriteTarget()).toBeNull()
      expect(quadrantNode.getReadTarget()).toBeNull()

      // Simulate parent FBO active so pass-through composite renders to parent
      const parentTarget = new THREE.WebGLRenderTarget(1920, 1080, { depthBuffer: false })
      mockRenderer.getRenderTarget = vi.fn().mockReturnValue(parentTarget)
      const renderSpy = vi.spyOn(mockRenderer, 'render')

      quadrantNode.update(createDefaultFrameContext())
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Mutating node out of pass-through mode (e.g., adding a child) allocates FBO on-demand
      const child: VisualNode = { update: vi.fn() }
      quadrantNode.addChild(child)

      expect(quadrantNode.getWriteTarget()).not.toBeNull()
      expect(quadrantNode.getWriteTarget()?.width).toBe(1920)
      expect(quadrantNode.getWriteTarget()?.height).toBe(1080)

      parentTarget.dispose()
      quadrantNode.dispose()
    })
  })
})
