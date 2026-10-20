import { create } from 'zustand'
import {
  DEFAULT_AUDIO_BANDS,
  type AudioBandsSettings,
  type ResolutionScale,
} from '../../contracts/preset-settings'
import { getTemplateById } from '../../engine/frame-buffer/frame-buffer-templates'
import type { AudioSourceType } from '../../audio/audio-manager'

export type { AudioSourceType }

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

export type StudioMode = 'editor' | 'live'
export const DEFAULT_STUDIO_SPLIT_RATIOS: [number, number, number] = [0.35, 0.4, 0.25]
export const STORAGE_KEY_STUDIO_MODE = 'visualitzacio_studio_mode'
export const STORAGE_KEY_STUDIO_SPLIT_RATIOS = 'visualitzacio_studio_split_ratios'

function loadStudioModeFromStorage(): StudioMode {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY_STUDIO_MODE)
      if (stored === 'live' || stored === 'editor') {
        return stored
      }
    }
  } catch {
    // ignore
  }
  return 'editor'
}

function saveStudioModeToStorage(mode: StudioMode): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_STUDIO_MODE, mode)
    }
  } catch {
    // ignore
  }
}

function loadSplitRatiosFromStorage(): [number, number, number] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY_STUDIO_SPLIT_RATIOS)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (
          Array.isArray(parsed) &&
          parsed.length === 3 &&
          parsed.every((n) => typeof n === 'number' && !Number.isNaN(n) && n > 0)
        ) {
          const sum = parsed[0] + parsed[1] + parsed[2]
          if (sum > 0) {
            return [parsed[0] / sum, parsed[1] / sum, parsed[2] / sum]
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_STUDIO_SPLIT_RATIOS]
}

function saveSplitRatiosToStorage(ratios: [number, number, number]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        STORAGE_KEY_STUDIO_SPLIT_RATIOS,
        JSON.stringify(ratios),
      )
    }
  } catch {
    // ignore
  }
}

export type DialogId = 'preset-settings' | 'formula-testbed' | 'template-selector'

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
  dialogStack: DialogId[]
  isPresetSettingsOpen: boolean
  currentFps: number

  // Studio workspace & mode state (Track 4)
  studioMode: StudioMode
  studioSplitRatios: [number, number, number]

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

  // Studio Mode & Split-View Actions (Track 4)
  setStudioMode: (mode: StudioMode) => void
  toggleStudioMode: () => void
  setStudioSplitRatios: (ratios: [number, number, number]) => void
  resetStudioSplitRatios: () => void

  // Dialog Stack Navigation Actions
  openDialog: (id: DialogId) => void
  closeDialog: (id?: DialogId) => void
  toggleDialog: (id: DialogId) => void
  closeAllDialogs: () => void

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

function computeDialogState(stack: DialogId[]) {
  const active = stack[stack.length - 1] ?? null
  return {
    dialogStack: stack,
    isPresetSettingsOpen: active === 'preset-settings',
    isFormulaTestbedOpen: active === 'formula-testbed',
    isTemplateSelectorOpen: active === 'template-selector',
  }
}

function pushDialog(stack: DialogId[], id: DialogId): DialogId[] {
  const next = stack.filter((d) => (d as DialogId) !== id)
  next.push(id)
  return next
}

function removeDialog(stack: DialogId[], id?: DialogId): DialogId[] {
  if (id) {
    return stack.filter((d) => (d as DialogId) !== id)
  }
  return stack.slice(0, -1)
}

function toggleDialogInStack(stack: DialogId[], id: DialogId): DialogId[] {
  const top = stack[stack.length - 1]
  if (top === id) {
    return stack.slice(0, -1)
  }
  const next = stack.filter((d) => (d as DialogId) !== id)
  next.push(id)
  return next
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
  dialogStack: [],
  isPresetSettingsOpen: false,
  currentFps: 60,

  studioMode: loadStudioModeFromStorage(),
  studioSplitRatios: loadSplitRatiosFromStorage(),

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

  setStudioMode: (studioMode) => {
    saveStudioModeToStorage(studioMode)
    set({ studioMode })
  },
  toggleStudioMode: () =>
    set((state) => {
      const nextMode: StudioMode = state.studioMode === 'editor' ? 'live' : 'editor'
      saveStudioModeToStorage(nextMode)
      return { studioMode: nextMode }
    }),
  setStudioSplitRatios: (studioSplitRatios) => {
    saveSplitRatiosToStorage(studioSplitRatios)
    set({ studioSplitRatios })
  },
  resetStudioSplitRatios: () => {
    saveSplitRatiosToStorage(DEFAULT_STUDIO_SPLIT_RATIOS)
    set({ studioSplitRatios: [...DEFAULT_STUDIO_SPLIT_RATIOS] })
  },
  // Dialog Stack Actions
  openDialog: (id: DialogId) =>
    set((state) => {
      if (state.dialogStack[state.dialogStack.length - 1] === id) {
        return state
      }
      return computeDialogState(pushDialog(state.dialogStack, id))
    }),

  closeDialog: (id?: DialogId) =>
    set((state) => computeDialogState(removeDialog(state.dialogStack, id))),

  toggleDialog: (id: DialogId) =>
    set((state) => computeDialogState(toggleDialogInStack(state.dialogStack, id))),

  closeAllDialogs: () =>
    set({
      dialogStack: [],
      isPresetSettingsOpen: false,
      isFormulaTestbedOpen: false,
      isTemplateSelectorOpen: false,
    }),

  // Legacy convenience setters
  setIsPresetSettingsOpen: (isOpen) =>
    set((state) =>
      computeDialogState(
        isOpen
          ? pushDialog(state.dialogStack, 'preset-settings')
          : removeDialog(state.dialogStack, 'preset-settings')
      )
    ),

  togglePresetSettings: () =>
    set((state) =>
      computeDialogState(toggleDialogInStack(state.dialogStack, 'preset-settings'))
    ),

  setCurrentFps: (currentFps) => set({ currentFps: Math.round(currentFps) }),

  setIsFormulaTestbedOpen: (isOpen) =>
    set((state) =>
      computeDialogState(
        isOpen
          ? pushDialog(state.dialogStack, 'formula-testbed')
          : removeDialog(state.dialogStack, 'formula-testbed')
      )
    ),

  toggleFormulaTestbed: () =>
    set((state) =>
      computeDialogState(toggleDialogInStack(state.dialogStack, 'formula-testbed'))
    ),

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
  setIsTemplateSelectorOpen: (isOpen) =>
    set((state) =>
      computeDialogState(
        isOpen
          ? pushDialog(state.dialogStack, 'template-selector')
          : removeDialog(state.dialogStack, 'template-selector')
      )
    ),

  toggleTemplateSelector: () =>
    set((state) =>
      computeDialogState(toggleDialogInStack(state.dialogStack, 'template-selector'))
    ),

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
