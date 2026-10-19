import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { FrameBufferNode } from './frame-buffer-node'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import type { RendererLike, VisualNode } from '../../contracts/renderer-like'

describe('FrameBufferNode', () => {
  let mockRenderer: RendererLike
  let currentRenderTarget: THREE.WebGLRenderTarget | null = null

  beforeEach(() => {
    currentRenderTarget = null
    const canvas = document.createElement('canvas')
    mockRenderer = {
      domElement: canvas,
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      setRenderTarget: vi.fn((target: unknown) => {
        currentRenderTarget = target as THREE.WebGLRenderTarget | null
      }),
      getRenderTarget: vi.fn(() => currentRenderTarget),
      clear: vi.fn(),
      dispose: vi.fn(),
    }
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
})
