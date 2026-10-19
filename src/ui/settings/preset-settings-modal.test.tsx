import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../store/app-store'
import { PresetSettingsModal } from './preset-settings-modal'

describe('PresetSettingsModal', () => {
  beforeEach(() => {
    useAppStore.setState({
      isPresetSettingsOpen: true,
      targetFps: 60,
      resolutionScale: 1.0,
    })
  })

  it('renders target FPS and resolution scale options when open', () => {
    render(<PresetSettingsModal />)
    expect(screen.getByText('Preset Performance Settings')).toBeInTheDocument()
    expect(screen.getByText('30 FPS')).toBeInTheDocument()
    expect(screen.getByText('60 FPS')).toBeInTheDocument()
    expect(screen.getByText('120 FPS')).toBeInTheDocument()
    expect(screen.getByText('0.50x (Performance)')).toBeInTheDocument()
  })

  it('updates targetFps when a frame rate button is clicked', () => {
    render(<PresetSettingsModal />)
    const button30 = screen.getByText('30 FPS')
    fireEvent.click(button30)
    expect(useAppStore.getState().targetFps).toBe(30)
  })

  it('updates resolutionScale when a resolution option is clicked', () => {
    render(<PresetSettingsModal />)
    const button05 = screen.getByText('0.50x (Performance)')
    fireEvent.click(button05)
    expect(useAppStore.getState().resolutionScale).toBe(0.5)
  })

  it('closes when close button is clicked', () => {
    render(<PresetSettingsModal />)
    const closeBtn = screen.getByLabelText('Close settings')
    fireEvent.click(closeBtn)
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(false)
  })

  it('closes on Escape key press', () => {
    render(<PresetSettingsModal />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(false)
  })

  it('renders nothing when closed', () => {
    useAppStore.setState({ isPresetSettingsOpen: false })
    const { container } = render(<PresetSettingsModal />)
    expect(container.firstChild).toBeNull()
  })
})
