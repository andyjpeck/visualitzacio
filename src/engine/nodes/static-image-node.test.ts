import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StaticImageNode } from './static-image-node'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import type { RendererLike } from '../../contracts/renderer-like'
import { BufferPool } from '../frame-buffer/buffer-pool'

describe('StaticImageNode', () => {
  let mockRenderer: RendererLike

  beforeEach(() => {
    const canvas = document.createElement('canvas')
    mockRenderer = {
      domElement: canvas,
      autoClear: true,
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn(),
    }
  })

  it('calculates aspect ratios correctly for contain, cover, and stretch fit modes', () => {
    const node = new StaticImageNode({
      id: 'img-1',
      url: 'data:image/png;base64,placeholder',
      fit: 'contain',
    })

    node.init(mockRenderer)

    // Simulate image loaded with natural dimensions 1000x1000 (aspect 1.0)
    node.setImageDimensions(1000, 1000)

    // Canvas is 16:9 (1920x1080)
    node.resize(1920, 1080, 1.0, 1.0)

    // In contain mode for taller image (aspect 1.0 < 1.7778), mesh height = 1.0, mesh width = 1.0 / (16/9)
    const containScale = node.getMeshScale()
    expect(containScale.y).toBeCloseTo(1.0)
    expect(containScale.x).toBeCloseTo(1080 / 1920)

    // In cover mode, mesh width = 1.0, mesh height = (16/9) / 1.0
    node.setFit('cover')
    const coverScale = node.getMeshScale()
    expect(coverScale.x).toBeCloseTo(1.0)
    expect(coverScale.y).toBeCloseTo(1920 / 1080)

    // In stretch mode, mesh width = 1.0, mesh height = 1.0
    node.setFit('stretch')
    const stretchScale = node.getMeshScale()
    expect(stretchScale.x).toBeCloseTo(1.0)
    expect(stretchScale.y).toBeCloseTo(1.0)
  })

  it('evaluates dynamic opacity expressions during update passes', async () => {
    const { ExpressionEngine } = await import('../expressions/expression-engine')
    const engine = new ExpressionEngine()

    const node = new StaticImageNode({
      id: 'img-dynamic',
      url: 'data:image/png;base64,placeholder',
      opacity: '0.5 + $BASS * 0.5',
      expressionEngine: engine,
    })

    node.init(mockRenderer)
    node.setImageDimensions(800, 600)
    node.resize(800, 600, 1.0, 1.0)

    const ctx = createDefaultFrameContext()
    ctx.$BASS = 0.6

    node.update(ctx)
    expect(node.opacity).toBeCloseTo(0.8)
    expect(node.getMaterial().opacity).toBeCloseTo(0.8)
  })

  it('registers its texture into BufferPool when saveTo is configured', () => {
    const pool = new BufferPool()
    const node = new StaticImageNode({
      id: 'img-pool',
      url: 'data:image/png;base64,placeholder',
      saveTo: '@LOGO',
    })

    node.init(mockRenderer, pool)
    expect(pool.has('@LOGO')).toBe(true)
    expect(pool.get('@LOGO')).toBe(node.getTexture())
  })

  it('safely disposes geometry, material, and textures on dispose()', () => {
    const node = new StaticImageNode({
      id: 'img-dispose',
      url: 'data:image/png;base64,placeholder',
    })
    node.init(mockRenderer)

    const geomDispose = vi.spyOn(node.getGeometry(), 'dispose')
    const matDispose = vi.spyOn(node.getMaterial(), 'dispose')
    const texDispose = vi.spyOn(node.getTexture(), 'dispose')

    node.dispose()

    expect(geomDispose).toHaveBeenCalled()
    expect(matDispose).toHaveBeenCalled()
    expect(texDispose).toHaveBeenCalled()
  })
})
