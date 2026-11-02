import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createDefaultFrameContext, type FrameContext } from '../../contracts/frame-context'
import type { RendererLike } from '../../contracts/renderer-like'
import { BufferPool } from '../frame-buffer/buffer-pool'
import { MaskCompositorNode } from './mask-compositor-node'

describe('MaskCompositorNode (Task 1.3, #18)', () => {
  let mockRenderer: RendererLike
  let bufferPool: BufferPool
  let frameContext: FrameContext

  beforeEach(() => {
    mockRenderer = {
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    }

    bufferPool = new BufferPool()
    frameContext = createDefaultFrameContext()
  })

  it('initializes with default and configured properties', () => {
    const node = new MaskCompositorNode({
      id: 'mask-comp-1',
      foregroundFrom: '@WATER',
      backgroundFrom: '@SUNSET',
      maskFrom: '@RAIN',
      maskInvert: true,
    })

    expect(node.id).toBe('mask-comp-1')
    expect(node.foregroundFrom).toBe('@WATER')
    expect(node.backgroundFrom).toBe('@SUNSET')
    expect(node.maskFrom).toBe('@RAIN')
    expect(node.maskInvert).toBe(true)
    expect(node.bypassed).toBe(false)
  })

  it('supports runtime property mutation via setters', () => {
    const node = new MaskCompositorNode({ id: 'mask-comp-2' })

    node.setForegroundFrom('@OCEAN')
    node.setBackgroundFrom('@DUSK')
    node.setMaskFrom('@SPLASH')
    node.setMaskInvert(true)

    expect(node.foregroundFrom).toBe('@OCEAN')
    expect(node.backgroundFrom).toBe('@DUSK')
    expect(node.maskFrom).toBe('@SPLASH')
    expect(node.maskInvert).toBe(true)
  })

  it('resolves textures from BufferPool and passes them to shader uniforms on update', () => {
    const node = new MaskCompositorNode({
      id: 'mask-comp-3',
      foregroundFrom: '@WATER',
      backgroundFrom: '@SUNSET',
      maskFrom: '@RAIN',
      maskInvert: false,
    })

    node.init(mockRenderer, bufferPool)

    // Register dummy textures in BufferPool
    const waterTex = new THREE.Texture()
    const sunsetTex = new THREE.Texture()
    const rainTex = new THREE.Texture()

    bufferPool.register('@WATER', waterTex)
    bufferPool.register('@SUNSET', sunsetTex)
    bufferPool.register('@RAIN', rainTex)

    node.update(frameContext)

    expect(mockRenderer.render).toHaveBeenCalledTimes(1)
    const mat = node.getMaterial()
    expect(mat.uniforms.uForegroundTexture.value).toBe(waterTex)
    expect(mat.uniforms.uBackgroundTexture.value).toBe(sunsetTex)
    expect(mat.uniforms.uMaskTexture.value).toBe(rainTex)
    expect(mat.uniforms.uHasForeground.value).toBe(1)
    expect(mat.uniforms.uHasBackground.value).toBe(1)
    expect(mat.uniforms.uHasMask.value).toBe(1)
    expect(mat.uniforms.uMaskInvert.value).toBe(0)
  })

  it('falls back gracefully without errors when textures are unbound or missing in BufferPool', () => {
    const node = new MaskCompositorNode({
      id: 'mask-comp-4',
      foregroundFrom: '@MISSING_WATER',
      backgroundFrom: '@MISSING_SUNSET',
      maskFrom: '@MISSING_RAIN',
    })

    node.init(mockRenderer, bufferPool)
    expect(() => node.update(frameContext)).not.toThrow()

    expect(mockRenderer.render).toHaveBeenCalledTimes(1)
    const mat = node.getMaterial()
    expect(mat.uniforms.uHasForeground.value).toBe(0)
    expect(mat.uniforms.uHasBackground.value).toBe(0)
    expect(mat.uniforms.uHasMask.value).toBe(0)
  })

  it('skips rendering when bypassed is true', () => {
    const node = new MaskCompositorNode({ id: 'mask-comp-5' })
    node.init(mockRenderer, bufferPool)
    node.bypassed = true

    node.update(frameContext)
    expect(mockRenderer.render).not.toHaveBeenCalled()
  })

  it('normalizes buffer tags with @ and supports setParams convenience API', () => {
    const node = new MaskCompositorNode({ id: 'mask-comp-7' })
    node.setParams({
      foregroundFrom: 'WATER',
      backgroundFrom: 'SUNSET',
      maskFrom: 'RAIN',
      maskInvert: true,
    })
    expect(node.foregroundFrom).toBe('@WATER')
    expect(node.backgroundFrom).toBe('@SUNSET')
    expect(node.maskFrom).toBe('@RAIN')
    expect(node.maskInvert).toBe(true)

    node.init(mockRenderer, bufferPool)
    node.update(frameContext)
    expect(node.getMaterial().uniforms.uMaskInvert.value).toBe(1)
  })

  it('cleans up resources cleanly on dispose', () => {
    const node = new MaskCompositorNode({ id: 'mask-comp-6' })
    node.init(mockRenderer, bufferPool)

    const geomSpy = vi.spyOn((node as any).geometry, 'dispose')
    const matSpy = vi.spyOn((node as any).material, 'dispose')
    const texSpy = vi.spyOn((node as any).defaultTexture, 'dispose')

    node.dispose()

    expect(geomSpy).toHaveBeenCalledTimes(1)
    expect(matSpy).toHaveBeenCalledTimes(1)
    expect(texSpy).toHaveBeenCalledTimes(1)
    expect((node as any).scene.children).toHaveLength(0)
  })
})
