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

    // 4. Toggle preset settings open -> template selector closes
    store.togglePresetSettings()
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(true)
    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(false)
  })
})
