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
      showDebugData: true,
      resolutionScale: 1.0,
      isPresetSettingsOpen: false,
    })
  })

  it('renders ViewportCanvas container and FpsBadge', () => {
    render(<App />)

    expect(screen.getByTestId('viewport-canvas-container')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Frame rate 60 FPS/i })).toBeInTheDocument()
  }, 15000)

  it('renders StudioSplitView with node graph and inspector in editor mode', () => {
    useAppStore.setState({ studioMode: 'editor' })
    render(<App />)

    expect(screen.getByTestId('studio-split-view')).toBeInTheDocument()
    expect(screen.getByTestId('studio-graph-container')).toBeInTheDocument()
    expect(screen.getByTestId('studio-inspector-container')).toBeInTheDocument()
  }, 15000)

  it('collapses node graph and inspector panes in live performance mode', () => {
    useAppStore.setState({ studioMode: 'live' })
    render(<App />)

    expect(screen.getByTestId('studio-split-view')).toBeInTheDocument()
    expect(screen.queryByTestId('studio-graph-container')).not.toBeInTheDocument()
    expect(screen.queryByTestId('studio-inspector-container')).not.toBeInTheDocument()
  }, 15000)
})
