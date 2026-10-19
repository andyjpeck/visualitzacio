import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ViewportCanvas } from './viewport-canvas'

// Mock Three.js WebGLRenderer for jsdom
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    })),
  }
})

describe('ViewportCanvas', () => {
  it('mounts canvas container into DOM and initializes RenderEngine', () => {
    const onEngineReady = vi.fn()
    const { unmount } = render(<ViewportCanvas onEngineReady={onEngineReady} />)

    const container = screen.getByTestId('viewport-canvas-container')
    expect(container).toBeInTheDocument()
    expect(onEngineReady).toHaveBeenCalledTimes(1)

    // Unmount cleans up engine
    unmount()
    expect(container.children.length).toBe(0)
  })
})
