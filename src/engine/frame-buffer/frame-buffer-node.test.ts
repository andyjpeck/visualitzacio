import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FrameBufferNode } from './frame-buffer-node'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import type { RendererLike, VisualNode } from '../../contracts/renderer-like'
import { createMockRenderer } from '../../test/fixtures/renderer-mock'

describe('FrameBufferNode', () => {
  let mockRenderer: RendererLike

  beforeEach(() => {
    mockRenderer = createMockRenderer()
  })

  it('initializes with default options and creates WebGL render targets upon resize', () => {
    const node = new FrameBufferNode({
      id: 'fb-test',
      name: 'Test Buffer',
      isMaster: true,
    })

    node.init(mockRenderer)
    expect(node.isMaster).toBe(true)
    expect(node.blendMode).toBe('replace')
    expect(node.opacity).toBe(1.0)

    // Trigger resize: 1920x1080 with pixelRatio = 1.0 and resolutionScale = 1.0
    node.resize(1920, 1080, 1.0, 1.0)

    const writeTarget = node.getWriteTarget()
    expect(writeTarget).toBeDefined()
    expect(writeTarget?.width).toBe(1920)
    expect(writeTarget?.height).toBe(1080)
  })

  it('scales render target dimensions by resolutionScale and clamps by pixelRatio', () => {
    const node = new FrameBufferNode({ id: 'fb-scaled' })
    node.init(mockRenderer)

    // 1000x800 at resolutionScale = 0.5 and pixelRatio = 2.0
    // Internal dimension = floor(1000 * 0.5 * 2.0) = 1000, floor(800 * 0.5 * 2.0) = 800
    node.resize(1000, 800, 2.0, 0.5)

    const writeTarget = node.getWriteTarget()
    expect(writeTarget?.width).toBe(1000)
    expect(writeTarget?.height).toBe(800)
  })

  it('manages dual-FBO ping-pong buffers and alternates read/write targets on frame updates', () => {
    const node = new FrameBufferNode({
      id: 'fb-pingpong',
      isMaster: true,
      feedback: true,
    })
    node.init(mockRenderer)
    node.resize(800, 600, 1.0, 1.0)

    const initialWriteTarget = node.getWriteTarget()
    const initialReadTarget = node.getReadTarget()
    expect(initialWriteTarget).not.toBe(initialReadTarget)

    const ctx = createDefaultFrameContext()
    ctx.$TIME = 0.016
    ctx.$FRAME = 1

    node.update(ctx)

    // After update, read and write buffers should have swapped
    const nextWriteTarget = node.getWriteTarget()
    const nextReadTarget = node.getReadTarget()
    expect(nextWriteTarget).toBe(initialReadTarget)
    expect(nextReadTarget).toBe(initialWriteTarget)
  })

  it('executes child visual nodes into its offscreen render target', () => {
    const node = new FrameBufferNode({ id: 'fb-parent' })
    node.init(mockRenderer)
    node.resize(800, 600, 1.0, 1.0)

    const childMock: VisualNode = {
      init: vi.fn(),
      resize: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    }

    node.addChild(childMock)
    expect(childMock.init).toHaveBeenCalledWith(mockRenderer)
    expect(childMock.resize).toHaveBeenCalledWith(800, 600, 1.0, 1.0)

    const ctx = createDefaultFrameContext()
    node.update(ctx)

    expect(childMock.update).toHaveBeenCalledWith(ctx)
  })

  it('clears depth between multiple sibling children during update pass', () => {
    const node = new FrameBufferNode({ id: 'fb-multi-child' })
    node.init(mockRenderer)
    node.resize(800, 600, 1.0, 1.0)

    const child1: VisualNode = { update: vi.fn() }
    const child2: VisualNode = { update: vi.fn() }
    node.addChild(child1)
    node.addChild(child2)

    const ctx = createDefaultFrameContext()
    node.update(ctx)

    expect(child1.update).toHaveBeenCalledWith(ctx)
    expect(child2.update).toHaveBeenCalledWith(ctx)
    expect(mockRenderer.clearDepth).toHaveBeenCalledTimes(1)
  })

  it('supports removing child nodes and disposing them', () => {
    const node = new FrameBufferNode({ id: 'fb-parent' })
    node.init(mockRenderer)

    const childMock: VisualNode = {
      init: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    }

    node.addChild(childMock)
    expect(node.getChildren()).toContain(childMock)

    node.removeChild(childMock)
    expect(node.getChildren()).not.toContain(childMock)
    expect(childMock.dispose).toHaveBeenCalled()
  })

  it('cleans up and disposes render targets on dispose()', () => {
    const node = new FrameBufferNode({ id: 'fb-dispose', feedback: true })
    node.init(mockRenderer)
    node.resize(800, 600, 1.0, 1.0)

    const fboA = node.getWriteTarget()
    const fboB = node.getReadTarget()
    const disposeSpyA = vi.spyOn(fboA!, 'dispose')
    const disposeSpyB = vi.spyOn(fboB!, 'dispose')

    node.dispose()

    expect(disposeSpyA).toHaveBeenCalled()
    expect(disposeSpyB).toHaveBeenCalled()
    expect(node.getWriteTarget()).toBeNull()
  })

  it('evaluates dynamic expressions and updates feedback shader uniforms', async () => {
    const { ExpressionEngine } = await import('../expressions/expression-engine')
    const engine = new ExpressionEngine()

    const node = new FrameBufferNode({
      id: 'fb-expr',
      feedback: true,
      blendMode: 'additive',
      expressionEngine: engine,
      opacity: '0.8 + $BASS * 0.1',
      scale: '1.0 + $BEAT * 0.2',
      rotation: '$TIME * 0.5',
      positionX: '$MID * 0.1',
      positionY: '$TREBLE * -0.1',
    })

    node.init(mockRenderer)
    node.resize(800, 600, 1.0, 1.0)

    const mat = node.getFeedbackMaterial()
    expect(mat).toBeDefined()

    const ctx = createDefaultFrameContext()
    ctx.$TIME = 2.0
    ctx.$BASS = 0.5
    ctx.$BEAT = 1.0
    ctx.$MID = 0.4
    ctx.$TREBLE = 0.2

    node.update(ctx)

    expect(node.opacity).toBeCloseTo(0.85) // 0.8 + 0.5 * 0.1
    expect(node.scale).toBeCloseTo(1.2) // 1.0 + 1.0 * 0.2
    expect(node.rotation).toBeCloseTo(1.0) // 2.0 * 0.5
    expect(node.positionX).toBeCloseTo(0.04) // 0.4 * 0.1
    expect(node.positionY).toBeCloseTo(-0.02) // 0.2 * -0.1

    expect(mat?.uniforms.uOpacity.value).toBeCloseTo(0.85)
    expect(mat?.uniforms.uScale.value.x).toBeCloseTo(1.2)
    expect(mat?.uniforms.uRotation.value).toBeCloseTo(1.0)
    expect(mat?.uniforms.uOffset.value.x).toBeCloseTo(0.04)
    expect(mat?.uniforms.uOffset.value.y).toBeCloseTo(-0.02)
    expect(mat?.uniforms.uBlendMode.value).toBe(1) // BLEND_MODES.additive
  })

  it('isolates child rendering into childTarget and composites into writeTarget with feedback shader', () => {
    const node = new FrameBufferNode({
      id: 'fb-multipass',
      feedback: true,
      blendMode: 'additive',
    })
    node.init(mockRenderer)
    node.resize(800, 600, 1.0, 1.0)

    const childMock: VisualNode = {
      update: vi.fn(),
    }
    node.addChild(childMock)

    const ctx = createDefaultFrameContext()
    node.update(ctx)

    // Renderer clear called for child target and write target
    expect(mockRenderer.clear).toHaveBeenCalled()
    // Child updated
    expect(childMock.update).toHaveBeenCalledWith(ctx)

    // Feedback material configured for compositing pass
    const mat = node.getFeedbackMaterial()
    expect(mat?.uniforms.uHasBase.value).toBe(1)
    expect(mat?.uniforms.uBlendMode.value).toBe(1) // additive
  })

  it('clears both ping-pong buffers when clearBuffer is invoked', () => {
    const node = new FrameBufferNode({
      id: 'fb-clear',
      feedback: true,
    })
    node.init(mockRenderer)
    node.resize(800, 600, 1.0, 1.0)

    node.clearBuffer()

    // Should set target to fboA and clear, then fboB and clear
    expect(mockRenderer.clear).toHaveBeenCalledTimes(2)
  })

  it('skips compositing to parent when outputBlendMode is none while publishing to BufferPool', async () => {
    const { BufferPool } = await import('./buffer-pool')
    const pool = new BufferPool()

    const node = new FrameBufferNode({
      id: 'fb-offscreen',
      saveTo: '@OFFSCREEN',
      outputBlendMode: 'none',
    })
    node.init(mockRenderer, pool)
    node.resize(800, 600, 1.0, 1.0)

    const childMock: VisualNode = { update: vi.fn() }
    node.addChild(childMock)

    // Simulate being inside a parent buffer (mockRenderer.getRenderTarget returns an FBO)
    const THREE = await import('three')
    const parentTarget = new THREE.WebGLRenderTarget(800, 600)
    mockRenderer.getRenderTarget = vi.fn().mockReturnValue(parentTarget)
    const renderSpy = vi.spyOn(mockRenderer, 'render')

    const ctx = createDefaultFrameContext()
    node.update(ctx)

    // Child should have been updated
    expect(childMock.update).toHaveBeenCalledWith(ctx)

    // Output texture should be published into pool under @OFFSCREEN
    expect(pool.has('@OFFSCREEN')).toBe(true)
    expect(pool.get('@OFFSCREEN')).toBe(node.getWriteTarget()?.texture)

    // The composite quad render to parent target should NOT have been called
    expect(renderSpy).not.toHaveBeenCalled()
  })

  it('skips sampling input when inputBlendMode is none', async () => {
    const { BufferPool } = await import('./buffer-pool')
    const pool = new BufferPool()
    const THREE = await import('three')
    const inputTex = new THREE.DataTexture(new Uint8Array(4), 1, 1)
    pool.register('@SOURCE', inputTex)

    const node = new FrameBufferNode({
      id: 'fb-input-test',
      isMaster: true,
      loadFrom: '@SOURCE',
      inputBlendMode: 'none',
      outputBlendMode: 'replace',
    })
    node.init(mockRenderer, pool)
    node.resize(800, 600, 1.0, 1.0)

    const renderSpy = vi.spyOn(mockRenderer, 'render')
    const ctx = createDefaultFrameContext()
    node.update(ctx)

    // With inputBlendMode 'none', loadFrom quad is not rendered; only output quad is rendered to display
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })
})
