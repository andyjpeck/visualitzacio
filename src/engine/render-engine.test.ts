import { describe, expect, it, vi } from 'vitest'
import { createMockRenderer } from '../test/fixtures/renderer-mock'
import { createMockScheduler } from '../test/fixtures/scheduler-mock'
import type { VisualNode } from '../contracts/renderer-like'
import { RenderEngine } from './render-engine'

describe('RenderEngine (TDD)', () => {
  it('initializes with default FrameContext and preset settings', () => {
    const mockRenderer = createMockRenderer()
    const mockScheduler = createMockScheduler(1000)

    const engine = new RenderEngine({
      renderer: mockRenderer,
      scheduler: mockScheduler,
    })

    expect(engine.isRunning()).toBe(false)
    const ctx = engine.getFrameContext()
    expect(ctx.$FRAME).toBe(0)
    expect(ctx.$TIME).toBe(0.0)
    expect(ctx.$FPS).toBe(60.0)
  })

  it('mutates FrameContext in-place on each animation frame and advances time', () => {
    const mockRenderer = createMockRenderer()
    const mockScheduler = createMockScheduler(1000)

    const engine = new RenderEngine({
      renderer: mockRenderer,
      scheduler: mockScheduler,
      presetSettings: { target_fps: 60, resolution_scale: 1.0 },
    })

    engine.start()
    expect(engine.isRunning()).toBe(true)
    expect(mockScheduler.pendingFramesCount()).toBe(1)

    // Trigger frame 1: at 1016.6ms (~16.6ms later)
    mockScheduler.triggerFrame(1016.6)
    const ctx1 = engine.getFrameContext()
    expect(ctx1.$FRAME).toBe(1)
    expect(ctx1.$DT).toBeCloseTo(0.0166, 3)
    expect(ctx1.$TIME).toBeCloseTo(0.0166, 3)

    // Trigger frame 2: at 1033.3ms
    mockScheduler.triggerFrame(1033.3)
    expect(ctx1.$FRAME).toBe(2)
    expect(ctx1.$TIME).toBeCloseTo(0.0333, 3)

    engine.stop()
    expect(engine.isRunning()).toBe(false)
  })

  it('clamps $DT to 0.1s on large frame spikes or tab pauses', () => {
    const mockRenderer = createMockRenderer()
    const mockScheduler = createMockScheduler(1000)

    const engine = new RenderEngine({
      renderer: mockRenderer,
      scheduler: mockScheduler,
    })

    engine.start()
    mockScheduler.triggerFrame(1016)

    // Simulate 2-second background tab stall
    mockScheduler.triggerFrame(3016)
    const ctx = engine.getFrameContext()
    expect(ctx.$DT).toBe(0.1) // Clamped to 0.1 max per spec
  })

  it('throttles FPS callback notifications to ~250ms intervals', () => {
    const mockRenderer = createMockRenderer()
    const mockScheduler = createMockScheduler(1000)
    const onFpsUpdate = vi.fn()

    const engine = new RenderEngine({
      renderer: mockRenderer,
      scheduler: mockScheduler,
      onFpsUpdate,
    })

    engine.start()

    // 14 frames at 16.6ms intervals (total ~232ms -> less than 250ms throttle)
    for (let i = 1; i <= 14; i++) {
      mockScheduler.triggerFrame(1000 + i * 16.66)
    }
    expect(onFpsUpdate).not.toHaveBeenCalled()

    // Cross the 250ms threshold at frame 16 (~266ms)
    mockScheduler.triggerFrame(1000 + 15 * 16.66)
    mockScheduler.triggerFrame(1000 + 16 * 16.66)
    expect(onFpsUpdate).toHaveBeenCalledTimes(1)
    expect(onFpsUpdate.mock.calls[0][0]).toBeGreaterThan(50)
  })

  it('dispatches FrameContext to registered VisualNode passes', () => {
    const mockRenderer = createMockRenderer()
    const mockScheduler = createMockScheduler(1000)

    const mockNode: VisualNode = {
      init: vi.fn(),
      resize: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    }

    const engine = new RenderEngine({
      renderer: mockRenderer,
      scheduler: mockScheduler,
    })

    engine.addNode(mockNode)
    expect(mockNode.init).toHaveBeenCalledWith(mockRenderer)

    engine.start()
    mockScheduler.triggerFrame(1016)
    expect(mockNode.update).toHaveBeenCalledTimes(1)
    expect(mockNode.update).toHaveBeenCalledWith(engine.getFrameContext())

    engine.dispose()
    expect(mockNode.dispose).toHaveBeenCalledTimes(1)
    expect(mockRenderer.dispose).toHaveBeenCalledTimes(1)
  })

  it('applies resolution_scale and clamps DPR <= 2 on resize', () => {
    const mockRenderer = createMockRenderer()
    const mockScheduler = createMockScheduler(1000)

    const engine = new RenderEngine({
      renderer: mockRenderer,
      scheduler: mockScheduler,
      presetSettings: { target_fps: 60, resolution_scale: 0.5 },
    })

    // Resize to 1920x1080 with high DPR 3 (clamped to 2, scaled by 0.5 -> 0.5 * 2 = 1.0)
    engine.resize(1920, 1080, 3.0)

    const ctx = engine.getFrameContext()
    expect(ctx.$WIDTH).toBe(1920)
    expect(ctx.$HEIGHT).toBe(1080)
    expect(ctx.$PIXEL_RATIO).toBe(2.0) // clamped to 2

    // Renderer receives dimensions scaled by resolution_scale (0.5 * 1920 = 960, 0.5 * 1080 = 540)
    expect(mockRenderer.setSize).toHaveBeenCalledWith(960, 540, false)
  })

  it('invokes onBeforeUpdate callback before node updates', () => {
    const mockRenderer = createMockRenderer()
    const mockScheduler = createMockScheduler(1000)
    const onBeforeUpdate = vi.fn((ctx) => {
      ctx.$BASS = 0.88
    })

    const nodeUpdate = vi.fn()
    const mockNode: VisualNode = { update: nodeUpdate }

    const engine = new RenderEngine({
      renderer: mockRenderer,
      scheduler: mockScheduler,
      onBeforeUpdate,
    })
    engine.addNode(mockNode)

    engine.start()
    mockScheduler.triggerFrame(1016)

    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(nodeUpdate).toHaveBeenCalledTimes(1)
    expect(engine.getFrameContext().$BASS).toBe(0.88)
  })
})
