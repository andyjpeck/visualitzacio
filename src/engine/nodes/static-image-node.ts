import * as THREE from 'three'
import type { FrameContext } from '../../contracts/frame-context'
import type { RendererLike, VisualNode } from '../../contracts/renderer-like'
import type { ExpressionEngine } from '../expressions/expression-engine'
import type { DynamicParam } from '../expressions/dynamic-param'
import { createDynamicParam } from '../expressions/dynamic-param'
import type { BufferPool } from '../frame-buffer/buffer-pool'

export type ImageFitMode = 'cover' | 'contain' | 'stretch'

export interface StaticImageNodeOptions {
  id: string
  url: string
  fit?: ImageFitMode
  opacity?: number | string
  saveTo?: string | null
  expressionEngine?: ExpressionEngine
}

/**
 * 2D background/overlay visual node that displays a static image texture.
 * Supports aspect-ratio preservation via 'cover', 'contain', and 'stretch' fit modes,
 * audio-reactive opacity modulation, and named buffer export to BufferPool.
 */
export class StaticImageNode implements VisualNode {
  readonly id: string
  url: string
  bypassed = false
  private fitMode: ImageFitMode
  private opacityVal = 1.0
  saveTo: string | null

  private opacityParam: DynamicParam<number> | null = null
  private renderer?: RendererLike
  private bufferPool?: BufferPool

  private readonly scene: THREE.Scene
  private readonly camera: THREE.OrthographicCamera
  private readonly geometry: THREE.PlaneGeometry
  private readonly material: THREE.MeshBasicMaterial
  private readonly mesh: THREE.Mesh
  private texture: THREE.Texture

  private canvasWidth = 1920
  private canvasHeight = 1080
  private imageWidth = 1920
  private imageHeight = 1080

  constructor(options: StaticImageNodeOptions) {
    this.id = options.id
    this.url = options.url
    this.fitMode = options.fit ?? 'cover'
    this.saveTo = options.saveTo ?? null

    if (typeof options.opacity === 'number') {
      this.opacityVal = options.opacity
    }

    if (options.expressionEngine && typeof options.opacity === 'string') {
      this.opacityParam = createDynamicParam(options.opacity, options.expressionEngine)
    }

    // 2D orthographic setup
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.geometry = new THREE.PlaneGeometry(2, 2)

    // Create texture or 1x1 placeholder
    this.texture = this.createDefaultTexture()
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: this.opacityVal,
      depthTest: false,
      depthWrite: false,
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)

    this.loadTexture(options.url)
  }

  private createDefaultTexture(): THREE.Texture {
    const whitePixel = new Uint8Array([255, 255, 255, 255])
    const tex = new THREE.DataTexture(whitePixel, 1, 1, THREE.RGBAFormat)
    tex.needsUpdate = true
    return tex
  }

  private loadTexture(url: string): void {
    if (typeof Image === 'undefined') return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      this.setImageDimensions(img.naturalWidth || 1920, img.naturalHeight || 1080)
      const newTex = new THREE.Texture(img)
      newTex.needsUpdate = true
      this.texture.dispose()
      this.texture = newTex
      this.material.map = this.texture
      this.material.needsUpdate = true
      if (this.bufferPool && this.saveTo) {
        this.bufferPool.register(this.saveTo, this.texture)
      }
    }
    img.src = url
  }

  get opacity(): number {
    return this.opacityVal
  }

  get fit(): ImageFitMode {
    return this.fitMode
  }

  setFit(fit: ImageFitMode): void {
    this.fitMode = fit
    this.recalculateAspect()
  }

  setUrl(url: string): void {
    if (this.url === url) return
    this.url = url
    this.loadTexture(url)
  }

  setOpacity(opacity: number | string, engine?: ExpressionEngine): void {
    if (typeof opacity === 'number') {
      this.opacityVal = opacity
      this.opacityParam = null
      this.material.opacity = opacity
    } else if (engine && typeof opacity === 'string') {
      this.opacityParam = createDynamicParam(opacity, engine)
    }
  }

  setImageDimensions(width: number, height: number): void {
    this.imageWidth = Math.max(1, width)
    this.imageHeight = Math.max(1, height)
    this.recalculateAspect()
  }

  getMeshScale(): THREE.Vector3 {
    return this.mesh.scale
  }

  getGeometry(): THREE.PlaneGeometry {
    return this.geometry
  }

  getMaterial(): THREE.MeshBasicMaterial {
    return this.material
  }

  getTexture(): THREE.Texture {
    return this.texture
  }

  /**
   * Recalculates orthographic quad scale based on fit mode and aspect ratios.
   */
  private recalculateAspect(): void {
    const canvasAspect = this.canvasWidth / Math.max(1, this.canvasHeight)
    const imageAspect = this.imageWidth / Math.max(1, this.imageHeight)

    if (this.fitMode === 'stretch') {
      this.mesh.scale.set(1.0, 1.0, 1.0)
      return
    }

    if (this.fitMode === 'contain') {
      if (imageAspect > canvasAspect) {
        // Image is wider than canvas: fit width, scale down height
        this.mesh.scale.set(1.0, canvasAspect / imageAspect, 1.0)
      } else {
        // Image is taller than canvas: fit height, scale down width
        this.mesh.scale.set(imageAspect / canvasAspect, 1.0, 1.0)
      }
      return
    }

    if (this.fitMode === 'cover') {
      if (imageAspect > canvasAspect) {
        // Image is wider than canvas: fit height, expand width
        this.mesh.scale.set(imageAspect / canvasAspect, 1.0, 1.0)
      } else {
        // Image is taller than canvas: fit width, expand height
        this.mesh.scale.set(1.0, canvasAspect / imageAspect, 1.0)
      }
    }
  }

  /**
   * Configures or clears the destination buffer pool tag (@NAME).
   */
  setSaveTo(name: string | null): void {
    const formatted =
      name && name.trim() !== ''
        ? name.trim().startsWith('@')
          ? name.trim()
          : `@${name.trim()}`
        : null
    this.saveTo = formatted
    if (this.bufferPool && formatted) {
      this.bufferPool.recordNodeMapping(this.id, formatted)
      if (this.texture) {
        this.bufferPool.register(formatted, this.texture)
      }
    }
  }

  init(renderer: RendererLike, bufferPool?: BufferPool): void {
    this.renderer = renderer
    this.bufferPool = bufferPool
    if (this.saveTo && bufferPool) {
      bufferPool.recordNodeMapping(this.id, this.saveTo)
      bufferPool.register(this.saveTo, this.texture)
    }
  }

  resize(width: number, height: number, pixelRatio = 1.0, resolutionScale = 1.0): void {
    void pixelRatio
    void resolutionScale
    this.canvasWidth = width
    this.canvasHeight = height
    this.recalculateAspect()
  }

  update(ctx: FrameContext): void {
    if (this.bypassed) return

    if (this.opacityParam) {
      this.opacityVal = this.opacityParam.evaluate(ctx, this.opacityVal)
      this.material.opacity = this.opacityVal
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    this.texture.dispose()
  }
}
