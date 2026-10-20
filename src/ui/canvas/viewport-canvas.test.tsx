import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ViewportCanvas } from './viewport-canvas'
import { useAppStore } from '../store/app-store'
import { TestVisualNode } from '../../engine/visual-node'
import type { RenderEngine } from '../../engine/render-engine'

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

  it('synchronizes graphNodes parameter changes to engine nodes in real time', () => {
    let capturedEngine: RenderEngine | null = null
    const { unmount } = render(
      <ViewportCanvas
        onEngineReady={(engine) => {
          capturedEngine = engine
        }}
      />,
    )

    expect(capturedEngine).not.toBeNull()
    const allNodes = capturedEngine!.getAllNodes()
    const testVisual = allNodes.find((n) => n instanceof TestVisualNode) as TestVisualNode
    expect(testVisual).toBeDefined()
    expect(testVisual.getShape()).toBe('Crystal')

    // Change shape to 'Cube' in graphNodes store
    act(() => {
      useAppStore.getState().updateGraphNodeData('test-visual-1', {
        shape: 'Cube',
        scale: 2.5,
      })
    })

    expect(testVisual.getShape()).toBe('Cube')

    unmount()
  })
})
