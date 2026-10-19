import * as THREE from 'three'
import {
  createDefaultFrameContext,
  type FrameContext,
} from '../contracts/frame-context'
import {
  DEFAULT_PRESET_SETTINGS,
  type PresetSettings,
} from '../contracts/preset-settings'
import type {
  RendererLike,
  Scheduler,
  VisualNode,
} from '../contracts/renderer-like'

export interface RenderEngineOptions {
  canvas?: HTMLCanvasElement
  renderer?: RendererLike
  scheduler?: Scheduler
  presetSettings?: PresetSettings
  onFpsUpdate?: (fps: number) => void
  onBeforeUpdate?: (frameContext: FrameContext, timestamp: number) => void
}

export class RenderEngine {
  private readonly renderer: RendererLike
  private readonly scheduler: Scheduler
  private readonly frameContext: FrameContext = createDefaultFrameContext()
  private readonly nodes: VisualNode[] = []

  private presetSettings: PresetSettings
  private onFpsUpdate?: (fps: number) => void
  private onBeforeUpdate?: (frameContext: FrameContext, timestamp: number) => void

  private animationFrameId: number | null = null
  private running = false
  private lastTimestamp = 0
  private lastFpsTimestamp = 0
  private fpsFrameCount = 0

  private width = 1920
  private height = 1080
  private pixelRatio = 1.0

  constructor(options: RenderEngineOptions = {}) {
    this.presetSettings = options.presetSettings ?? {
      ...DEFAULT_PRESET_SETTINGS,
    }
    this.onFpsUpdate = options.onFpsUpdate
    this.onBeforeUpdate = options.onBeforeUpdate

    // Default scheduler for browser environment
    this.scheduler = options.scheduler ?? {
      now: () => performance.now(),
      requestFrame: (cb) => requestAnimationFrame(cb),
      cancelFrame: (handle) => cancelAnimationFrame(handle),
    }

    // Use injected renderer or initialize Three.js WebGLRenderer
    if (options.renderer) {
      this.renderer = options.renderer
    } else {
      const canvas = options.canvas ?? document.createElement('canvas')
      const webglRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
      this.renderer = webglRenderer
    }

    this.setupContextListeners()
  }

  private setupContextListeners(): void {
    const canvas = this.renderer.domElement
    if (canvas && typeof canvas.addEventListener === 'function') {
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault()
        this.stop()
      })
      canvas.addEventListener('webglcontextrestored', () => {
        this.resize(this.width, this.height, this.pixelRatio)
        this.start()
      })
    }
  }

  getFrameContext(): FrameContext {
    return this.frameContext
  }

  getRenderer(): RendererLike {
    return this.renderer
  }

  isRunning(): boolean {
    return this.running
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTimestamp = this.scheduler.now()
    this.lastFpsTimestamp = this.lastTimestamp
    this.fpsFrameCount = 0

    const tick = (timestamp: number) => {
      if (!this.running) return
      this.renderFrame(timestamp)
      this.animationFrameId = this.scheduler.requestFrame(tick)
    }

    this.animationFrameId = this.scheduler.requestFrame(tick)
  }

  stop(): void {
    this.running = false
    if (this.animationFrameId !== null) {
      this.scheduler.cancelFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  setPresetSettings(settings: Partial<PresetSettings>): void {
    this.presetSettings = {
      ...this.presetSettings,
      ...settings,
    }
    this.applySize()
  }

  setBeforeUpdate(cb?: (frameContext: FrameContext, timestamp: number) => void): void {
    this.onBeforeUpdate = cb
  }

  addNode(node: VisualNode): void {
    this.nodes.push(node)
    if (node.init) {
      node.init(this.renderer)
    }
    if (node.resize) {
      node.resize(this.width, this.height, this.pixelRatio)
    }
  }

  removeNode(node: VisualNode): void {
    const index = this.nodes.indexOf(node)
    if (index !== -1) {
      this.nodes.splice(index, 1)
      if (node.dispose) {
        node.dispose()
      }
    }
  }

  resize(width: number, height: number, pixelRatio = 1.0): void {
    this.width = width
    this.height = height
    this.pixelRatio = Math.min(pixelRatio, 2.0) // Clamp DPR <= 2

    this.frameContext.$WIDTH = width
    this.frameContext.$HEIGHT = height
    this.frameContext.$ASPECT = width / (height || 1)
    this.frameContext.$PIXEL_RATIO = this.pixelRatio

    this.applySize()

    for (const node of this.nodes) {
      if (node.resize) {
        node.resize(width, height, this.pixelRatio)
      }
    }
  }

  private applySize(): void {
    const scale = this.presetSettings.resolution_scale
    const internalWidth = Math.floor(this.width * scale)
    const internalHeight = Math.floor(this.height * scale)

    this.renderer.setSize(internalWidth, internalHeight, false)
    this.renderer.setPixelRatio(this.pixelRatio)
  }

  private renderFrame(timestamp: number): void {
    // Delta time calculation
    const rawDt = (timestamp - this.lastTimestamp) / 1000.0
    this.lastTimestamp = timestamp

    // Clamp $DT to 0.1s max (avoids physics/animation jumps on stalls)
    const dt = Math.min(Math.max(rawDt, 0.0), 0.1)

    // Target FPS pacing: check if elapsed time satisfies target interval
    const targetInterval = 1.0 / this.presetSettings.target_fps
    // If running much faster than target_fps (e.g. 144Hz monitor with target_fps 30), allow pacing
    if (rawDt > 0 && rawDt < targetInterval * 0.75 && this.frameContext.$FRAME > 0) {
      return
    }

    // Mutate FrameContext in-place
    this.frameContext.$FRAME++
    this.frameContext.$DT = dt
    this.frameContext.$TIME += dt

    if (this.onBeforeUpdate) {
      this.onBeforeUpdate(this.frameContext, timestamp)
    }

    // Update nodes
    for (const node of this.nodes) {
      node.update(this.frameContext)
    }

    // Measure FPS with throttled callback (~250ms)
    this.fpsFrameCount++
    const elapsedSinceFps = timestamp - this.lastFpsTimestamp
    if (elapsedSinceFps >= 250) {
      const measuredFps = (this.fpsFrameCount / elapsedSinceFps) * 1000.0
      this.frameContext.$FPS = measuredFps
      if (this.onFpsUpdate) {
        this.onFpsUpdate(measuredFps)
      }
      this.lastFpsTimestamp = timestamp
      this.fpsFrameCount = 0
    }
  }

  dispose(): void {
    this.stop()
    for (const node of this.nodes) {
      if (node.dispose) {
        node.dispose()
      }
    }
    this.nodes.length = 0
    this.renderer.dispose()
  }
}
