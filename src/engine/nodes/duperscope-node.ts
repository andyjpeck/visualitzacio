import * as THREE from 'three'
import type { FrameContext } from '../../contracts/frame-context'
import type { RendererLike, VisualNode } from '../../contracts/renderer-like'
import { createDynamicParam, type DynamicParam } from '../expressions/dynamic-param'
import {
  type ExpressionEngine,
  getDefaultExpressionEngine,
} from '../expressions/expression-engine'
import {
  DuperscopeCompiler,
  type DuperscopePhase,
  type DuperscopeScripts,
  type DuperscopeAllCompilationResult,
} from './duperscope-compiler'
import {
  DuperscopeRunner,
  type DuperscopeAudioMode,
  type DuperscopeChannel,
} from './duperscope-runner'
import {
  createDuperscopePointsMaterial,
  createDuperscopeRibbonMaterial,
  createRibbonQuadGeometry,
} from './duperscope-shaders'

export type DuperscopeDrawMode = 'lines' | 'lineLoop' | 'points'

export interface DuperscopeNodeOptions {
  id: string
  name?: string
  drawMode?: DuperscopeDrawMode
  audioMode?: DuperscopeAudioMode
  channel?: DuperscopeChannel
  opacity?: number | string
  initCode?: string
  beatCode?: string
  frameCode?: string
  pointCode?: string
  compiler?: DuperscopeCompiler
  expressionEngine?: ExpressionEngine
}

const MAX_POINTS = 4096
const MAX_SEGMENTS = 4096

/**
 * Visual generative synthesizer node inspired by Winamp AVS Superscope.
 * Renders parametric curves and audio-reactive particle geometries via
 * a 4-phase procedural execution lifecycle (`init`, `beat`, `frame`, `point`)
 * with 1:1 aspect-ratio projection and instanced screen-space quad ribbons.
 */
export class DuperscopeNode implements VisualNode {
  readonly id: string
  name: string
  bypassed = false
  drawMode: DuperscopeDrawMode
  audioMode: DuperscopeAudioMode
  channel: DuperscopeChannel

  readonly scene: THREE.Scene
  readonly camera: THREE.OrthographicCamera

  private expressionEngine: ExpressionEngine
  private compiler: DuperscopeCompiler
  private runner: DuperscopeRunner

  private scripts: DuperscopeScripts
  private compilationResult: DuperscopeAllCompilationResult
  private baseOpacity = 1.0
  private opacityParam: DynamicParam<number> | null = null

  // Pre-allocated evaluation buffers (zero per-frame allocations)
  private pointPositions: Float32Array = new Float32Array(MAX_POINTS * 3)
  private pointColors: Float32Array = new Float32Array(MAX_POINTS * 4)
  private pointSizes: Float32Array = new Float32Array(MAX_POINTS)

  // WebGL Ribbon mesh (lines & lineLoop)
  private ribbonGeometry: THREE.InstancedBufferGeometry
  private ribbonMaterial: THREE.ShaderMaterial
  private ribbonMesh: THREE.Mesh

  // WebGL Points mesh
  private pointsGeometry: THREE.BufferGeometry
  private pointsMaterial: THREE.ShaderMaterial
  private pointsMesh: THREE.Points

  private activePointCount = 0
  private activeSegmentCount = 0

  constructor(options: DuperscopeNodeOptions) {
    this.id = options.id
    this.name = options.name ?? 'Duperscope'
    this.drawMode = options.drawMode ?? 'lines'
    this.audioMode = options.audioMode ?? 'waveform'
    this.channel = options.channel ?? 'center'

    this.expressionEngine = options.expressionEngine ?? getDefaultExpressionEngine()
    this.compiler = options.compiler ?? new DuperscopeCompiler(this.expressionEngine)
    this.runner = new DuperscopeRunner()

    this.scripts = {
      init: options.initCode ?? 'n = 200;',
      beat: options.beatCode ?? '',
      frame: options.frameCode ?? '',
      point: options.pointCode ?? '',
    }

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Setup Ribbon Mesh (Instanced Quads)
    this.ribbonGeometry = createRibbonQuadGeometry(MAX_SEGMENTS)
    this.ribbonMaterial = createDuperscopeRibbonMaterial()
    this.ribbonMesh = new THREE.Mesh(this.ribbonGeometry, this.ribbonMaterial)
    this.scene.add(this.ribbonMesh)

    // Setup Points Mesh
    this.pointsGeometry = new THREE.BufferGeometry()
    this.pointsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.pointPositions, 3),
    )
    this.pointsGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.pointColors, 4),
    )
    this.pointsGeometry.setAttribute(
      'aSize',
      new THREE.BufferAttribute(this.pointSizes, 1),
    )
    this.pointsGeometry.setDrawRange(0, 0)
    this.pointsMaterial = createDuperscopePointsMaterial()
    this.pointsMesh = new THREE.Points(this.pointsGeometry, this.pointsMaterial)
    this.scene.add(this.pointsMesh)

    this.setOpacity(options.opacity ?? 1.0)
    this.compilationResult = this.recompileAll()
  }

  get hasErrors(): boolean {
    return this.compilationResult.hasErrors
  }

  get errorMessage(): string | undefined {
    if (!this.compilationResult.hasErrors) return undefined
    const firstPhase = this.compilationResult.firstErrorPhase
    return firstPhase ? this.compilationResult[firstPhase].error : undefined
  }

  get errorPhase(): DuperscopePhase | undefined {
    return this.compilationResult.firstErrorPhase
  }

  getActivePointCount(): number {
    return this.activePointCount
  }

  getActiveSegmentCount(): number {
    return this.activeSegmentCount
  }

  getScripts(): Readonly<DuperscopeScripts> {
    return this.scripts
  }

  /**
   * Updates one or more phase scripts and recompiles the program.
   *
   * @param partialScripts - Updated script code blocks.
   */
  setScripts(partialScripts: Partial<DuperscopeScripts>): void {
    if (partialScripts.init !== undefined) this.scripts.init = partialScripts.init
    if (partialScripts.beat !== undefined) this.scripts.beat = partialScripts.beat
    if (partialScripts.frame !== undefined) this.scripts.frame = partialScripts.frame
    if (partialScripts.point !== undefined) this.scripts.point = partialScripts.point

    this.compilationResult = this.recompileAll()
  }

  private recompileAll(): DuperscopeAllCompilationResult {
    const res = this.compiler.compileAll(this.scripts)
    if (!res.hasErrors) {
      this.runner.runInit(res.init)
    }
    return res
  }

  setDrawMode(mode: DuperscopeDrawMode): void {
    this.drawMode = mode
  }

  setAudioMode(mode: DuperscopeAudioMode): void {
    this.audioMode = mode
  }

  setChannel(channel: DuperscopeChannel): void {
    this.channel = channel
  }

  setOpacity(opacity: number | string): void {
    if (typeof opacity === 'number') {
      this.baseOpacity = opacity
      this.opacityParam = null
    } else if (typeof opacity === 'string') {
      this.opacityParam = createDynamicParam(opacity, this.expressionEngine)
    }
  }

  init(_renderer: RendererLike): void {
    // WebGL state and geometry are allocated on construction
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.ribbonMaterial.uniforms.uResolution.value.set(width, height)
    this.ribbonMaterial.uniforms.uAspect.value = width / (height || 1.0)
    this.ribbonMaterial.uniforms.uPixelRatio.value = pixelRatio

    this.pointsMaterial.uniforms.uAspect.value = width / (height || 1.0)
    this.pointsMaterial.uniforms.uPixelRatio.value = pixelRatio
  }

  update(context: FrameContext): void {
    // If bypassed or script error present, output a blank frame (0 instances / 0 points)
    if (this.bypassed || this.compilationResult.hasErrors) {
      this.activePointCount = 0
      this.activeSegmentCount = 0
      this.ribbonGeometry.instanceCount = 0
      this.pointsGeometry.setDrawRange(0, 0)
      return
    }

    // Evaluate opacity
    let currentOpacity = this.baseOpacity
    if (this.opacityParam) {
      currentOpacity = this.opacityParam.evaluate(context)
    }

    // Update shader uniforms
    this.ribbonMaterial.uniforms.uResolution.value.set(context.$WIDTH, context.$HEIGHT)
    this.ribbonMaterial.uniforms.uAspect.value = context.$ASPECT
    this.ribbonMaterial.uniforms.uPixelRatio.value = context.$PIXEL_RATIO
    this.ribbonMaterial.uniforms.uOpacity.value = currentOpacity

    this.pointsMaterial.uniforms.uAspect.value = context.$ASPECT
    this.pointsMaterial.uniforms.uPixelRatio.value = context.$PIXEL_RATIO
    this.pointsMaterial.uniforms.uOpacity.value = currentOpacity

    // Run execution phases (beat -> frame -> point loop)
    const { pointCount } = this.runner.runFrame(
      this.compilationResult.beat,
      this.compilationResult.frame,
      this.compilationResult.point,
      context,
      {
        audioMode: this.audioMode,
        channel: this.channel,
        positions: this.pointPositions,
        colors: this.pointColors,
        sizes: this.pointSizes,
      },
    )

    this.activePointCount = pointCount

    if (this.drawMode === 'points') {
      this.ribbonMesh.visible = false
      this.pointsMesh.visible = true
      this.activeSegmentCount = 0
      this.ribbonGeometry.instanceCount = 0

      const posAttr = this.pointsGeometry.attributes.position
      const colAttr = this.pointsGeometry.attributes.color
      const sizeAttr = this.pointsGeometry.attributes.aSize

      posAttr.needsUpdate = true
      colAttr.needsUpdate = true
      sizeAttr.needsUpdate = true
      this.pointsGeometry.setDrawRange(0, pointCount)
    } else {
      // 'lines' or 'lineLoop' mode
      this.pointsMesh.visible = false
      this.ribbonMesh.visible = true
      this.pointsGeometry.setDrawRange(0, 0)

      const isLoop = this.drawMode === 'lineLoop'
      const segmentCount = isLoop ? (pointCount >= 2 ? pointCount : 0) : Math.max(0, pointCount - 1)
      this.activeSegmentCount = segmentCount

      const startAttr = this.ribbonGeometry.attributes.instanceStart as THREE.InstancedBufferAttribute
      const endAttr = this.ribbonGeometry.attributes.instanceEnd as THREE.InstancedBufferAttribute
      const startColAttr = this.ribbonGeometry.attributes.instanceStartColor as THREE.InstancedBufferAttribute
      const endColAttr = this.ribbonGeometry.attributes.instanceEndColor as THREE.InstancedBufferAttribute
      const startSizeAttr = this.ribbonGeometry.attributes.instanceStartSize as THREE.InstancedBufferAttribute
      const endSizeAttr = this.ribbonGeometry.attributes.instanceEndSize as THREE.InstancedBufferAttribute

      const startArray = startAttr.array as Float32Array
      const endArray = endAttr.array as Float32Array
      const startColArray = startColAttr.array as Float32Array
      const endColArray = endColAttr.array as Float32Array
      const startSizeArray = startSizeAttr.array as Float32Array
      const endSizeArray = endSizeAttr.array as Float32Array

      for (let s = 0; s < segmentCount; s++) {
        const p1 = s
        const p2 = isLoop ? (s + 1) % pointCount : s + 1

        const p1Pos = p1 * 3
        const p2Pos = p2 * 3
        const sPos = s * 3

        startArray[sPos] = this.pointPositions[p1Pos]
        startArray[sPos + 1] = this.pointPositions[p1Pos + 1]
        startArray[sPos + 2] = this.pointPositions[p1Pos + 2]

        endArray[sPos] = this.pointPositions[p2Pos]
        endArray[sPos + 1] = this.pointPositions[p2Pos + 1]
        endArray[sPos + 2] = this.pointPositions[p2Pos + 2]

        const p1Col = p1 * 4
        const p2Col = p2 * 4
        const sCol = s * 4

        startColArray[sCol] = this.pointColors[p1Col]
        startColArray[sCol + 1] = this.pointColors[p1Col + 1]
        startColArray[sCol + 2] = this.pointColors[p1Col + 2]
        startColArray[sCol + 3] = this.pointColors[p1Col + 3]

        endColArray[sCol] = this.pointColors[p2Col]
        endColArray[sCol + 1] = this.pointColors[p2Col + 1]
        endColArray[sCol + 2] = this.pointColors[p2Col + 2]
        endColArray[sCol + 3] = this.pointColors[p2Col + 3]

        startSizeArray[s] = this.pointSizes[p1]
        endSizeArray[s] = this.pointSizes[p2]
      }

      startAttr.needsUpdate = true
      endAttr.needsUpdate = true
      startColAttr.needsUpdate = true
      endColAttr.needsUpdate = true
      startSizeAttr.needsUpdate = true
      endSizeAttr.needsUpdate = true

      this.ribbonGeometry.instanceCount = segmentCount
    }
  }

  render(renderer?: RendererLike): void {
    if (renderer) {
      renderer.render(this.scene, this.camera)
    }
  }

  dispose(): void {
    this.ribbonGeometry.dispose()
    this.ribbonMaterial.dispose()
    this.pointsGeometry.dispose()
    this.pointsMaterial.dispose()

    this.scene.remove(this.ribbonMesh)
    this.scene.remove(this.pointsMesh)
  }
}
