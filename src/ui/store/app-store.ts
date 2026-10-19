import { create } from 'zustand'
import type { ResolutionScale } from '../../contracts/preset-settings'

export type AudioSourceType = 'sample' | 'mic'

export interface AppState {
  // Audio state (<10 Hz user actions)
  isPlaying: boolean
  sourceType: AudioSourceType
  volume: number
  audioError: string | null

  // HUD & UI overlay state
  showFpsOverlay: boolean
  isPresetSettingsOpen: boolean
  currentFps: number

  // Preset-wide performance settings
  targetFps: number
  resolutionScale: ResolutionScale

  // Actions
  setIsPlaying: (isPlaying: boolean) => void
  togglePlay: () => void
  setSourceType: (source: AudioSourceType) => void
  setVolume: (volume: number) => void
  setAudioError: (error: string | null) => void

  setShowFpsOverlay: (show: boolean) => void
  toggleFpsOverlay: () => void
  setIsPresetSettingsOpen: (isOpen: boolean) => void
  togglePresetSettings: () => void
  setCurrentFps: (fps: number) => void

  setTargetFps: (fps: number) => void
  setResolutionScale: (scale: ResolutionScale) => void
}

export const useAppStore = create<AppState>((set) => ({
  isPlaying: false,
  sourceType: 'sample',
  volume: 0.8,
  audioError: null,

  showFpsOverlay: true,
  isPresetSettingsOpen: false,
  currentFps: 60,

  targetFps: 60,
  resolutionScale: 1.0,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSourceType: (sourceType) => set({ sourceType, audioError: null }),
  setVolume: (volume) => set({ volume }),
  setAudioError: (audioError) => set({ audioError }),

  setShowFpsOverlay: (showFpsOverlay) => set({ showFpsOverlay }),
  toggleFpsOverlay: () =>
    set((state) => ({ showFpsOverlay: !state.showFpsOverlay })),
  setIsPresetSettingsOpen: (isPresetSettingsOpen) =>
    set({ isPresetSettingsOpen }),
  togglePresetSettings: () =>
    set((state) => ({ isPresetSettingsOpen: !state.isPresetSettingsOpen })),
  setCurrentFps: (currentFps) => set({ currentFps: Math.round(currentFps) }),

  setTargetFps: (targetFps) => set({ targetFps }),
  setResolutionScale: (resolutionScale) => set({ resolutionScale }),
}))
