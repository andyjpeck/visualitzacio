import * as THREE from 'three'
import type { FrameContext } from '../../contracts/frame-context'
import type { RendererLike, VisualNode } from '../../contracts/renderer-like'
import type { BufferPool } from '../frame-buffer/buffer-pool'
import { createMaskCompositorMaterial } from './mask-compositor-shader'

export interface MaskCompositorNodeOptions {
  id: string
  foregroundFrom?: string | null
  backgroundFrom?: string | null
  maskFrom?: string | null
  maskInvert?: boolean
}

/**
 * VisualNode that performs 1-pass 3-way texture compositing (mix(Foreground, Background, Mask)).
 * Samples textures from the global BufferPool and evaluates in a single full-screen shader pass.
 */
export class MaskCompositorNode implements VisualNode {
  readonly id: string
  bypassed = false
  foregroundFrom: string | null = null
  backgroundFrom: string | null = null
  maskFrom: string | null = null
  maskInvert = false

  private renderer?: RendererLike
  private bufferPool?: BufferPool

  private readonly scene: THREE.Scene
  private readonly camera: THREE.OrthographicCamera
  private readonly geometry: THREE.PlaneGeometry
  private readonly material: THREE.ShaderMaterial
  private readonly mesh: THREE.Mesh
  private readonly defaultTexture: THREE.Texture

  constructor(options: MaskCompositorNodeOptions) {
    this.id = options.id
    this.foregroundFrom = this.formatTag(options.foregroundFrom)
    this.backgroundFrom = this.formatTag(options.backgroundFrom)
    this.maskFrom = this.formatTag(options.maskFrom)
    this.maskInvert = Boolean(options.maskInvert)

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.geometry = new THREE.PlaneGeometry(2, 2)
    this.material = createMaskCompositorMaterial()

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)

    this.defaultTexture = this.createDefaultTexture()
  }

  private formatTag(tag?: string | null): string | null {
    if (!tag || tag.trim() === '') return null
    const trimmed = tag.trim()
    return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
  }

  private createDefaultTexture(): THREE.Texture {
    const blackPixel = new Uint8Array([0, 0, 0, 0])
    const tex = new THREE.DataTexture(blackPixel, 1, 1, THREE.RGBAFormat)
    tex.needsUpdate = true
    return tex
  }

  init(renderer: RendererLike, bufferPool?: unknown): void {
    this.renderer = renderer
    if (bufferPool && typeof (bufferPool as BufferPool).resolve === 'function') {
      this.bufferPool = bufferPool as BufferPool
    }
  }

  setForegroundFrom(tag: string | null): void {
    this.foregroundFrom = this.formatTag(tag)
  }

  setBackgroundFrom(tag: string | null): void {
    this.backgroundFrom = this.formatTag(tag)
  }

  setMaskFrom(tag: string | null): void {
    this.maskFrom = this.formatTag(tag)
  }

  setMaskInvert(invert: boolean): void {
    this.maskInvert = invert
  }

  setParams(params: Partial<MaskCompositorNodeOptions>): void {
    if (params.foregroundFrom !== undefined) this.setForegroundFrom(params.foregroundFrom)
    if (params.backgroundFrom !== undefined) this.setBackgroundFrom(params.backgroundFrom)
    if (params.maskFrom !== undefined) this.setMaskFrom(params.maskFrom)
    if (params.maskInvert !== undefined) this.setMaskInvert(Boolean(params.maskInvert))
  }

  getMaterial(): THREE.ShaderMaterial {
    return this.material
  }

  update(_ctx: FrameContext): void {
    if (this.bypassed || !this.renderer) return

    // 1. Resolve Foreground
    if (this.foregroundFrom && this.bufferPool && this.bufferPool.has(this.foregroundFrom)) {
      const tex = this.bufferPool.resolve(this.foregroundFrom, this.id)
      this.material.uniforms.uForegroundTexture.value = tex
      this.material.uniforms.uHasForeground.value = 1
    } else {
      this.material.uniforms.uForegroundTexture.value = this.defaultTexture
      this.material.uniforms.uHasForeground.value = 0
    }

    // 2. Resolve Background
    if (this.backgroundFrom && this.bufferPool && this.bufferPool.has(this.backgroundFrom)) {
      const tex = this.bufferPool.resolve(this.backgroundFrom, this.id)
      this.material.uniforms.uBackgroundTexture.value = tex
      this.material.uniforms.uHasBackground.value = 1
    } else {
      this.material.uniforms.uBackgroundTexture.value = this.defaultTexture
      this.material.uniforms.uHasBackground.value = 0
    }

    // 3. Resolve Mask
    if (this.maskFrom && this.bufferPool && this.bufferPool.has(this.maskFrom)) {
      const tex = this.bufferPool.resolve(this.maskFrom, this.id)
      this.material.uniforms.uMaskTexture.value = tex
      this.material.uniforms.uHasMask.value = 1
    } else {
      this.material.uniforms.uMaskTexture.value = this.defaultTexture
      this.material.uniforms.uHasMask.value = 0
    }

    // 4. Update Mask Inversion
    this.material.uniforms.uMaskInvert.value = this.maskInvert ? 1 : 0

    // 5. Render Quad
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    this.defaultTexture.dispose()
    this.scene.remove(this.mesh)
  }
}
