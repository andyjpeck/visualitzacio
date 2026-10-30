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
    expect(screen.getByText(/Preset Performance/i)).toBeInTheDocument()
    expect(screen.getByText('30 FPS')).toBeInTheDocument()
    expect(screen.getByText('60 FPS')).toBeInTheDocument()
    expect(screen.getByText('120 FPS')).toBeInTheDocument()
    expect(screen.getByText('0.50x (Performance)')).toBeInTheDocument()

    // Verify redundant legacy global frame buffer & feedback section is removed
    expect(screen.queryByText(/Frame Buffer & Feedback/i)).not.toBeInTheDocument()
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

  it('allows customizing frequency band boundaries and resetting defaults', () => {
    render(<PresetSettingsModal />)

    const bassMaxInput = screen.getByLabelText('Bass maximum frequency')
    fireEvent.change(bassMaxInput, { target: { value: '300' } })

    expect(useAppStore.getState().audioBands.bassMax).toBe(300)
    expect(useAppStore.getState().audioBands.midMin).toBe(300)

    // Reset defaults button restores 250 Hz
    const resetBtn = screen.getByText('Reset Defaults')
    fireEvent.click(resetBtn)

    expect(useAppStore.getState().audioBands.bassMax).toBe(250)
    expect(useAppStore.getState().audioBands.midMin).toBe(250)
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

  it('allows dragging the dialog by its header', () => {
    render(<PresetSettingsModal />)
    const header = screen.getByTestId('preset-settings-header')
    const dialog = screen.getByRole('dialog')

    expect(dialog).toHaveStyle({ position: 'fixed' })
    const initialLeft = parseInt(dialog.style.left, 10)
    const initialTop = parseInt(dialog.style.top, 10)

    fireEvent.pointerDown(header, { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(header, { clientX: 180, clientY: 150, pointerId: 1 })
    fireEvent.pointerUp(header, { pointerId: 1 })

    const newLeft = parseInt(dialog.style.left, 10)
    const newTop = parseInt(dialog.style.top, 10)

    expect(newLeft).toBe(initialLeft + 80)
    expect(newTop).toBe(initialTop + 50)
  })
})
