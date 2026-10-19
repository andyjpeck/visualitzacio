import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'
import { useAppStore } from './ui/store/app-store'

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

describe('App Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentFps: 60,
      targetFps: 60,
      showFpsOverlay: true,
      resolutionScale: 1.0,
      isPresetSettingsOpen: false,
    })
  })

  it('renders ViewportCanvas container and FpsBadge', () => {
    render(<App />)

    expect(screen.getByTestId('viewport-canvas-container')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Frame rate 60 FPS/i })).toBeInTheDocument()
  })
})
