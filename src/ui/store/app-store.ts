import { create } from 'zustand'
import {
  DEFAULT_AUDIO_BANDS,
  type AudioBandsSettings,
  type ResolutionScale,
} from '../../contracts/preset-settings'

export type AudioSourceType = 'sample' | 'mic' | 'file'

export const STORAGE_KEY_FORMULA_PRESETS_OPEN = 'visualitzacio_formula_presets_open'
export const STORAGE_KEY_FORMULA_REFERENCE_OPEN = 'visualitzacio_formula_reference_open'

function loadBoolFromStorage(key: string, defaultValue: boolean): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) {
        return stored === 'true'
      }
    }
  } catch {
    // localStorage may be restricted or unavailable
  }
  return defaultValue
}

function saveBoolToStorage(key: string, value: boolean): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, String(value))
    }
  } catch {
    // ignore
  }
}

export interface AppState {
  // Audio state (<10 Hz user actions)
  isPlaying: boolean
  sourceType: AudioSourceType
  volume: number
  audioError: string | null
  audioFileName: string | null

  // HUD & UI overlay state
  showFpsOverlay: boolean
  isPresetSettingsOpen: boolean
  currentFps: number

  // Preset-wide performance & DSP settings
  targetFps: number
  resolutionScale: ResolutionScale
  audioBands: AudioBandsSettings

  // Formula Testbed HUD state
  isFormulaTestbedOpen: boolean
  activeFormula: string
  bindFormulaToScene: boolean
  isFormulaPresetsOpen: boolean
  isFormulaReferenceOpen: boolean

  // Actions
  setIsPlaying: (isPlaying: boolean) => void
  togglePlay: () => void
  setSourceType: (source: AudioSourceType) => void
  setVolume: (volume: number) => void
  setAudioError: (error: string | null) => void
  setAudioFileName: (name: string | null) => void

  setShowFpsOverlay: (show: boolean) => void
  toggleFpsOverlay: () => void
  setIsPresetSettingsOpen: (isOpen: boolean) => void
  togglePresetSettings: () => void
  setCurrentFps: (fps: number) => void

  setIsFormulaTestbedOpen: (isOpen: boolean) => void
  toggleFormulaTestbed: () => void
  setActiveFormula: (formula: string) => void
  setBindFormulaToScene: (bind: boolean) => void
  setIsFormulaPresetsOpen: (isOpen: boolean) => void
  toggleFormulaPresets: () => void
  setIsFormulaReferenceOpen: (isOpen: boolean) => void
  toggleFormulaReference: () => void

  setTargetFps: (fps: number) => void
  setResolutionScale: (scale: ResolutionScale) => void
  setAudioBands: (bands: Partial<AudioBandsSettings>) => void
  resetAudioBands: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isPlaying: false,
  sourceType: 'sample',
  volume: 0.8,
  audioError: null,
  audioFileName: null,

  showFpsOverlay: true,
  isPresetSettingsOpen: false,
  currentFps: 60,

  targetFps: 60,
  resolutionScale: 1.0,
  audioBands: { ...DEFAULT_AUDIO_BANDS },

  isFormulaTestbedOpen: false,
  activeFormula: '1.0 + $BASS * 0.8 + #BEAT(0.2) * 0.5',
  bindFormulaToScene: true,
  isFormulaPresetsOpen: loadBoolFromStorage(STORAGE_KEY_FORMULA_PRESETS_OPEN, true),
  isFormulaReferenceOpen: loadBoolFromStorage(STORAGE_KEY_FORMULA_REFERENCE_OPEN, true),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSourceType: (sourceType) => set({ sourceType, audioError: null }),
  setVolume: (volume) => set({ volume }),
  setAudioError: (audioError) => set({ audioError }),
  setAudioFileName: (audioFileName) => set({ audioFileName }),

  setShowFpsOverlay: (showFpsOverlay) => set({ showFpsOverlay }),
  toggleFpsOverlay: () =>
    set((state) => ({ showFpsOverlay: !state.showFpsOverlay })),
  setIsPresetSettingsOpen: (isPresetSettingsOpen) =>
    set({ isPresetSettingsOpen }),
  togglePresetSettings: () =>
    set((state) => ({ isPresetSettingsOpen: !state.isPresetSettingsOpen })),
  setCurrentFps: (currentFps) => set({ currentFps: Math.round(currentFps) }),

  setIsFormulaTestbedOpen: (isFormulaTestbedOpen) =>
    set({ isFormulaTestbedOpen }),
  toggleFormulaTestbed: () =>
    set((state) => ({ isFormulaTestbedOpen: !state.isFormulaTestbedOpen })),
  setActiveFormula: (activeFormula) => set({ activeFormula }),
  setBindFormulaToScene: (bindFormulaToScene) => set({ bindFormulaToScene }),
  setIsFormulaPresetsOpen: (isFormulaPresetsOpen) => {
    saveBoolToStorage(STORAGE_KEY_FORMULA_PRESETS_OPEN, isFormulaPresetsOpen)
    set({ isFormulaPresetsOpen })
  },
  toggleFormulaPresets: () =>
    set((state) => {
      const next = !state.isFormulaPresetsOpen
      saveBoolToStorage(STORAGE_KEY_FORMULA_PRESETS_OPEN, next)
      return { isFormulaPresetsOpen: next }
    }),
  setIsFormulaReferenceOpen: (isFormulaReferenceOpen) => {
    saveBoolToStorage(STORAGE_KEY_FORMULA_REFERENCE_OPEN, isFormulaReferenceOpen)
    set({ isFormulaReferenceOpen })
  },
  toggleFormulaReference: () =>
    set((state) => {
      const next = !state.isFormulaReferenceOpen
      saveBoolToStorage(STORAGE_KEY_FORMULA_REFERENCE_OPEN, next)
      return { isFormulaReferenceOpen: next }
    }),

  setTargetFps: (targetFps) => set({ targetFps }),
  setResolutionScale: (resolutionScale) => set({ resolutionScale }),
  setAudioBands: (bands) =>
    set((state) => ({
      audioBands: {
        ...state.audioBands,
        ...bands,
      },
    })),
  resetAudioBands: () => set({ audioBands: { ...DEFAULT_AUDIO_BANDS } }),
}))
