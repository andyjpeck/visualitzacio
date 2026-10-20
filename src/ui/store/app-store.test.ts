import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './app-store'

describe('useAppStore (Zustand State Plane)', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    useAppStore.setState({
      isPlaying: false,
      sourceType: 'sample',
      volume: 0.8,
      audioError: null,
      showFpsOverlay: true,
      isPresetSettingsOpen: false,
      currentFps: 60,
      targetFps: 60,
      resolutionScale: 1.0,
    })
  })

  it('toggles playback and switches audio sources', () => {
    const store = useAppStore.getState()
    expect(store.isPlaying).toBe(false)

    store.togglePlay()
    expect(useAppStore.getState().isPlaying).toBe(true)

    store.setSourceType('mic')
    expect(useAppStore.getState().sourceType).toBe('mic')
  })

  it('toggles FPS overlay and preset settings modal', () => {
    const store = useAppStore.getState()
    expect(store.showFpsOverlay).toBe(true)
    expect(store.isPresetSettingsOpen).toBe(false)

    store.toggleFpsOverlay()
    expect(useAppStore.getState().showFpsOverlay).toBe(false)

    store.togglePresetSettings()
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(true)
  })

  it('updates preset performance settings', () => {
    const store = useAppStore.getState()
    store.setTargetFps(30)
    store.setResolutionScale(0.5)

    expect(useAppStore.getState().targetFps).toBe(30)
    expect(useAppStore.getState().resolutionScale).toBe(0.5)
  })

  it('updates audio frequency bands and resets to default values', () => {
    const store = useAppStore.getState()
    expect(store.audioBands.bassMax).toBe(250)

    store.setAudioBands({ bassMax: 350, midMin: 350 })
    expect(useAppStore.getState().audioBands.bassMax).toBe(350)
    expect(useAppStore.getState().audioBands.midMin).toBe(350)

    store.resetAudioBands()
    expect(useAppStore.getState().audioBands.bassMax).toBe(250)
  })

  it('toggles formula presets and reference collapsed state', () => {
    const store = useAppStore.getState()
    expect(store.isFormulaPresetsOpen).toBe(true)
    expect(store.isFormulaReferenceOpen).toBe(true)

    store.toggleFormulaPresets()
    expect(useAppStore.getState().isFormulaPresetsOpen).toBe(false)

    store.toggleFormulaReference()
    expect(useAppStore.getState().isFormulaReferenceOpen).toBe(false)
  })

  it('tracks audio loading state and progress stage updates', () => {
    const store = useAppStore.getState()
    expect(store.isAudioLoading).toBe(false)
    expect(store.audioLoadingProgress).toBe(0)

    store.setIsAudioLoading(true, 10, 'Reading file...')
    expect(useAppStore.getState().isAudioLoading).toBe(true)
    expect(useAppStore.getState().audioLoadingProgress).toBe(10)
    expect(useAppStore.getState().audioLoadingStage).toBe('Reading file...')

    store.setAudioLoadingProgress(60, 'Decoding audio...')
    expect(useAppStore.getState().audioLoadingProgress).toBe(60)
    expect(useAppStore.getState().audioLoadingStage).toBe('Decoding audio...')

    store.setIsAudioLoading(false)
    expect(useAppStore.getState().isAudioLoading).toBe(false)
  })

  it('enforces single open dialog mutual exclusion', () => {
    const store = useAppStore.getState()

    // 1. Open preset settings -> only preset settings should be open
    store.setIsPresetSettingsOpen(true)
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(true)
    expect(useAppStore.getState().isFormulaTestbedOpen).toBe(false)
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(false)

    // 2. Open formula testbed -> preset settings automatically closes
    store.setIsFormulaTestbedOpen(true)
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(false)
    expect(useAppStore.getState().isFormulaTestbedOpen).toBe(true)
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(false)

    // 3. Open template selector -> formula testbed automatically closes
    store.setIsTemplateSelectorOpen(true)
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(false)
    expect(useAppStore.getState().isFormulaTestbedOpen).toBe(false)
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(true)
  })

  it('maintains a history of opened dialogs and reopens the previous dialog when the active dialog closes', () => {
    const store = useAppStore.getState()
    store.closeAllDialogs()
    expect(useAppStore.getState().dialogStack).toEqual([])

    // User opens Preset Settings (dialog 1)
    store.openDialog('preset-settings')
    expect(useAppStore.getState().dialogStack).toEqual(['preset-settings'])
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(true)
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(false)

    // From Preset Settings, user opens Frame Buffer Templates (dialog 2)
    store.openDialog('template-selector')
    expect(useAppStore.getState().dialogStack).toEqual(['preset-settings', 'template-selector'])
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(true)
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(false) // Only 1 active at a time!

    // User closes the 2nd dialog (Template Selector) -> 1st dialog (Preset Settings) automatically reopens
    store.closeDialog('template-selector')
    expect(useAppStore.getState().dialogStack).toEqual(['preset-settings'])
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(true)
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(false)

    // Closing the 1st dialog empties the stack
    store.closeDialog('preset-settings')
    expect(useAppStore.getState().dialogStack).toEqual([])
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(false)
    expect(useAppStore.getState().isFormulaTestbedOpen).toBe(false)
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(false)
  })

  it('supports closeAllDialogs to completely clear dialog history', () => {
    const store = useAppStore.getState()
    store.openDialog('preset-settings')
    store.openDialog('template-selector')
    expect(useAppStore.getState().dialogStack).toHaveLength(2)

    store.closeAllDialogs()
    expect(useAppStore.getState().dialogStack).toEqual([])
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(false)
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(false)
    expect(useAppStore.getState().isFormulaTestbedOpen).toBe(false)
  })

  it('manages studio mode switching and persistence', () => {
    const store = useAppStore.getState()
    expect(store.studioMode).toBe('editor')

    store.setStudioMode('live')
    expect(useAppStore.getState().studioMode).toBe('live')

    store.toggleStudioMode()
    expect(useAppStore.getState().studioMode).toBe('editor')

    store.toggleStudioMode()
    expect(useAppStore.getState().studioMode).toBe('live')
  })

  it('manages studio split ratios and reset functionality', () => {
    const store = useAppStore.getState()
    expect(store.studioSplitRatios).toEqual([0.35, 0.4, 0.25])

    store.setStudioSplitRatios([0.5, 0.3, 0.2])
    expect(useAppStore.getState().studioSplitRatios).toEqual([0.5, 0.3, 0.2])

    store.resetStudioSplitRatios()
    expect(useAppStore.getState().studioSplitRatios).toEqual([0.35, 0.4, 0.25])
  })
})
