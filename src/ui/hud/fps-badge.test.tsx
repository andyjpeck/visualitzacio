import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../store/app-store'
import { FpsBadge } from './fps-badge'

describe('FpsBadge (HUD)', () => {
  beforeEach(() => {
    useAppStore.setState({
      showFpsOverlay: true,
      showDebugData: true,
      currentFps: 60,
      targetFps: 60,
      isPresetSettingsOpen: false,
    })
  })

  it('renders nominal cyan state when currentFps >= targetFps', () => {
    render(<FpsBadge />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button.textContent).toContain('60 FPS')
    expect(button.className).toContain('text-cyber-cyan')
  })

  it('shifts to amber as soon as currentFps < targetFps', () => {
    useAppStore.setState({ currentFps: 58, targetFps: 60 })
    render(<FpsBadge />)
    const button = screen.getByRole('button')
    expect(button.textContent).toContain('58 FPS')
    expect(button.className).toContain('text-cyber-amber')
  })

  it('shifts to crimson red when currentFps drops below 50% of targetFps', () => {
    useAppStore.setState({ currentFps: 25, targetFps: 60 })
    render(<FpsBadge />)
    const button = screen.getByRole('button')
    expect(button.textContent).toContain('25 FPS')
    expect(button.className).toContain('text-cyber-crimson')
  })

  it('opens preset settings modal when clicked', () => {
    render(<FpsBadge />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(true)
  })

  it('renders nothing when showFpsOverlay or showDebugData is false', () => {
    useAppStore.setState({ showFpsOverlay: false, showDebugData: false })
    const { container } = render(<FpsBadge />)
    expect(container.firstChild).toBeNull()
  })
})
