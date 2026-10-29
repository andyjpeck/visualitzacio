import * as THREE from 'three'
import type { FrameContext } from '../../contracts/frame-context'
import type { RendererLike, VisualNode } from '../../contracts/renderer-like'
import type { DynamicParam } from '../expressions/dynamic-param'
import { createDynamicParam } from '../expressions/dynamic-param'
import type { ExpressionEngine } from '../expressions/expression-engine'
import {
  BLEND_MODES,
  type BlendModeName,
  createCompositingMaterial,
} from './compositing-shader'
import type { BufferPool } from './buffer-pool'

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
  offsetX?: number | string
  offsetY?: number | string
  feedback?: boolean
  saveTo?: string | null
  loadFrom?: string | null
  children?: VisualNode[]
  expressionEngine?: ExpressionEngine
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
  bypassed = false

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
  private bufferPool: BufferPool | null = null
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

  // Ping-pong feedback decay pass quad & compositing material
  private feedbackScene: THREE.Scene | null = null
  private feedbackCamera: THREE.OrthographicCamera | null = null
  private feedbackQuad: THREE.Mesh | null = null
  private feedbackMaterial: THREE.ShaderMaterial | null = null

  // Offscreen target for child rendering during feedback compositing
  private childTarget: THREE.WebGLRenderTarget | null = null

  constructor(options: FrameBufferNodeOptions) {
    this.id = options.id
    this.name = options.name ?? 'Frame Buffer'
    this.isMaster = options.isMaster ?? false
    this.blendMode = options.blendMode ?? 'replace'
    this.clearColor = options.clearColor ?? '#000000'
    this.feedback = options.feedback ?? false
    this.saveTo = options.saveTo ?? null
    this.loadFrom = options.loadFrom ?? null

    const posX = options.offsetX !== undefined ? options.offsetX : options.positionX
    const posY = options.offsetY !== undefined ? options.offsetY : options.positionY

    if (typeof options.opacity === 'number') this.opacityVal = options.opacity
    if (typeof options.scale === 'number') this.scaleVal = options.scale
    if (typeof options.rotation === 'number') this.rotationVal = options.rotation
    if (typeof posX === 'number') this.positionXVal = posX
    if (typeof posY === 'number') this.positionYVal = posY

    if (options.expressionEngine) {
      if (typeof options.opacity === 'string') this.bindExpression('opacity', options.opacity, options.expressionEngine)
      if (typeof options.scale === 'string') this.bindExpression('scale', options.scale, options.expressionEngine)
      if (typeof options.rotation === 'string') this.bindExpression('rotation', options.rotation, options.expressionEngine)
      if (typeof posX === 'string') this.bindExpression('positionX', posX, options.expressionEngine)
      if (typeof posY === 'string') this.bindExpression('positionY', posY, options.expressionEngine)
    }

    if (options.children) {
      for (const child of options.children) {
        this.addChild(child)
      }
    }

    this.initCompositeQuad()
    if (this.feedback || this.blendMode !== 'replace') {
      this.initFeedbackQuad()
    }
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

  private initFeedbackQuad(): void {
    this.feedbackScene = new THREE.Scene()
    this.feedbackCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.feedbackMaterial = createCompositingMaterial()
    this.feedbackQuad = new THREE.Mesh(geometry, this.feedbackMaterial)
    this.feedbackScene.add(this.feedbackQuad)
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

  get offsetX(): number {
    return this.positionXVal
  }

  get offsetY(): number {
    return this.positionYVal
  }

  /**
   * Dynamically toggles ping-pong feedback loop mode, allocating or releasing second FBO.
   *
   * @param feedback - True to enable dual-FBO ping-pong feedback.
   */
  setFeedback(feedback: boolean): void {
    if (this.feedback === feedback) return
    this.feedback = feedback
    const needsMultiPass = feedback || this.blendMode !== 'replace'
    if (needsMultiPass && !this.feedbackQuad) {
      this.initFeedbackQuad()
    }
    const targetW = Math.max(1, Math.floor(this.width * this.pixelRatio * this.resolutionScale))
    const targetH = Math.max(1, Math.floor(this.height * this.pixelRatio * this.resolutionScale))
    this.allocateRenderTargets(targetW, targetH)
  }

  /**
   * Sets the active compositing blend mode, dynamically allocating dual-FBO targets
   * if a non-replace blend mode is selected.
   */
  setBlendMode(blendMode: string): void {
    if (this.blendMode === blendMode) return
    this.blendMode = blendMode
    const needsMultiPass = this.feedback || this.blendMode !== 'replace'
    if (needsMultiPass && !this.feedbackQuad) {
      this.initFeedbackQuad()
    }
    const targetW = Math.max(1, Math.floor(this.width * this.pixelRatio * this.resolutionScale))
    const targetH = Math.max(1, Math.floor(this.height * this.pixelRatio * this.resolutionScale))
    this.allocateRenderTargets(targetW, targetH)
  }

  init(renderer: RendererLike, bufferPool?: BufferPool): void {
    this.renderer = renderer
    if (bufferPool) {
      this.bufferPool = bufferPool
      if (this.saveTo) {
        this.bufferPool.recordNodeMapping(this.id, this.saveTo)
      }
      if (this.loadFrom) {
        this.bufferPool.recordDependency(this.id, this.loadFrom)
      }
    }
    for (const child of this.children) {
      if (child.init) {
        if (this.bufferPool) {
          child.init(renderer, this.bufferPool)
        } else {
          child.init(renderer)
        }
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
    if (this.childTarget) {
      this.childTarget.dispose()
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

    const needsMultiPass = this.feedback || this.blendMode !== 'replace'
    if (needsMultiPass) {
      this.fboB = new THREE.WebGLRenderTarget(targetW, targetH, options)
      this.childTarget = new THREE.WebGLRenderTarget(targetW, targetH, options)
    } else {
      this.fboB = null
      this.childTarget = null
    }

    this.pingPongIndex = 0
  }

  /**
   * Returns current write render target where rendering operations are directed.
   */
  getWriteTarget(): THREE.WebGLRenderTarget | null {
    const needsMultiPass = this.feedback || this.blendMode !== 'replace'
    if (!needsMultiPass || !this.fboB) {
      return this.fboA
    }
    return this.pingPongIndex === 0 ? this.fboA : this.fboB
  }

  /**
   * Returns current read render target containing the completed previous frame.
   */
  getReadTarget(): THREE.WebGLRenderTarget | null {
    const needsMultiPass = this.feedback || this.blendMode !== 'replace'
    if (!needsMultiPass || !this.fboB) {
      return this.fboA
    }
    return this.pingPongIndex === 0 ? this.fboB : this.fboA
  }

  /**
   * Swaps read and write render targets for ping-pong feedback.
   */
  swap(): void {
    const needsMultiPass = this.feedback || this.blendMode !== 'replace'
    if (needsMultiPass && this.fboB) {
      this.pingPongIndex = this.pingPongIndex === 0 ? 1 : 0
    }
  }

  /**
   * Appends a child visual node to this buffer container.
   */
  addChild(node: VisualNode): void {
    this.children.push(node)
    if (this.renderer && node.init) {
      if (this.bufferPool) {
        node.init(this.renderer, this.bufferPool)
      } else {
        node.init(this.renderer)
      }
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
    param: 'opacity' | 'scale' | 'rotation' | 'positionX' | 'positionY' | 'offsetX' | 'offsetY',
    expr: string | number | null,
    engine?: ExpressionEngine,
  ): void {
    const canonical = param === 'offsetX' ? 'positionX' : param === 'offsetY' ? 'positionY' : param
    if (typeof expr === 'number') {
      if (canonical === 'opacity') { this.opacityVal = expr; this.opacityParam = null }
      if (canonical === 'scale') { this.scaleVal = expr; this.scaleParam = null }
      if (canonical === 'rotation') { this.rotationVal = expr; this.rotationParam = null }
      if (canonical === 'positionX') { this.positionXVal = expr; this.positionXParam = null }
      if (canonical === 'positionY') { this.positionYVal = expr; this.positionYParam = null }
      return
    }

    if (expr === null || expr === undefined || expr === '') {
      if (canonical === 'opacity') this.opacityParam = null
      if (canonical === 'scale') this.scaleParam = null
      if (canonical === 'rotation') this.rotationParam = null
      if (canonical === 'positionX') this.positionXParam = null
      if (canonical === 'positionY') this.positionYParam = null
    } else if (engine) {
      const dynamic = createDynamicParam(expr, engine)
      if (canonical === 'opacity') this.opacityParam = dynamic
      if (canonical === 'scale') this.scaleParam = dynamic
      if (canonical === 'rotation') this.rotationParam = dynamic
      if (canonical === 'positionX') this.positionXParam = dynamic
      if (canonical === 'positionY') this.positionYParam = dynamic
    }
  }

  /**
   * Returns the feedback pass ShaderMaterial, if feedback mode is enabled.
   */
  getFeedbackMaterial(): THREE.ShaderMaterial | null {
    return this.feedbackMaterial
  }

  /**
   * Returns the composite display quad mesh.
   */
  getCompositeQuad(): THREE.Mesh | null {
    return this.compositeQuad
  }

  /**
   * Resets both ping-pong buffers by clearing their contents to black.
   */
  clearBuffer(): void {
    if (!this.renderer || !this.renderer.clear || !this.renderer.setRenderTarget) return
    const prevTarget = this.renderer.getRenderTarget ? this.renderer.getRenderTarget() : null
    if (this.fboA) {
      this.renderer.setRenderTarget(this.fboA)
      this.renderer.clear()
    }
    if (this.fboB) {
      this.renderer.setRenderTarget(this.fboB)
      this.renderer.clear()
    }
    this.renderer.setRenderTarget(prevTarget)
  }

  /**
   * Executes the buffer render lifecycle: updates dynamic parameters, renders children
   * into the write FBO (with ping-pong feedback if active), swaps ping-pong buffers,
   * and composites to the parent target or screen.
   */
  update(ctx: FrameContext): void {
    if (!this.renderer || this.bypassed) return

    // Evaluate dynamic parameters
    if (this.opacityParam) this.opacityVal = this.opacityParam.evaluate(ctx, this.opacityVal)
    if (this.scaleParam) this.scaleVal = this.scaleParam.evaluate(ctx, this.scaleVal)
    if (this.rotationParam) this.rotationVal = this.rotationParam.evaluate(ctx, this.rotationVal)
    if (this.positionXParam) this.positionXVal = this.positionXParam.evaluate(ctx, this.positionXVal)
    if (this.positionYParam) this.positionYVal = this.positionYParam.evaluate(ctx, this.positionYVal)

    const prevTarget = this.renderer.getRenderTarget ? this.renderer.getRenderTarget() : null
    const writeTarget = this.getWriteTarget()
    const readTarget = this.getReadTarget()

    const needsMultiPass = this.feedback || this.blendMode !== 'replace'

    // 1. Direct render pass into write FBO
    if (needsMultiPass && readTarget && this.childTarget && this.feedbackMaterial && this.feedbackScene && this.feedbackCamera) {
      // Step A: Render children isolated into childTarget
      if (this.renderer.setRenderTarget) {
        this.renderer.setRenderTarget(this.childTarget)
      }
      if (this.renderer.clear) {
        this.renderer.clear()
      }
      let isFirstChild = true
      for (const child of this.children) {
        if (!child.bypassed) {
          if (!isFirstChild && this.renderer.clearDepth) {
            this.renderer.clearDepth()
          }
          child.update(ctx)
          isFirstChild = false
        }
      }

      // Step B: Render feedbackScene quad into writeTarget combining feedback history and child render
      if (writeTarget && this.renderer.setRenderTarget) {
        this.renderer.setRenderTarget(writeTarget)
      }
      if (this.renderer.clear) {
        this.renderer.clear()
      }

      // Configure feedback shader uniforms
      this.feedbackMaterial.uniforms.uBaseTexture.value = readTarget.texture
      this.feedbackMaterial.uniforms.uBlendTexture.value = this.childTarget.texture
      this.feedbackMaterial.uniforms.uHasBase.value = 1
      this.feedbackMaterial.uniforms.uOpacity.value = this.opacityVal
      this.feedbackMaterial.uniforms.uBlendMode.value = BLEND_MODES[this.blendMode as BlendModeName] ?? 0
      this.feedbackMaterial.uniforms.uScale.value.set(this.scaleVal, this.scaleVal)
      this.feedbackMaterial.uniforms.uRotation.value = this.rotationVal
      this.feedbackMaterial.uniforms.uOffset.value.set(this.positionXVal, this.positionYVal)

      // Render composited feedback quad
      this.renderer.render(this.feedbackScene, this.feedbackCamera)
    } else {
      if (writeTarget && this.renderer.setRenderTarget) {
        this.renderer.setRenderTarget(writeTarget)
      }

      if (this.clearColor && this.renderer.setClearColor) {
        this.renderer.setClearColor(this.clearColor)
      }

      if (this.blendMode === 'replace' && this.renderer.clear) {
        this.renderer.clear()
      }

      if (this.loadFrom && this.bufferPool && this.compositeScene && this.compositeCamera && this.compositeMaterial) {
        const loadedTex = this.bufferPool.resolve(this.loadFrom, this.id)
        if (loadedTex) {
          this.compositeMaterial.map = loadedTex
          this.compositeMaterial.opacity = 1.0
          this.renderer.render(this.compositeScene, this.compositeCamera)
        }
      }

      let isFirstChild = true
      for (const child of this.children) {
        if (!child.bypassed) {
          if (!isFirstChild && this.renderer.clearDepth) {
            this.renderer.clearDepth()
          }
          child.update(ctx)
          isFirstChild = false
        }
      }
    }

    // 2. Restore parent render target
    if (this.renderer.setRenderTarget) {
      this.renderer.setRenderTarget(prevTarget)
    }

    // 3. Swap ping-pong buffers if feedback or multi-pass is active
    if (needsMultiPass) {
      this.swap()
    }

    // Register texture in global BufferPool if saveTo is configured
    if (this.saveTo && this.bufferPool) {
      const outputTarget = needsMultiPass ? this.getReadTarget() : writeTarget
      if (outputTarget) {
        this.bufferPool.register(this.saveTo, outputTarget.texture)
      }
    }

    // 4. Composite to display if master root, or onto parent target if nested
    const displayTarget = needsMultiPass ? this.getReadTarget() : writeTarget
    if (displayTarget && this.compositeScene && this.compositeCamera && this.compositeMaterial) {
      if (this.isMaster || prevTarget) {
        if (this.compositeQuad) {
          this.compositeQuad.scale.set(this.scaleVal, this.scaleVal, 1)
          this.compositeQuad.position.set(this.positionXVal, this.positionYVal, 0)
          this.compositeQuad.rotation.z = (this.rotationVal * Math.PI) / 180
        }
        this.compositeMaterial.map = displayTarget.texture
        this.compositeMaterial.opacity = this.opacityVal
        this.renderer.render(this.compositeScene, this.compositeCamera)
      }
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
    if (this.childTarget) {
      this.childTarget.dispose()
      this.childTarget = null
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

    if (this.feedbackQuad) {
      this.feedbackQuad.geometry.dispose()
      this.feedbackQuad = null
    }
    if (this.feedbackMaterial) {
      this.feedbackMaterial.dispose()
      this.feedbackMaterial = null
    }
    this.feedbackScene = null
    this.feedbackCamera = null

    for (const child of this.children) {
      if (child.dispose) {
        child.dispose()
      }
    }
    this.children.length = 0
  }
}
