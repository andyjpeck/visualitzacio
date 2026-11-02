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
      showDebugData: true,
      isPresetSettingsOpen: false,
    })

    mockAudioManager = {
      playSample: vi.fn(),
      pauseSample: vi.fn(),
      enableMicrophone: vi.fn().mockResolvedValue(true),
      disableMicrophone: vi.fn(),
      loadAudioFile: vi.fn().mockResolvedValue('test.mp3'),
      playCustomFile: vi.fn(),
      pauseCustomFile: vi.fn(),
      hasCustomFile: vi.fn().mockReturnValue(false),
      getCustomFileName: vi.fn().mockReturnValue(null),
      getCurrentTime: vi.fn().mockReturnValue(0),
      getDuration: vi.fn().mockReturnValue(0),
      seek: vi.fn(),
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

  it('toggles debug data overlay visibility (FPS tracker and audio telemetry)', () => {
    render(<Toolbar audioManager={mockAudioManager} />)

    const debugToggleButton = screen.getByRole('button', { name: /toggle debug data/i })
    expect(debugToggleButton).toHaveAttribute('title', 'Hide Debug Data')

    fireEvent.click(debugToggleButton)

    expect(useAppStore.getState().showDebugData).toBe(false)
    expect(useAppStore.getState().showFpsOverlay).toBe(false)
    expect(debugToggleButton).toHaveAttribute('title', 'Show Debug Data')
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

  it('loads and plays custom audio file when selected', async () => {
    mockAudioManager.loadAudioFile = vi.fn().mockResolvedValue('retro-wave.mp3')
    mockAudioManager.playCustomFile = vi.fn().mockResolvedValue(undefined)
    mockAudioManager.pauseCustomFile = vi.fn()
    mockAudioManager.hasCustomFile = vi.fn().mockReturnValue(true)

    render(<Toolbar audioManager={mockAudioManager} />)

    const fileButton = screen.getByRole('button', { name: /use local audio file/i })
    expect(fileButton).toBeInTheDocument()

    const fileInput = screen.getByTestId('audio-file-input')
    const testFile = new File(['audio'], 'retro-wave.mp3', { type: 'audio/mp3' })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [testFile] } })
    })

    expect(mockAudioManager.loadAudioFile).toHaveBeenCalledWith(testFile, expect.any(Function))
    expect(useAppStore.getState().audioFileName).toBe('retro-wave.mp3')
    expect(useAppStore.getState().sourceType).toBe('file')

    // Now clicking Play plays the custom file
    const playButton = screen.getByRole('button', { name: /^play$/i })
    await act(async () => {
      fireEvent.click(playButton)
    })

    expect(mockAudioManager.playCustomFile).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().isPlaying).toBe(true)
  })

  it('renders source toggle buttons in order: Sample -> File -> Mic', () => {
    render(<Toolbar audioManager={mockAudioManager} />)
    const sampleBtn = screen.getByRole('button', { name: /use sample player/i })
    const fileBtn = screen.getByRole('button', { name: /use local audio file/i })
    const micBtn = screen.getByRole('button', { name: /use microphone/i })

    // Verify DOM order
    expect(sampleBtn.compareDocumentPosition(fileBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(fileBtn.compareDocumentPosition(micBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('displays progress bar when file is loaded and allows seeking', async () => {
    mockAudioManager.hasCustomFile = vi.fn().mockReturnValue(true)
    mockAudioManager.getDuration = vi.fn().mockReturnValue(180)
    mockAudioManager.getCurrentTime = vi.fn().mockReturnValue(30)
    mockAudioManager.seek = vi.fn()

    useAppStore.setState({ sourceType: 'file', audioFileName: 'track.mp3' })

    render(<Toolbar audioManager={mockAudioManager} />)

    const progressBar = screen.getByTestId('audio-progress-bar')
    expect(progressBar).toBeInTheDocument()

    const slider = screen.getByLabelText(/track progress slider/i)
    fireEvent.change(slider, { target: { value: '60' } })

    expect(mockAudioManager.seek).toHaveBeenCalledWith(60)
  })

  it('displays audio loading progress bar and stage message when audio file is loading', () => {
    useAppStore.setState({
      isAudioLoading: true,
      audioLoadingProgress: 45,
      audioLoadingStage: 'Decoding audio buffer...',
    })

    render(<Toolbar audioManager={mockAudioManager} />)

    const indicator = screen.getByTestId('audio-loading-indicator')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveAttribute('aria-valuenow', '45')
    expect(screen.getByText('Decoding audio buffer...')).toBeInTheDocument()
    expect(screen.getAllByText('45%').length).toBeGreaterThanOrEqual(1)
  })

  it('toggles studio and live performance mode on mode button click', () => {
    useAppStore.setState({ studioMode: 'editor' })
    render(<Toolbar audioManager={mockAudioManager} />)

    const modeBtn = screen.getByLabelText('Enter Live Performance Mode')
    expect(modeBtn).toBeInTheDocument()

    fireEvent.click(modeBtn)
    expect(useAppStore.getState().studioMode).toBe('live')
  })

  it('scales to fit available horizontal space and shifts row when parent is narrow', () => {
    const parentDiv = document.createElement('div')
    Object.defineProperty(parentDiv, 'clientWidth', { value: 400, configurable: true })
    document.body.appendChild(parentDiv)

    render(<Toolbar audioManager={mockAudioManager} />, { container: parentDiv })

    const toolbarHeader = screen.getByTestId('playback-toolbar')
    expect(toolbarHeader).toBeInTheDocument()

    // Mock natural layout width
    Object.defineProperty(toolbarHeader, 'offsetWidth', { value: 600, configurable: true })
    fireEvent(window, new Event('resize'))

    // When narrow with FPS overlay, shifts to top-14 to avoid overlapping FPS badge and scales
    expect(toolbarHeader.className).toContain('top-14')
    expect(toolbarHeader.style.transform).toContain('scale(')

    document.body.removeChild(parentDiv)
  })

  it('renders tactile Undo and Redo buttons reflecting canUndo and canRedo state', () => {
    const undoMock = vi.fn()
    const redoMock = vi.fn()
    useAppStore.setState({
      canUndo: false,
      canRedo: false,
      undo: undoMock,
      redo: redoMock,
    })

    const { rerender } = render(<Toolbar audioManager={mockAudioManager} />)

    const undoBtn = screen.getByTestId('toolbar-undo-btn')
    const redoBtn = screen.getByTestId('toolbar-redo-btn')

    expect(undoBtn).toBeInTheDocument()
    expect(redoBtn).toBeInTheDocument()
    expect(undoBtn).toBeDisabled()
    expect(redoBtn).toBeDisabled()

    // Enable undo
    act(() => {
      useAppStore.setState({ canUndo: true })
    })
    rerender(<Toolbar audioManager={mockAudioManager} />)
    expect(undoBtn).not.toBeDisabled()
    fireEvent.click(undoBtn)
    expect(undoMock).toHaveBeenCalledTimes(1)

    // Enable redo
    act(() => {
      useAppStore.setState({ canRedo: true })
    })
    rerender(<Toolbar audioManager={mockAudioManager} />)
    expect(redoBtn).not.toBeDisabled()
    fireEvent.click(redoBtn)
    expect(redoMock).toHaveBeenCalledTimes(1)
  })

  it('renders the preset selector dropdown within the toolbar', () => {
    render(<Toolbar audioManager={mockAudioManager} />)
    const presetSelector = screen.getByTestId('toolbar-preset-selector')
    expect(presetSelector).toBeInTheDocument()
  })

  it('organizes controls into cohesive semantic clusters with flex-wrap and right justification', () => {
    render(<Toolbar audioManager={mockAudioManager} />)
    const toolbarHeader = screen.getByTestId('playback-toolbar')

    // Container must support multi-row flex-wrapping and right alignment
    expect(toolbarHeader.className).toContain('flex-wrap')
    expect(toolbarHeader.className).toContain('justify-end')

    // Verify cohesive semantic clusters exist to prevent individual control fracturing
    const playbackCluster = screen.getByTestId('playback-source-cluster')
    const presetCluster = screen.getByTestId('preset-scrubber-cluster')
    const actionsCluster = screen.getByTestId('action-tools-cluster')

    expect(playbackCluster).toBeInTheDocument()
    expect(presetCluster).toBeInTheDocument()
    expect(actionsCluster).toBeInTheDocument()

    // Playback cluster must contain Play button and Source buttons
    expect(playbackCluster).toContainElement(screen.getByRole('button', { name: /^play$/i }))
    expect(playbackCluster).toContainElement(screen.getByRole('button', { name: /use sample player/i }))

    // Preset cluster must contain PresetSelector
    expect(presetCluster).toContainElement(screen.getByTestId('toolbar-preset-selector'))

    // Actions cluster must contain right-side action buttons
    expect(actionsCluster).toContainElement(screen.getByTestId('toolbar-undo-btn'))
    expect(actionsCluster).toContainElement(screen.getByTestId('toolbar-redo-btn'))
    expect(actionsCluster).toContainElement(screen.getByTestId('toolbar-debug-data-btn'))
    expect(actionsCluster).toContainElement(screen.getByRole('button', { name: /open preset settings/i }))
  })

  it('keeps all right-side buttons accessible and within preview bounds down to 320px', () => {
    const parentDiv = document.createElement('div')
    Object.defineProperty(parentDiv, 'clientWidth', { value: 320, configurable: true })
    document.body.appendChild(parentDiv)

    render(<Toolbar audioManager={mockAudioManager} />, { container: parentDiv })
    const toolbarHeader = screen.getByTestId('playback-toolbar')
    expect(toolbarHeader).toBeInTheDocument()

    // Trigger responsive update
    fireEvent(window, new Event('resize'))

    // All right-side buttons must remain rendered and reachable
    const undoBtn = screen.getByTestId('toolbar-undo-btn')
    const redoBtn = screen.getByTestId('toolbar-redo-btn')
    const debugBtn = screen.getByTestId('toolbar-debug-data-btn')
    const settingsBtn = screen.getByRole('button', { name: /open preset settings/i })
    const studioBtn = screen.getByRole('button', { name: /(enter|exit) live performance mode/i })

    expect(undoBtn).toBeInTheDocument()
    expect(redoBtn).toBeInTheDocument()
    expect(debugBtn).toBeInTheDocument()
    expect(settingsBtn).toBeInTheDocument()
    expect(studioBtn).toBeInTheDocument()

    // Container wraps and scales appropriately
    expect(toolbarHeader.className).toContain('flex-wrap')

    document.body.removeChild(parentDiv)
  })
})
