import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Toolbar } from './toolbar'
import { useAppStore } from '../store/app-store'
import type { AudioManager } from '../../audio/audio-manager'

describe('Toolbar Component', () => {
  let mockAudioManager: AudioManager

  beforeEach(() => {
    useAppStore.setState({
      isPlaying: false,
      sourceType: 'sample',
      volume: 0.8,
      audioError: null,
      showFpsOverlay: true,
      isPresetSettingsOpen: false,
    })

    mockAudioManager = {
      playSample: vi.fn(),
      pauseSample: vi.fn(),
      enableMicrophone: vi.fn().mockResolvedValue(true),
      disableMicrophone: vi.fn(),
      setVolume: vi.fn(),
      getLastError: vi.fn().mockReturnValue(null),
    } as unknown as AudioManager
  })

  it('renders Play button when not playing, and pauses on click when playing', async () => {
    const { rerender } = render(<Toolbar audioManager={mockAudioManager} />)

    const playButton = screen.getByRole('button', { name: /^play$/i })
    expect(playButton).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(playButton)
    })
    expect(mockAudioManager.playSample).toHaveBeenCalledTimes(1)

    // Switch to playing state
    useAppStore.setState({ isPlaying: true })
    rerender(<Toolbar audioManager={mockAudioManager} />)

    const pauseButton = screen.getByRole('button', { name: /^pause$/i })
    expect(pauseButton).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(pauseButton)
    })
    expect(mockAudioManager.pauseSample).toHaveBeenCalledTimes(1)
  })

  it('switches between Sample and Microphone source', async () => {
    render(<Toolbar audioManager={mockAudioManager} />)

    const micButton = screen.getByRole('button', { name: /use microphone/i })
    await act(async () => {
      fireEvent.click(micButton)
    })

    expect(mockAudioManager.enableMicrophone).toHaveBeenCalledTimes(1)
  })

  it('displays audio error banner when microphone permission is denied', async () => {
    ;(mockAudioManager.enableMicrophone as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false)
    ;(mockAudioManager.getLastError as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Microphone permission denied')

    render(<Toolbar audioManager={mockAudioManager} />)

    const micButton = screen.getByRole('button', { name: /use microphone/i })
    await act(async () => {
      fireEvent.click(micButton)
    })

    expect(await screen.findByText(/Microphone permission denied/i)).toBeInTheDocument()
  })

  it('toggles FPS badge overlay visibility', () => {
    render(<Toolbar audioManager={mockAudioManager} />)

    const fpsToggleButton = screen.getByRole('button', { name: /toggle fps/i })
    fireEvent.click(fpsToggleButton)

    expect(useAppStore.getState().showFpsOverlay).toBe(false)
  })

  it('opens Preset Performance Settings modal on gear click', () => {
    render(<Toolbar audioManager={mockAudioManager} />)

    const settingsButton = screen.getByRole('button', { name: /open preset settings/i })
    fireEvent.click(settingsButton)

    expect(useAppStore.getState().isPresetSettingsOpen).toBe(true)
  })

  it('stops sample playback when switching to mic and disables play button while mic is active', async () => {
    useAppStore.setState({ isPlaying: true, sourceType: 'sample' })
    const { rerender } = render(<Toolbar audioManager={mockAudioManager} />)

    const micButton = screen.getByRole('button', { name: /use microphone/i })
    await act(async () => {
      fireEvent.click(micButton)
    })

    expect(mockAudioManager.pauseSample).toHaveBeenCalledTimes(1)
    expect(mockAudioManager.enableMicrophone).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().sourceType).toBe('mic')

    rerender(<Toolbar audioManager={mockAudioManager} />)
    const playButton = screen.getByRole('button', { name: /^play$/i })
    expect(playButton).toBeDisabled()
  })
})
