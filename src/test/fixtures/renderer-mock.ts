import { vi } from 'vitest'
import type { RendererLike } from '../../contracts/renderer-like'

export function createMockRenderer(): RendererLike {
  const canvas = document.createElement('canvas')
  return {
    domElement: canvas,
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  }
}
