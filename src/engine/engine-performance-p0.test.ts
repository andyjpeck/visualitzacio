import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createDefaultFrameContext } from '../contracts/frame-context'
import type { VisualNode } from '../contracts/renderer-like'
import { createMockRenderer } from '../test/fixtures/renderer-mock'
import { createMockScheduler } from '../test/fixtures/scheduler-mock'
import { BufferPool } from './frame-buffer/buffer-pool'
import { FrameBufferNode } from './frame-buffer/frame-buffer-node'
import { DuperscopeCompiler } from './nodes/duperscope-compiler'
import { DuperscopeNode } from './nodes/duperscope-node'
import { DuperscopeRunner } from './nodes/duperscope-runner'
import { RenderEngine } from './render-engine'

describe('Track 14 — Engine Performance: Render Pass, VRAM & Bandwidth Optimizations (#14)', () => {
  describe('Phase 1: Main Canvas WebGLRenderer Initialization', () => {
    it('initializes WebGLRenderer with antialias: false, depth: false, and stencil: false', () => {
      const mockRenderer = createMockRenderer()
      const factorySpy = vi.fn().mockReturnValue(mockRenderer)
      const canvas = document.createElement('canvas')

      const engine = new RenderEngine({
        canvas,
        rendererFactory: factorySpy,
      })

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

  describe('Phase 1: High-Refresh Display Accumulator Frame Pacing', () => {
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

  describe('Phase 1: FrameBufferNode Depth Stripping & Pass-Through FBO Elimination', () => {
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
      })

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

  describe('Phase 2: Duperscope DynamicDrawUsage, Partial Upload Ranges & Dormant Loop Bypass', () => {
    it('configures all dynamic ribbon and point attributes with THREE.DynamicDrawUsage and sets exact updateRanges', () => {
      const mockRenderer = createMockRenderer()
      const node = new DuperscopeNode({
        id: 'duperscope-ranges',
        drawMode: 'lines',
        initCode: 'n = 160;',
        frameCode: 'linesize = 2.0;',
        pointCode: 'x = i * 2.0 - 1.0; y = 0.0;',
      })

      node.init(mockRenderer)
      node.update(createDefaultFrameContext())

      expect(node.getActivePointCount()).toBe(160)
      expect(node.getActiveSegmentCount()).toBe(159)

      const ribbonMesh = node.scene.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh
      const ribbonGeom = ribbonMesh.geometry as THREE.InstancedBufferGeometry

      const startAttr = ribbonGeom.attributes.instanceStart as THREE.InstancedBufferAttribute
      const endAttr = ribbonGeom.attributes.instanceEnd as THREE.InstancedBufferAttribute
      const startColAttr = ribbonGeom.attributes.instanceStartColor as THREE.InstancedBufferAttribute
      const endColAttr = ribbonGeom.attributes.instanceEndColor as THREE.InstancedBufferAttribute
      const startSizeAttr = ribbonGeom.attributes.instanceStartSize as THREE.InstancedBufferAttribute
      const endSizeAttr = ribbonGeom.attributes.instanceEndSize as THREE.InstancedBufferAttribute

      for (const attr of [startAttr, endAttr, startColAttr, endColAttr, startSizeAttr, endSizeAttr]) {
        expect(attr.usage).toBe(THREE.DynamicDrawUsage)
      }

      // Only the 159 active segments should be queued in updateRanges, not all 4096
      expect(startAttr.updateRanges).toEqual([{ start: 0, count: 159 * 3 }])
      expect(endAttr.updateRanges).toEqual([{ start: 0, count: 159 * 3 }])
      expect(startColAttr.updateRanges).toEqual([{ start: 0, count: 159 * 4 }])
      expect(endColAttr.updateRanges).toEqual([{ start: 0, count: 159 * 4 }])
      expect(startSizeAttr.updateRanges).toEqual([{ start: 0, count: 159 * 1 }])
      expect(endSizeAttr.updateRanges).toEqual([{ start: 0, count: 159 * 1 }])

      // Switch to points mode and verify point attribute updateRanges
      node.setDrawMode('points')
      node.setScripts({ init: 'n = 80;' })
      node.update(createDefaultFrameContext())

      const pointsMesh = node.scene.children.find((c) => c instanceof THREE.Points) as THREE.Points
      const pointsGeom = pointsMesh.geometry as THREE.BufferGeometry
      const posAttr = pointsGeom.attributes.position as THREE.BufferAttribute
      const colAttr = pointsGeom.attributes.color as THREE.BufferAttribute
      const sizeAttr = pointsGeom.attributes.aSize as THREE.BufferAttribute

      for (const attr of [posAttr, colAttr, sizeAttr]) {
        expect(attr.usage).toBe(THREE.DynamicDrawUsage)
      }
      expect(posAttr.updateRanges).toEqual([{ start: 0, count: 80 * 3 }])
      expect(colAttr.updateRanges).toEqual([{ start: 0, count: 80 * 4 }])
      expect(sizeAttr.updateRanges).toEqual([{ start: 0, count: 80 * 1 }])

      node.dispose()
    })

    it('bypasses point loop and skips renderer.render() when n = 0 or node opacity <= 0 while preserving frame state', () => {
      const mockRenderer = createMockRenderer()
      const node = new DuperscopeNode({
        id: 'duperscope-dormant-n0',
        drawMode: 'lines',
        initCode: 'n = 200; counter = 0;',
        frameCode: 'counter = counter + 1; n = 0;',
        pointCode: 'x = i;',
      })

      node.init(mockRenderer)
      node.update(createDefaultFrameContext())

      expect(node.getScope().counter).toBe(1)
      expect(node.getActivePointCount()).toBe(0)
      expect(node.getActiveSegmentCount()).toBe(0)
      expect(mockRenderer.render).not.toHaveBeenCalled()

      // When n > 0 but node opacity is 0, frame state still advances while point loop & render are skipped
      node.setScripts({ frameCode: 'counter = counter + 1; n = 100;' })
      node.setOpacity(0)
      node.update(createDefaultFrameContext())

      expect(node.getScope().counter).toBe(2)
      expect(node.getActivePointCount()).toBe(0)
      expect(node.getActiveSegmentCount()).toBe(0)
      expect(mockRenderer.render).not.toHaveBeenCalled()

      node.dispose()
    })

    it('automatically bypasses the point loop and draw call for dormant lightning nodes (linesize = 0 in frameCode) until a strike occurs', () => {
      const mockRenderer = createMockRenderer()
      const lightningNode = new DuperscopeNode({
        id: 'myline-lightning',
        drawMode: 'lines',
        audioMode: 'waveform',
        channel: 'center',
        opacity: 1,
        initCode:
          'n = 160; avgRms = 0.3; prevSurge = 0.0; surgeThreshold = 0.10; minRms = 0.12; strike = 0.0; seed = 1.0; decay = 0.965; edgeA = 0; edgeB = 2; uA = 0.0; uB = 0.0; x0 = 0.0; y0 = 1.0; x1 = 0.0; y1 = -1.0; dx = 0.0; dy = -2.0; len = 2.0; nx = 1.0; ny = 0.0;',
        beatCode: '',
        frameCode:
          'avgRms = avgRms * 0.992 + $RMS * 0.008; surge = $RMS - avgRms; isStrike = (surge >= surgeThreshold) and (prevSurge < surgeThreshold) and ($RMS > minRms) ? 1.0 : 0.0; prevSurge = surge; strike = isStrike ? 1.0 : (strike * decay); linesize = strike > 0.001 ? (1.5 + strike * 5.0) : 0.0; r = 0.8 + strike * 0.2; g = 0.9 + strike * 0.1; b = 1.0; a = strike;',
        pointCode:
          'envelope = sin(i * PI); h1 = sin(i * 37.0 + seed); x = x0 + dx * i + nx * h1 * envelope; y = y0 + dy * i + ny * h1 * envelope; r = strike; g = strike; b = strike; a = strike;',
      })

      lightningNode.init(mockRenderer)

      // Frame 1: Low RMS (no strike -> strike = 0, linesize = 0)
      const quietCtx = createDefaultFrameContext()
      quietCtx.$RMS = 0.1
      lightningNode.update(quietCtx)

      // Frame state (avgRms) updated, but point loop & GPU render bypassed!
      expect(lightningNode.getScope().avgRms).toBeLessThan(0.3)
      expect(lightningNode.getActivePointCount()).toBe(0)
      expect(lightningNode.getActiveSegmentCount()).toBe(0)
      expect(mockRenderer.render).not.toHaveBeenCalled()

      // Frame 2: High RMS surge (strike triggered -> strike = 1.0, linesize = 6.5)
      const surgeCtx = createDefaultFrameContext()
      surgeCtx.$RMS = 0.85
      lightningNode.update(surgeCtx)

      expect(lightningNode.getScope().strike).toBe(1.0)
      expect(lightningNode.getActivePointCount()).toBe(160)
      expect(lightningNode.getActiveSegmentCount()).toBe(159)
      expect(mockRenderer.render).toHaveBeenCalledTimes(1)

      lightningNode.dispose()
    })

    it('still executes point loop when frameCode sets a = 0 or linesize = 0 if pointCode explicitly reassigns them', () => {
      const compiler = new DuperscopeCompiler()
      const runner = new DuperscopeRunner()

      const compiledInit = compiler.compilePhase('n = 10;', 'init')
      const compiledBeat = compiler.compilePhase('', 'beat')
      const compiledFrame = compiler.compilePhase('a = 0.0; linesize = 0.0;', 'frame')
      const compiledPoint = compiler.compilePhase('a = i; linesize = 2.0;', 'point')

      runner.runInit(compiledInit)

      const { pointCount } = runner.runFrame(
        compiledBeat,
        compiledFrame,
        compiledPoint,
        createDefaultFrameContext(),
        {
          audioMode: 'waveform',
          channel: 'center',
          positions: new Float32Array(4096 * 3),
          colors: new Float32Array(4096 * 4),
          sizes: new Float32Array(4096),
        },
      )

      expect(pointCount).toBe(10)
    })
  })
})
