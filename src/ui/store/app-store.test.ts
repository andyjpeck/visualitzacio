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
})
