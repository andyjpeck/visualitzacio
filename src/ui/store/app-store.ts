import { create } from 'zustand'
import type { Edge, Node } from '@xyflow/react'
import {
  DEFAULT_AUDIO_BANDS,
  type AudioBandsSettings,
  type ResolutionScale,
} from '../../contracts/preset-settings'
import type { Preset } from '../../contracts/preset-schema'
import type { LayerNodeType } from '../../contracts/node-types'
import { getTemplateById } from '../../engine/frame-buffer/frame-buffer-templates'
import {
  DEFAULT_DUPERSCOPE_CONFIG,
  getDuperscopeTemplateById,
} from '../../engine/nodes/duperscope-templates'
import { serializePreset, serializePresetToJson } from '../../engine/presets/preset-serializer'
import { deserializePreset } from '../../engine/presets/preset-deserializer'
import type { AudioSourceType } from '../../audio/audio-manager'
import {
  getNextChildPosition,
  recalculateContainerBounds,
  reflowGraphStacks,
} from '../graph/layout/container-bounds'
import { syncNamedBufferEdges } from '../graph/buffer-edges'
import {
  UndoRedoManager,
  type HistorySnapshot,
  type RecordOptions,
  MAX_HISTORY_SNAPSHOTS,
} from '../history/undo-redo-manager'

export const undoRedoManager = new UndoRedoManager(MAX_HISTORY_SNAPSHOTS)

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
export const DEFAULT_STUDIO_SPLIT_RATIO = 0.5
export const DEFAULT_INSPECTOR_VERTICAL_RATIO = 0.45
export const STORAGE_KEY_STUDIO_MODE = 'visualitzacio_studio_mode'
export const STORAGE_KEY_STUDIO_SPLIT_RATIO = 'visualitzacio_studio_split_ratio'
export const STORAGE_KEY_INSPECTOR_VERTICAL_RATIO =
  'visualitzacio_inspector_vertical_ratio'

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


function loadSplitRatioFromStorage(): number {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY_STUDIO_SPLIT_RATIO)
      if (stored) {
        const val = parseFloat(stored)
        if (!Number.isNaN(val) && val > 0.1 && val < 0.9) {
          return val
        }
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_STUDIO_SPLIT_RATIO
}

function saveSplitRatioToStorage(ratio: number): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_STUDIO_SPLIT_RATIO, String(ratio))
    }
  } catch {
    // ignore
  }
}

function loadInspectorVerticalRatioFromStorage(): number {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(
        STORAGE_KEY_INSPECTOR_VERTICAL_RATIO,
      )
      if (stored) {
        const val = parseFloat(stored)
        if (!Number.isNaN(val) && val >= 0.15 && val <= 0.85) {
          return val
        }
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_INSPECTOR_VERTICAL_RATIO
}

function saveInspectorVerticalRatioToStorage(ratio: number): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        STORAGE_KEY_INSPECTOR_VERTICAL_RATIO,
        String(ratio),
      )
    }
  } catch {
    // ignore
  }
}

export const DEFAULT_GRAPH_NODES: Node[] = [
  {
    id: 'master-frame-buffer',
    type: 'masterFrameBuffer',
    position: { x: 40, y: 30 },
    style: { width: 320, height: 690 },
    data: {
      label: 'Master Output',
      blendMode: 'replace',
      outputBlendMode: 'replace',
      inputBlendMode: 'none',
      opacity: 1.0,
      scale: 1.0,
      offsetX: 0.0,
      offsetY: 0.0,
      positionX: 0.0,
      positionY: 0.0,
    },
  },
  {
    id: 'source-buffer',
    type: 'frameBuffer',
    parentId: 'master-frame-buffer',
    extent: 'parent',
    position: { x: 20, y: 65 },
    style: { width: 280, height: 160 },
    data: {
      label: 'Source Buffer',
      saveTo: '@IMAGE',
      inputBlendMode: 'none',
      outputBlendMode: 'none',
      blendMode: 'none',
      opacity: 1.0,
      scale: 1.0,
      positionX: 0.0,
      positionY: 0.0,
      feedback: false,
    },
  },
  {
    id: 'test-visual-1',
    type: 'testVisual',
    parentId: 'source-buffer',
    extent: 'parent',
    position: { x: 20, y: 65 },
    style: { width: 240, height: 53 },
    data: {
      label: 'Crystal Synth',
      shape: 'Crystal',
      reactive: true,
      scale: 1.0,
      offsetX: 0.0,
      offsetY: 0.0,
      positionX: 0.0,
      positionY: 0.0,
    },
  },
  {
    id: 'corner-top-left',
    type: 'frameBuffer',
    parentId: 'master-frame-buffer',
    extent: 'parent',
    position: { x: 20, y: 240 },
    style: { width: 280, height: 95 },
    data: {
      label: 'Top-Left Corner',
      loadFrom: '@IMAGE',
      inputBlendMode: 'replace',
      outputBlendMode: 'add',
      blendMode: 'add',
      opacity: 1.0,
      scale: 0.5,
      positionX: -0.5,
      positionY: 0.5,
      offsetX: -0.5,
      offsetY: 0.5,
    },
  },
  {
    id: 'corner-top-right',
    type: 'frameBuffer',
    parentId: 'master-frame-buffer',
    extent: 'parent',
    position: { x: 20, y: 350 },
    style: { width: 280, height: 95 },
    data: {
      label: 'Top-Right Corner',
      loadFrom: '@IMAGE',
      inputBlendMode: 'replace',
      outputBlendMode: 'add',
      blendMode: 'add',
      opacity: 1.0,
      scale: 0.5,
      positionX: 0.5,
      positionY: 0.5,
      offsetX: 0.5,
      offsetY: 0.5,
    },
  },
  {
    id: 'corner-bottom-left',
    type: 'frameBuffer',
    parentId: 'master-frame-buffer',
    extent: 'parent',
    position: { x: 20, y: 460 },
    style: { width: 280, height: 95 },
    data: {
      label: 'Bottom-Left Corner',
      loadFrom: '@IMAGE',
      inputBlendMode: 'replace',
      outputBlendMode: 'add',
      blendMode: 'add',
      opacity: 1.0,
      scale: 0.5,
      positionX: -0.5,
      positionY: -0.5,
      offsetX: -0.5,
      offsetY: -0.5,
    },
  },
  {
    id: 'corner-bottom-right',
    type: 'frameBuffer',
    parentId: 'master-frame-buffer',
    extent: 'parent',
    position: { x: 20, y: 570 },
    style: { width: 280, height: 95 },
    data: {
      label: 'Bottom-Right Corner',
      loadFrom: '@IMAGE',
      inputBlendMode: 'replace',
      outputBlendMode: 'add',
      blendMode: 'add',
      opacity: 1.0,
      scale: 0.5,
      positionX: 0.5,
      positionY: -0.5,
      offsetX: 0.5,
      offsetY: -0.5,
    },
  },
]

export const DEFAULT_GRAPH_EDGES: Edge[] = [
  {
    id: 'e-source-buffer-corner-top-left-buffer',
    source: 'source-buffer',
    target: 'corner-top-left',
    sourceHandle: 'buffer-out',
    targetHandle: 'buffer-in',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e-source-buffer-corner-top-right-buffer',
    source: 'source-buffer',
    target: 'corner-top-right',
    sourceHandle: 'buffer-out',
    targetHandle: 'buffer-in',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e-source-buffer-corner-bottom-left-buffer',
    source: 'source-buffer',
    target: 'corner-bottom-left',
    sourceHandle: 'buffer-out',
    targetHandle: 'buffer-in',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e-source-buffer-corner-bottom-right-buffer',
    source: 'source-buffer',
    target: 'corner-bottom-right',
    sourceHandle: 'buffer-out',
    targetHandle: 'buffer-in',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
]

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
  showDebugData: boolean
  dialogStack: DialogId[]
  isPresetSettingsOpen: boolean
  currentFps: number

  // Studio workspace & mode state (Track 4)
  studioMode: StudioMode
  studioSplitRatio: number
  inspectorVerticalRatio: number
  hoveredBufferTag: string | null

  // Visual Node Graph pipeline state (Track 4)
  selectedNodeId: string | null
  focusedParamKey: string | null
  graphNodes: Node[]
  graphEdges: Edge[]

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
  setShowDebugData: (show: boolean) => void
  toggleDebugData: () => void

  // Studio Mode & Split-View Actions (Track 4)
  setStudioMode: (mode: StudioMode) => void
  toggleStudioMode: () => void
  setStudioSplitRatio: (ratio: number) => void
  resetStudioSplitRatio: () => void
  setInspectorVerticalRatio: (ratio: number) => void
  resetInspectorVerticalRatio: () => void
  setHoveredBufferTag: (tag: string | null) => void

  // Visual Node Graph Pipeline Actions (Track 4)
  setSelectedNodeId: (id: string | null) => void
  setFocusedParamKey: (key: string | null) => void
  setGraphNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setGraphEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  addGraphNode: (node: Node) => void
  removeGraphNode: (nodeId: string) => boolean
  updateGraphNodeData: (nodeId: string, patch: Record<string, unknown>, options?: RecordOptions) => void
  setNodeParent: (nodeId: string, parentId: string) => void
  addLayerNode: (
    type: LayerNodeType,
    parentId?: string,
  ) => string
  applyDuperscopeTemplate: (nodeId: string, templateId: string) => void

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

  // 100-Step History & Undo/Redo Actions (Track 4 Task 4.1)
  canUndo: boolean
  canRedo: boolean
  undo: () => boolean
  redo: () => boolean
  recordHistorySnapshot: (description?: string, options?: RecordOptions) => void
  commitHistoryCoalescing: () => void
  clearHistory: () => void

  // Preset Import/Export Actions (Track 4 Task 4.3)
  exportPreset: (name?: string) => Preset
  exportPresetJson: (name?: string, space?: number) => string
  loadPreset: (presetOrJson: Preset | string) => { success: boolean; errors?: string[] }
}

function getHistorySnapshotFromState(state: AppState): HistorySnapshot {
  return {
    graphNodes: state.graphNodes,
    graphEdges: state.graphEdges,
    targetFps: state.targetFps,
    resolutionScale: state.resolutionScale,
    audioBands: state.audioBands,
    selectedNodeId: state.selectedNodeId,
    feedbackConfig: {
      selectedTemplateId: state.selectedTemplateId,
      feedbackEnabled: state.feedbackEnabled,
      feedbackBlendMode: state.feedbackBlendMode,
      feedbackOpacity: state.feedbackOpacity,
      feedbackScale: state.feedbackScale,
      feedbackRotation: state.feedbackRotation,
      feedbackPositionX: state.feedbackPositionX,
      feedbackPositionY: state.feedbackPositionY,
      isCustomFeedbackConfig: state.isCustomFeedbackConfig,
    },
  }
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

export const useAppStore = create<AppState>((set, get) => ({
  isPlaying: false,
  sourceType: 'sample',
  volume: 0.8,
  audioError: null,
  audioFileName: null,
  isAudioLoading: false,
  audioLoadingProgress: 0,
  audioLoadingStage: '',

  showFpsOverlay: true,
  showDebugData: true,
  dialogStack: [],
  isPresetSettingsOpen: false,
  currentFps: 60,

  studioMode: loadStudioModeFromStorage(),
  studioSplitRatio: loadSplitRatioFromStorage(),
  inspectorVerticalRatio: loadInspectorVerticalRatioFromStorage(),
  hoveredBufferTag: null,

  selectedNodeId: 'master-frame-buffer',
  focusedParamKey: null,
  graphNodes: [...DEFAULT_GRAPH_NODES],
  graphEdges: [...DEFAULT_GRAPH_EDGES],

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

  canUndo: false,
  canRedo: false,

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

  setShowFpsOverlay: (showFpsOverlay) =>
    set({ showFpsOverlay, showDebugData: showFpsOverlay }),
  toggleFpsOverlay: () =>
    set((state) => {
      const next = !(state.showDebugData ?? state.showFpsOverlay)
      return { showFpsOverlay: next, showDebugData: next }
    }),
  setShowDebugData: (showDebugData) =>
    set({ showDebugData, showFpsOverlay: showDebugData }),
  toggleDebugData: () =>
    set((state) => {
      const next = !(state.showDebugData ?? state.showFpsOverlay)
      return { showDebugData: next, showFpsOverlay: next }
    }),

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
  setStudioSplitRatio: (studioSplitRatio) => {
    saveSplitRatioToStorage(studioSplitRatio)
    set({ studioSplitRatio })
  },
  resetStudioSplitRatio: () => {
    saveSplitRatioToStorage(DEFAULT_STUDIO_SPLIT_RATIO)
    set({ studioSplitRatio: DEFAULT_STUDIO_SPLIT_RATIO })
  },
  setInspectorVerticalRatio: (inspectorVerticalRatio) => {
    saveInspectorVerticalRatioToStorage(inspectorVerticalRatio)
    set({ inspectorVerticalRatio })
  },
  resetInspectorVerticalRatio: () => {
    saveInspectorVerticalRatioToStorage(DEFAULT_INSPECTOR_VERTICAL_RATIO)
    set({ inspectorVerticalRatio: DEFAULT_INSPECTOR_VERTICAL_RATIO })
  },
  setHoveredBufferTag: (hoveredBufferTag) => set({ hoveredBufferTag }),

  setSelectedNodeId: (selectedNodeId) =>
    set({
      selectedNodeId,
      focusedParamKey: null,
    }),
  setFocusedParamKey: (focusedParamKey) => set({ focusedParamKey }),
  setGraphNodes: (nodesOrUpdater) =>
    set((state) => {
      const updatedNodes =
        typeof nodesOrUpdater === 'function'
          ? nodesOrUpdater(state.graphNodes)
          : nodesOrUpdater
      undoRedoManager.recordDelta({
        type: 'reorder-nodes',
        description: 'Reorder Layers',
        reorderedNodeIds: {
          before: state.graphNodes.map((n) => n.id),
          after: updatedNodes.map((n) => n.id),
        },
      })
      const updatedEdges = syncNamedBufferEdges(updatedNodes, state.graphEdges)
      return {
        graphNodes: updatedNodes,
        graphEdges: updatedEdges,
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
      }
    }),
  setGraphEdges: (edgesOrUpdater) =>
    set((state) => ({
      graphEdges:
        typeof edgesOrUpdater === 'function'
          ? edgesOrUpdater(state.graphEdges)
          : edgesOrUpdater,
    })),
  addGraphNode: (node) =>
    set((state) => {
      // The ONLY node allowed at top level is master-frame-buffer.
      // Any other node must be a child of a buffer.
      const resolvedParentId =
        node.id === 'master-frame-buffer' || node.type === 'masterFrameBuffer'
          ? undefined
          : node.parentId || 'master-frame-buffer'

      const childPos = resolvedParentId
        ? node.parentId && node.position?.y !== undefined
          ? node.position
          : getNextChildPosition(resolvedParentId, state.graphNodes)
        : node.position

      const normalizedNode: Node = resolvedParentId
        ? {
            ...node,
            parentId: resolvedParentId,
            extent: 'parent' as const,
            position: childPos,
          }
        : node

      undoRedoManager.recordDelta({
        type: 'add-node',
        description: 'Add Layer',
        addedNodes: [normalizedNode],
        addedEdges: [],
      })

      const updatedNodes = [...state.graphNodes, normalizedNode]
      return {
        graphNodes: reflowGraphStacks(updatedNodes),
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
      }
    }),
  removeGraphNode: (nodeId) => {
    const state = get()
    const nodeToRemove = state.graphNodes.find((n) => n.id === nodeId)
    // Master Output cannot be deleted (Permanent root anchor)
    if (!nodeToRemove || nodeToRemove.type === 'masterFrameBuffer' || nodeId === 'master-frame-buffer') {
      return false
    }

    // Recursively collect all descendant child node IDs
    const idsToRemove = new Set<string>([nodeId])
    let added = true
    while (added) {
      added = false
      for (const n of state.graphNodes) {
        if (n.parentId && idsToRemove.has(n.parentId) && !idsToRemove.has(n.id)) {
          idsToRemove.add(n.id)
          added = true
        }
      }
    }

    const removedNodesList = state.graphNodes.filter((n) => idsToRemove.has(n.id))
    const removedEdgesList = state.graphEdges.filter(
      (e) => idsToRemove.has(e.source) || idsToRemove.has(e.target),
    )
    const deletedIndices = removedNodesList.map((n) => ({
      id: n.id,
      index: state.graphNodes.findIndex((gn) => gn.id === n.id),
    }))

    undoRedoManager.recordDelta({
      type: 'delete-node',
      description: 'Delete Layer',
      deletedNodes: removedNodesList,
      deletedEdges: removedEdgesList,
      deletedIndices,
    })

    const remainingNodes = state.graphNodes.filter((n) => !idsToRemove.has(n.id))
    const remainingEdges = state.graphEdges.filter(
      (e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target),
    )
    const nextSelectedId =
      state.selectedNodeId && idsToRemove.has(state.selectedNodeId)
        ? 'master-frame-buffer'
        : state.selectedNodeId

    set({
      graphNodes: reflowGraphStacks(remainingNodes),
      graphEdges: remainingEdges,
      selectedNodeId: nextSelectedId,
      canUndo: undoRedoManager.canUndo(),
      canRedo: undoRedoManager.canRedo(),
    })
    return true
  },
  updateGraphNodeData: (nodeId, patch, options) =>
    set((state) => {
      const target = state.graphNodes.find((n) => n.id === nodeId)
      if (target) {
        const beforeData: Record<string, unknown> = {}
        const afterData: Record<string, unknown> = {}
        for (const key of Object.keys(patch)) {
          beforeData[key] = (target.data as Record<string, unknown>)[key]
          afterData[key] = (patch as Record<string, unknown>)[key]
        }
        undoRedoManager.recordDelta(
          {
            type: 'update-node',
            description: options?.description ?? 'Update Node Data',
            modifiedNodes: [
              {
                id: nodeId,
                beforeData,
                afterData,
              },
            ],
          },
          options,
        )
      }
      const updatedNodes = state.graphNodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...patch } }
          : node,
      )
      const updatedEdges = syncNamedBufferEdges(updatedNodes, state.graphEdges)
      return {
        graphNodes: updatedNodes,
        graphEdges: updatedEdges,
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
      }
    }),
  setNodeParent: (nodeId, parentId) =>
    set((state) => {
      const targetNode = state.graphNodes.find((n) => n.id === nodeId)
      if (!targetNode || targetNode.id === 'master-frame-buffer') return state

      // Fallback to master-frame-buffer if parentId is empty or invalid
      const targetParentId = parentId || 'master-frame-buffer'
      const parentNode = state.graphNodes.find((n) => n.id === targetParentId)
      if (!parentNode) return state

      const newPos = getNextChildPosition(
        targetParentId,
        state.graphNodes.filter((n) => n.id !== nodeId),
      )

      undoRedoManager.recordDelta({
        type: 'reparent-node',
        description: 'Reparent Layer',
        nodeId,
        beforeParentId: targetNode.parentId ?? null,
        afterParentId: targetParentId,
        beforePosition: targetNode.position,
        afterPosition: newPos,
      })

      const updatedNodes = state.graphNodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            parentId: targetParentId,
            extent: 'parent' as const,
            position: newPos,
          }
        }
        return n
      })

      return {
        graphNodes: recalculateContainerBounds(updatedNodes),
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
      }
    }),
  addLayerNode: (type, parentId) => {
    const state = get()
    const targetParentId = parentId || 'master-frame-buffer'
    const childCount = state.graphNodes.filter((n) => n.parentId === targetParentId).length
    const childPos = getNextChildPosition(targetParentId, state.graphNodes)
    const newId = `${type}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`

    let childNode: Node
    if (type === 'duperscopeNode') {
      childNode = {
        id: newId,
        type: 'duperscopeNode',
        parentId: targetParentId,
        extent: 'parent',
        position: childPos,
        data: {
          label: `Duperscope ${childCount + 1}`,
          drawMode: DEFAULT_DUPERSCOPE_CONFIG.drawMode,
          audioMode: DEFAULT_DUPERSCOPE_CONFIG.audioMode,
          channel: DEFAULT_DUPERSCOPE_CONFIG.channel,
          opacity: DEFAULT_DUPERSCOPE_CONFIG.opacity,
          initCode: DEFAULT_DUPERSCOPE_CONFIG.initCode,
          beatCode: DEFAULT_DUPERSCOPE_CONFIG.beatCode,
          frameCode: DEFAULT_DUPERSCOPE_CONFIG.frameCode,
          pointCode: DEFAULT_DUPERSCOPE_CONFIG.pointCode,
        },
      }
    } else if (type === 'testVisual') {
      childNode = {
        id: newId,
        type: 'testVisual',
        parentId: targetParentId,
        extent: 'parent',
        position: childPos,
        data: {
          label: `Synth ${childCount + 1}`,
          shape: 'Crystal',
          scale: 1.0,
        },
      }
    } else if (type === 'staticImage') {
      childNode = {
        id: newId,
        type: 'staticImage',
        parentId: targetParentId,
        extent: 'parent',
        position: childPos,
        data: {
          label: `Image Layer ${childCount + 1}`,
          fitMode: 'contain',
        },
      }
    } else {
      childNode = {
        id: newId,
        type: 'frameBuffer',
        parentId: targetParentId,
        extent: 'parent',
        position: childPos,
        data: {
          label: `Buffer ${childCount + 1}`,
          blendMode: 'screen',
          feedback: true,
          opacity: 0.9,
        },
      }
    }

    state.addGraphNode(childNode)
    set({ selectedNodeId: newId })
    return newId
  },
  applyDuperscopeTemplate: (nodeId, templateId) => {
    const template = getDuperscopeTemplateById(templateId)
    if (!template) return

    const state = get()
    const targetNode = state.graphNodes.find((n) => n.id === nodeId)
    if (!targetNode) return

    const patch: Record<string, unknown> = {
      appliedTemplateId: template.id,
      drawMode: template.drawMode,
      audioMode: template.audioMode,
      channel: template.channel,
      opacity: template.opacity,
      initCode: template.initCode,
      beatCode: template.beatCode,
      frameCode: template.frameCode,
      pointCode: template.pointCode,
      opacity_formula: undefined,
    }

    state.updateGraphNodeData(nodeId, patch, {
      description: `Apply Template ${template.name}`,
    })
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
    const state = get()
    const previousFb = {
      selectedTemplateId: state.selectedTemplateId,
      feedbackEnabled: state.feedbackEnabled,
      feedbackBlendMode: state.feedbackBlendMode,
      feedbackOpacity: state.feedbackOpacity,
      feedbackScale: state.feedbackScale,
      feedbackRotation: state.feedbackRotation,
      feedbackPositionX: state.feedbackPositionX,
      feedbackPositionY: state.feedbackPositionY,
      isCustomFeedbackConfig: state.isCustomFeedbackConfig,
    }
    const nextFb = {
      selectedTemplateId: template.id,
      feedbackEnabled: template.config.feedback,
      feedbackBlendMode: template.config.blendMode,
      feedbackOpacity: template.config.opacity,
      feedbackScale: template.config.scale,
      feedbackRotation: template.config.rotation,
      feedbackPositionX: template.config.positionX,
      feedbackPositionY: template.config.positionY,
      isCustomFeedbackConfig: false,
    }
    undoRedoManager.recordDelta({
      type: 'update-feedback',
      description: `Apply Template ${template.name}`,
      feedback: { before: previousFb, after: nextFb },
    })
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
      canUndo: undoRedoManager.canUndo(),
      canRedo: undoRedoManager.canRedo(),
    })
  },

  setTargetFps: (targetFps) =>
    set((state) => {
      undoRedoManager.recordDelta({
        type: 'update-settings',
        description: 'Change Target FPS',
        settings: {
          before: { targetFps: state.targetFps },
          after: { targetFps },
        },
      })
      return {
        targetFps,
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
      }
    }),
  setResolutionScale: (resolutionScale) =>
    set((state) => {
      undoRedoManager.recordDelta({
        type: 'update-settings',
        description: 'Change Resolution Scale',
        settings: {
          before: { resolutionScale: state.resolutionScale },
          after: { resolutionScale },
        },
      })
      return {
        resolutionScale,
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
      }
    }),
  setAudioBands: (bands) =>
    set((state) => {
      undoRedoManager.recordDelta({
        type: 'update-settings',
        description: 'Change Audio Bands',
        settings: {
          before: { audioBands: state.audioBands },
          after: { audioBands: { ...state.audioBands, ...bands } },
        },
      })
      return {
        audioBands: {
          ...state.audioBands,
          ...bands,
        },
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
      }
    }),
  resetAudioBands: () =>
    set((state) => {
      undoRedoManager.recordDelta({
        type: 'update-settings',
        description: 'Reset Audio Bands',
        settings: {
          before: { audioBands: state.audioBands },
          after: { audioBands: { ...DEFAULT_AUDIO_BANDS } },
        },
      })
      return {
        audioBands: { ...DEFAULT_AUDIO_BANDS },
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
      }
    }),

  // 100-Step History & Undo/Redo Engine Actions (Track 4 Task 4.1)
  undo: () => {
    const state = get()
    const current = getHistorySnapshotFromState(state)
    const restored = undoRedoManager.undo(current)
    if (!restored) return false
    const feedbackConfig = restored.feedbackConfig
    set({
      graphNodes: restored.graphNodes,
      graphEdges: restored.graphEdges,
      targetFps: restored.targetFps,
      resolutionScale: restored.resolutionScale,
      audioBands: restored.audioBands,
      selectedNodeId: restored.selectedNodeId,
      ...(feedbackConfig
        ? {
            selectedTemplateId: feedbackConfig.selectedTemplateId,
            feedbackEnabled: feedbackConfig.feedbackEnabled,
            feedbackBlendMode: feedbackConfig.feedbackBlendMode,
            feedbackOpacity: feedbackConfig.feedbackOpacity,
            feedbackScale: feedbackConfig.feedbackScale,
            feedbackRotation: feedbackConfig.feedbackRotation,
            feedbackPositionX: feedbackConfig.feedbackPositionX,
            feedbackPositionY: feedbackConfig.feedbackPositionY,
            isCustomFeedbackConfig: feedbackConfig.isCustomFeedbackConfig,
          }
        : {}),
      canUndo: undoRedoManager.canUndo(),
      canRedo: undoRedoManager.canRedo(),
    })
    return true
  },
  redo: () => {
    const state = get()
    const current = getHistorySnapshotFromState(state)
    const restored = undoRedoManager.redo(current)
    if (!restored) return false
    const feedbackConfig = restored.feedbackConfig
    set({
      graphNodes: restored.graphNodes,
      graphEdges: restored.graphEdges,
      targetFps: restored.targetFps,
      resolutionScale: restored.resolutionScale,
      audioBands: restored.audioBands,
      selectedNodeId: restored.selectedNodeId,
      ...(feedbackConfig
        ? {
            selectedTemplateId: feedbackConfig.selectedTemplateId,
            feedbackEnabled: feedbackConfig.feedbackEnabled,
            feedbackBlendMode: feedbackConfig.feedbackBlendMode,
            feedbackOpacity: feedbackConfig.feedbackOpacity,
            feedbackScale: feedbackConfig.feedbackScale,
            feedbackRotation: feedbackConfig.feedbackRotation,
            feedbackPositionX: feedbackConfig.feedbackPositionX,
            feedbackPositionY: feedbackConfig.feedbackPositionY,
            isCustomFeedbackConfig: feedbackConfig.isCustomFeedbackConfig,
          }
        : {}),
      canUndo: undoRedoManager.canUndo(),
      canRedo: undoRedoManager.canRedo(),
    })
    return true
  },
  recordHistorySnapshot: (description, options) => {
    const state = get()
    undoRedoManager.record(getHistorySnapshotFromState(state), {
      ...options,
      description: description ?? options?.description,
    })
    set({
      canUndo: undoRedoManager.canUndo(),
      canRedo: undoRedoManager.canRedo(),
    })
  },
  commitHistoryCoalescing: () => {
    undoRedoManager.commitCoalescing()
  },
  clearHistory: () => {
    undoRedoManager.clear()
    set({ canUndo: false, canRedo: false })
  },

  // Preset Import/Export Actions (Track 4 Task 4.3)
  exportPreset: (name?: string): Preset => {
    const state = get()
    return serializePreset({
      name: name ?? 'Visualització Composition',
      targetFps: state.targetFps,
      resolutionScale: state.resolutionScale,
      audioBands: state.audioBands,
      graphNodes: state.graphNodes,
      graphEdges: state.graphEdges,
      feedbackConfig: {
        selectedTemplateId: state.selectedTemplateId,
        feedbackEnabled: state.feedbackEnabled,
        feedbackBlendMode: state.feedbackBlendMode,
        feedbackOpacity: state.feedbackOpacity,
        feedbackScale: state.feedbackScale,
        feedbackRotation: state.feedbackRotation,
        feedbackPositionX: state.feedbackPositionX,
        feedbackPositionY: state.feedbackPositionY,
        isCustomFeedbackConfig: state.isCustomFeedbackConfig,
      },
    })
  },
  exportPresetJson: (name?: string, space = 2): string => {
    const state = get()
    return serializePresetToJson(
      {
        name: name ?? 'Visualització Composition',
        targetFps: state.targetFps,
        resolutionScale: state.resolutionScale,
        audioBands: state.audioBands,
        graphNodes: state.graphNodes,
        graphEdges: state.graphEdges,
        feedbackConfig: {
          selectedTemplateId: state.selectedTemplateId,
          feedbackEnabled: state.feedbackEnabled,
          feedbackBlendMode: state.feedbackBlendMode,
          feedbackOpacity: state.feedbackOpacity,
          feedbackScale: state.feedbackScale,
          feedbackRotation: state.feedbackRotation,
          feedbackPositionX: state.feedbackPositionX,
          feedbackPositionY: state.feedbackPositionY,
          isCustomFeedbackConfig: state.isCustomFeedbackConfig,
        },
      },
      space,
    )
  },
  loadPreset: (presetOrJson): { success: boolean; errors?: string[] } => {
    const result = deserializePreset(presetOrJson)
    if (!result.success) {
      return { success: false, errors: result.errors }
    }

    const state = get()
    const fb = result.feedbackConfig
    const beforeSnapshot = getHistorySnapshotFromState(state)
    const afterSnapshot: HistorySnapshot = {
      graphNodes: result.nodes,
      graphEdges: result.edges,
      targetFps: result.targetFps ?? state.targetFps,
      resolutionScale: result.resolutionScale ?? state.resolutionScale,
      audioBands: result.audioBands ?? state.audioBands,
      selectedNodeId: 'master-frame-buffer',
      feedbackConfig: fb
        ? {
            selectedTemplateId: fb.selectedTemplateId ?? state.selectedTemplateId,
            feedbackEnabled: fb.feedbackEnabled,
            feedbackBlendMode: fb.feedbackBlendMode,
            feedbackOpacity: fb.feedbackOpacity,
            feedbackScale: fb.feedbackScale,
            feedbackRotation: fb.feedbackRotation,
            feedbackPositionX: fb.feedbackPositionX,
            feedbackPositionY: fb.feedbackPositionY,
            isCustomFeedbackConfig: fb.isCustomFeedbackConfig ?? false,
          }
        : beforeSnapshot.feedbackConfig,
    }
    undoRedoManager.recordDelta({
      type: 'preset-load',
      description: `Load Preset ${result.metadata?.name ?? ''}`.trim(),
      fullSnapshotFallback: {
        before: beforeSnapshot,
        after: afterSnapshot,
      },
    })

    set({
      graphNodes: result.nodes,
      graphEdges: result.edges,
      targetFps: result.targetFps ?? state.targetFps,
      resolutionScale: result.resolutionScale ?? state.resolutionScale,
      audioBands: result.audioBands ?? state.audioBands,
      selectedNodeId: 'master-frame-buffer',
      ...(fb
        ? {
            selectedTemplateId: fb.selectedTemplateId ?? state.selectedTemplateId,
            feedbackEnabled: fb.feedbackEnabled,
            feedbackBlendMode: fb.feedbackBlendMode,
            feedbackOpacity: fb.feedbackOpacity,
            feedbackScale: fb.feedbackScale,
            feedbackRotation: fb.feedbackRotation,
            feedbackPositionX: fb.feedbackPositionX,
            feedbackPositionY: fb.feedbackPositionY,
            isCustomFeedbackConfig: fb.isCustomFeedbackConfig ?? false,
          }
        : {}),
      canUndo: undoRedoManager.canUndo(),
      canRedo: undoRedoManager.canRedo(),
    })

    return { success: true }
  },
}))
