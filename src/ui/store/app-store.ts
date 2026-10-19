import { create } from 'zustand'
import {
  DEFAULT_AUDIO_BANDS,
  type AudioBandsSettings,
  type ResolutionScale,
} from '../../contracts/preset-settings'
import { getTemplateById } from '../../engine/frame-buffer/frame-buffer-templates'

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
  isAudioLoading: boolean
  audioLoadingProgress: number
  audioLoadingStage: string

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

  // Frame Buffer & Ping-Pong Feedback state
  selectedTemplateId: string
  isTemplateSelectorOpen: boolean
  feedbackEnabled: boolean
  feedbackBlendMode: string
  feedbackOpacity: number | string
  feedbackScale: number | string
  feedbackRotation: number | string
  feedbackPositionX: number | string
  feedbackPositionY: number | string
  isCustomFeedbackConfig: boolean

  // Actions
  setIsPlaying: (isPlaying: boolean) => void
  togglePlay: () => void
  setSourceType: (source: AudioSourceType) => void
  setVolume: (volume: number) => void
  setAudioError: (error: string | null) => void
  setAudioFileName: (name: string | null) => void
  setIsAudioLoading: (loading: boolean, progress?: number, stage?: string) => void
  setAudioLoadingProgress: (progress: number, stage?: string) => void

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

  setSelectedTemplateId: (id: string) => void
  setIsTemplateSelectorOpen: (isOpen: boolean) => void
  toggleTemplateSelector: () => void
  setFeedbackEnabled: (enabled: boolean) => void
  setFeedbackBlendMode: (mode: string) => void
  setFeedbackOpacity: (opacity: number | string) => void
  setFeedbackScale: (scale: number | string) => void
  setFeedbackRotation: (rotation: number | string) => void
  setFeedbackPositionX: (x: number | string) => void
  setFeedbackPositionY: (y: number | string) => void
  applyFrameBufferTemplate: (templateId: string) => void

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
  isAudioLoading: false,
  audioLoadingProgress: 0,
  audioLoadingStage: '',

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

  selectedTemplateId: 'clean-slate',
  isTemplateSelectorOpen: false,
  feedbackEnabled: false,
  feedbackBlendMode: 'replace',
  feedbackOpacity: 1.0,
  feedbackScale: 1.0,
  feedbackRotation: 0.0,
  feedbackPositionX: 0.0,
  feedbackPositionY: 0.0,
  isCustomFeedbackConfig: false,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSourceType: (sourceType) => set({ sourceType, audioError: null }),
  setVolume: (volume) => set({ volume }),
  setAudioError: (audioError) => set({ audioError }),
  setAudioFileName: (audioFileName) => set({ audioFileName }),
  setIsAudioLoading: (isAudioLoading, progress = 0, stage = '') =>
    set({ isAudioLoading, audioLoadingProgress: progress, audioLoadingStage: stage }),
  setAudioLoadingProgress: (audioLoadingProgress, stage) =>
    set((state) => ({
      audioLoadingProgress,
      audioLoadingStage: stage !== undefined ? stage : state.audioLoadingStage,
    })),

  setShowFpsOverlay: (showFpsOverlay) => set({ showFpsOverlay }),
  toggleFpsOverlay: () =>
    set((state) => ({ showFpsOverlay: !state.showFpsOverlay })),
  setIsPresetSettingsOpen: (isPresetSettingsOpen) =>
    set({
      isPresetSettingsOpen,
      ...(isPresetSettingsOpen ? { isFormulaTestbedOpen: false, isTemplateSelectorOpen: false } : {}),
    }),
  togglePresetSettings: () =>
    set((state) => {
      const next = !state.isPresetSettingsOpen
      return {
        isPresetSettingsOpen: next,
        ...(next ? { isFormulaTestbedOpen: false, isTemplateSelectorOpen: false } : {}),
      }
    }),
  setCurrentFps: (currentFps) => set({ currentFps: Math.round(currentFps) }),

  setIsFormulaTestbedOpen: (isFormulaTestbedOpen) =>
    set({
      isFormulaTestbedOpen,
      ...(isFormulaTestbedOpen ? { isPresetSettingsOpen: false, isTemplateSelectorOpen: false } : {}),
    }),
  toggleFormulaTestbed: () =>
    set((state) => {
      const next = !state.isFormulaTestbedOpen
      return {
        isFormulaTestbedOpen: next,
        ...(next ? { isPresetSettingsOpen: false, isTemplateSelectorOpen: false } : {}),
      }
    }),
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

  setSelectedTemplateId: (selectedTemplateId) => set({ selectedTemplateId }),
  setIsTemplateSelectorOpen: (isTemplateSelectorOpen) =>
    set({
      isTemplateSelectorOpen,
      ...(isTemplateSelectorOpen ? { isPresetSettingsOpen: false, isFormulaTestbedOpen: false } : {}),
    }),
  toggleTemplateSelector: () =>
    set((state) => {
      const next = !state.isTemplateSelectorOpen
      return {
        isTemplateSelectorOpen: next,
        ...(next ? { isPresetSettingsOpen: false, isFormulaTestbedOpen: false } : {}),
      }
    }),

  setFeedbackEnabled: (feedbackEnabled) =>
    set({ feedbackEnabled, isCustomFeedbackConfig: true }),
  setFeedbackBlendMode: (feedbackBlendMode) =>
    set({ feedbackBlendMode, isCustomFeedbackConfig: true }),
  setFeedbackOpacity: (feedbackOpacity) =>
    set({ feedbackOpacity, isCustomFeedbackConfig: true }),
  setFeedbackScale: (feedbackScale) =>
    set({ feedbackScale, isCustomFeedbackConfig: true }),
  setFeedbackRotation: (feedbackRotation) =>
    set({ feedbackRotation, isCustomFeedbackConfig: true }),
  setFeedbackPositionX: (feedbackPositionX) =>
    set({ feedbackPositionX, isCustomFeedbackConfig: true }),
  setFeedbackPositionY: (feedbackPositionY) =>
    set({ feedbackPositionY, isCustomFeedbackConfig: true }),

  applyFrameBufferTemplate: (templateId) => {
    const template = getTemplateById(templateId)
    if (!template) return
    set({
      selectedTemplateId: template.id,
      feedbackEnabled: template.config.feedback,
      feedbackBlendMode: template.config.blendMode,
      feedbackOpacity: template.config.opacity,
      feedbackScale: template.config.scale,
      feedbackRotation: template.config.rotation,
      feedbackPositionX: template.config.positionX,
      feedbackPositionY: template.config.positionY,
      isCustomFeedbackConfig: false,
    })
  },

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
