import { vi } from 'vitest'
import type { RendererLike } from '../../contracts/renderer-like'

export function createMockRenderer(): RendererLike {
  const canvas = document.createElement('canvas')
  let currentTarget: unknown = null
  return {
    domElement: canvas,
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    setRenderTarget: vi.fn((target: unknown) => {
      currentTarget = target
    }),
    getRenderTarget: vi.fn(() => currentTarget),
    clear: vi.fn(),
    dispose: vi.fn(),
  }
}
