import * as THREE from 'three'
import type { FrameContext } from '../../contracts/frame-context'
import type { RendererLike, VisualNode } from '../../contracts/renderer-like'
import type { DynamicParam } from '../expressions/dynamic-param'
import { createDynamicParam } from '../expressions/dynamic-param'
import type { ExpressionEngine } from '../expressions/expression-engine'

export interface FrameBufferNodeOptions {
  id: string
  name?: string
  isMaster?: boolean
  blendMode?: string
  clearColor?: string
  opacity?: number | string
  scale?: number | string
  rotation?: number | string
  positionX?: number | string
  positionY?: number | string
  feedback?: boolean
  saveTo?: string | null
  loadFrom?: string | null
  children?: VisualNode[]
}

/**
 * Modular container, render-to-texture buffer, and compositing layer.
 * Implements the VisualNode contract, managing offscreen THREE.WebGLRenderTarget instances,
 * dual-FBO ping-pong texture swapping, and hierarchical child execution.
 */
export class FrameBufferNode implements VisualNode {
  readonly id: string
  name: string
  isMaster: boolean
  blendMode: string
  clearColor: string
  feedback: boolean
  saveTo: string | null
  loadFrom: string | null

  private opacityVal = 1.0
  private scaleVal = 1.0
  private rotationVal = 0.0
  private positionXVal = 0.0
  private positionYVal = 0.0

  private opacityParam: DynamicParam<number> | null = null
  private scaleParam: DynamicParam<number> | null = null
  private rotationParam: DynamicParam<number> | null = null
  private positionXParam: DynamicParam<number> | null = null
  private positionYParam: DynamicParam<number> | null = null

  private renderer: RendererLike | null = null
  private readonly children: VisualNode[] = []

  private fboA: THREE.WebGLRenderTarget | null = null
  private fboB: THREE.WebGLRenderTarget | null = null
  private pingPongIndex: 0 | 1 = 0

  private width = 1920
  private height = 1080
  private pixelRatio = 1.0
  private resolutionScale = 1.0

  // Fullscreen quad for compositing rendered FBO to parent or display
  private compositeScene: THREE.Scene | null = null
  private compositeCamera: THREE.OrthographicCamera | null = null
  private compositeQuad: THREE.Mesh | null = null
  private compositeMaterial: THREE.MeshBasicMaterial | null = null

  constructor(options: FrameBufferNodeOptions) {
    this.id = options.id
    this.name = options.name ?? 'Frame Buffer'
    this.isMaster = options.isMaster ?? false
    this.blendMode = options.blendMode ?? 'replace'
    this.clearColor = options.clearColor ?? '#000000'
    this.feedback = options.feedback ?? false
    this.saveTo = options.saveTo ?? null
    this.loadFrom = options.loadFrom ?? null

    if (typeof options.opacity === 'number') this.opacityVal = options.opacity
    if (typeof options.scale === 'number') this.scaleVal = options.scale
    if (typeof options.rotation === 'number') this.rotationVal = options.rotation
    if (typeof options.positionX === 'number') this.positionXVal = options.positionX
    if (typeof options.positionY === 'number') this.positionYVal = options.positionY

    if (options.children) {
      for (const child of options.children) {
        this.addChild(child)
      }
    }

    this.initCompositeQuad()
  }

  private initCompositeQuad(): void {
    this.compositeScene = new THREE.Scene()
    this.compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.compositeMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: this.opacityVal,
    })
    this.compositeQuad = new THREE.Mesh(geometry, this.compositeMaterial)
    this.compositeScene.add(this.compositeQuad)
  }

  get opacity(): number {
    return this.opacityVal
  }

  get scale(): number {
    return this.scaleVal
  }

  get rotation(): number {
    return this.rotationVal
  }

  get positionX(): number {
    return this.positionXVal
  }

  get positionY(): number {
    return this.positionYVal
  }

  init(renderer: RendererLike): void {
    this.renderer = renderer
    for (const child of this.children) {
      if (child.init) {
        child.init(renderer)
      }
    }
  }

  /**
   * Resizes render target textures to match canvas dimensions scaled by resolution multiplier.
   */
  resize(width: number, height: number, pixelRatio = 1.0, resolutionScale = 1.0): void {
    this.width = width
    this.height = height
    this.pixelRatio = Math.min(pixelRatio, 2.0)
    this.resolutionScale = resolutionScale

    const targetW = Math.max(1, Math.floor(width * this.pixelRatio * resolutionScale))
    const targetH = Math.max(1, Math.floor(height * this.pixelRatio * resolutionScale))

    this.allocateRenderTargets(targetW, targetH)

    for (const child of this.children) {
      if (child.resize) {
        child.resize(width, height, this.pixelRatio, resolutionScale)
      }
    }
  }

  private allocateRenderTargets(targetW: number, targetH: number): void {
    if (this.fboA) {
      this.fboA.dispose()
    }
    if (this.fboB) {
      this.fboB.dispose()
    }

    const options: THREE.RenderTargetOptions = {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
      stencilBuffer: false,
    }

    this.fboA = new THREE.WebGLRenderTarget(targetW, targetH, options)

    if (this.feedback) {
      this.fboB = new THREE.WebGLRenderTarget(targetW, targetH, options)
    } else {
      this.fboB = null
    }

    this.pingPongIndex = 0
  }

  /**
   * Returns current write render target where rendering operations are directed.
   */
  getWriteTarget(): THREE.WebGLRenderTarget | null {
    if (!this.feedback || !this.fboB) {
      return this.fboA
    }
    return this.pingPongIndex === 0 ? this.fboA : this.fboB
  }

  /**
   * Returns current read render target containing the completed previous frame.
   */
  getReadTarget(): THREE.WebGLRenderTarget | null {
    if (!this.feedback || !this.fboB) {
      return this.fboA
    }
    return this.pingPongIndex === 0 ? this.fboB : this.fboA
  }

  /**
   * Swaps read and write render targets for ping-pong feedback.
   */
  swap(): void {
    if (this.feedback && this.fboB) {
      this.pingPongIndex = this.pingPongIndex === 0 ? 1 : 0
    }
  }

  /**
   * Appends a child visual node to this buffer container.
   */
  addChild(node: VisualNode): void {
    this.children.push(node)
    if (this.renderer && node.init) {
      node.init(this.renderer)
    }
    if (node.resize) {
      node.resize(this.width, this.height, this.pixelRatio, this.resolutionScale)
    }
  }

  /**
   * Removes a child visual node from this buffer container and triggers its disposal.
   */
  removeChild(node: VisualNode): void {
    const idx = this.children.indexOf(node)
    if (idx !== -1) {
      this.children.splice(idx, 1)
      if (node.dispose) {
        node.dispose()
      }
    }
  }

  /**
   * Returns a read-only list of attached child visual nodes.
   */
  getChildren(): readonly VisualNode[] {
    return this.children
  }

  /**
   * Binds an optional dynamic expression to modulation parameters.
   */
  bindExpression(
    param: 'opacity' | 'scale' | 'rotation' | 'positionX' | 'positionY',
    expr: string | number | null,
    engine: ExpressionEngine,
  ): void {
    if (expr === null || expr === undefined || expr === '') {
      if (param === 'opacity') this.opacityParam = null
      if (param === 'scale') this.scaleParam = null
      if (param === 'rotation') this.rotationParam = null
      if (param === 'positionX') this.positionXParam = null
      if (param === 'positionY') this.positionYParam = null
    } else {
      const dynamic = createDynamicParam(expr, engine)
      if (param === 'opacity') this.opacityParam = dynamic
      if (param === 'scale') this.scaleParam = dynamic
      if (param === 'rotation') this.rotationParam = dynamic
      if (param === 'positionX') this.positionXParam = dynamic
      if (param === 'positionY') this.positionYParam = dynamic
    }
  }

  /**
   * Executes the buffer render lifecycle: updates dynamic parameters, renders children
   * into the write FBO, swaps ping-pong buffers, and composites to the parent target.
   */
  update(ctx: FrameContext): void {
    if (!this.renderer) return

    // Evaluate dynamic parameters
    if (this.opacityParam) this.opacityVal = this.opacityParam.evaluate(ctx, this.opacityVal)
    if (this.scaleParam) this.scaleVal = this.scaleParam.evaluate(ctx, this.scaleVal)
    if (this.rotationParam) this.rotationVal = this.rotationParam.evaluate(ctx, this.rotationVal)
    if (this.positionXParam) this.positionXVal = this.positionXParam.evaluate(ctx, this.positionXVal)
    if (this.positionYParam) this.positionYVal = this.positionYParam.evaluate(ctx, this.positionYVal)

    const prevTarget = this.renderer.getRenderTarget ? this.renderer.getRenderTarget() : null
    const writeTarget = this.getWriteTarget()

    // 1. Direct render pass into write FBO
    if (writeTarget && this.renderer.setRenderTarget) {
      this.renderer.setRenderTarget(writeTarget)
    }

    if (this.isMaster && this.blendMode === 'replace' && !this.feedback) {
      if (this.renderer.clear) {
        this.renderer.clear()
      }
    }

    // 2. Render all children
    for (const child of this.children) {
      child.update(ctx)
    }

    // 3. Restore parent render target
    if (this.renderer.setRenderTarget) {
      this.renderer.setRenderTarget(prevTarget)
    }

    // 4. Swap ping-pong buffers if feedback is active
    if (this.feedback) {
      this.swap()
    }

    // 5. Composite to display if master root
    if (this.isMaster && writeTarget && this.compositeScene && this.compositeCamera && this.compositeMaterial) {
      this.compositeMaterial.map = writeTarget.texture
      this.compositeMaterial.opacity = this.opacityVal
      this.renderer.render(this.compositeScene, this.compositeCamera)
    }
  }

  /**
   * Frees render targets, quad meshes, materials, and child nodes from GPU memory.
   */
  dispose(): void {
    if (this.fboA) {
      this.fboA.dispose()
      this.fboA = null
    }
    if (this.fboB) {
      this.fboB.dispose()
      this.fboB = null
    }

    if (this.compositeQuad) {
      this.compositeQuad.geometry.dispose()
      this.compositeQuad = null
    }
    if (this.compositeMaterial) {
      this.compositeMaterial.dispose()
      this.compositeMaterial = null
    }
    this.compositeScene = null
    this.compositeCamera = null

    for (const child of this.children) {
      if (child.dispose) {
        child.dispose()
      }
    }
    this.children.length = 0
  }
}
