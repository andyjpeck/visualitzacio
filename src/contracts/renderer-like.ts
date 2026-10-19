import type { FrameContext } from './frame-context'

/**
 * Minimal abstraction over Three.js WebGLRenderer for dependency injection and testing.
 */
export interface RendererLike {
  domElement: HTMLCanvasElement
  autoClear?: boolean
  setSize(width: number, height: number, updateStyle?: boolean): void
  setPixelRatio(pixelRatio: number): void
  render(scene: unknown, camera: unknown): void
  setRenderTarget?(target: unknown): void
  getRenderTarget?(): unknown
  clear?(): void
  clearDepth?(): void
  dispose(): void
}

/**
 * Scheduler interface abstracting requestAnimationFrame / cancelAnimationFrame for headless unit tests.
 */
export interface Scheduler {
  now(): number
  requestFrame(callback: (timestamp: number) => void): number
  cancelFrame(handle: number): void
}

/**
 * Minimal node interface implemented by visual passes and components in the render pipeline.
 */
export interface VisualNode {
  init?(renderer: RendererLike, bufferPool?: unknown): void
  resize?(width: number, height: number, pixelRatio?: number, resolutionScale?: number): void
  update(ctx: FrameContext): void
  getChildren?(): readonly VisualNode[]
  dispose?(): void
}
