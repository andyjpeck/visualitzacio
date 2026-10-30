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

  it('manages studio split ratio and reset functionality', () => {
    const store = useAppStore.getState()
    expect(store.studioSplitRatio).toBe(0.5)

    store.setStudioSplitRatio(0.6)
    expect(useAppStore.getState().studioSplitRatio).toBe(0.6)

    store.resetStudioSplitRatio()
    expect(useAppStore.getState().studioSplitRatio).toBe(0.5)
  })

  it('manages inspector vertical ratio and reset functionality', () => {
    const store = useAppStore.getState()
    expect(store.inspectorVerticalRatio).toBe(0.45)

    store.setInspectorVerticalRatio(0.55)
    expect(useAppStore.getState().inspectorVerticalRatio).toBe(0.55)

    store.resetInspectorVerticalRatio()
    expect(useAppStore.getState().inspectorVerticalRatio).toBe(0.45)
  })

  it('updates graph node data in real time via updateGraphNodeData', () => {
    const store = useAppStore.getState()
    const masterNode = store.graphNodes.find((n) => n.id === 'master-frame-buffer')
    expect(masterNode?.data.opacity).toBe(1.0)

    store.updateGraphNodeData('master-frame-buffer', { opacity: 0.75, blendMode: 'screen' })

    const updated = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'master-frame-buffer')
    expect(updated?.data.opacity).toBe(0.75)
    expect(updated?.data.blendMode).toBe('screen')
  })

  it('tracks focused parameter key and clears on node selection switch', () => {
    const store = useAppStore.getState()
    expect(store.focusedParamKey).toBeNull()

    store.setFocusedParamKey('blendMode')
    expect(useAppStore.getState().focusedParamKey).toBe('blendMode')

    store.setSelectedNodeId('test-visual-1')
    expect(useAppStore.getState().selectedNodeId).toBe('test-visual-1')
    expect(useAppStore.getState().focusedParamKey).toBeNull()
  })

  it('recursively deletes a container node and all its nested descendants via removeGraphNode', () => {
    const store = useAppStore.getState()
    store.addGraphNode({
      id: 'parent-buffer',
      type: 'frameBuffer',
      parentId: 'master-frame-buffer',
      position: { x: 20, y: 65 },
      data: { label: 'Parent Buffer' },
    })
    store.addGraphNode({
      id: 'child-buffer',
      type: 'frameBuffer',
      parentId: 'parent-buffer',
      position: { x: 20, y: 65 },
      data: { label: 'Child Buffer' },
    })
    store.addGraphNode({
      id: 'grandchild-synth',
      type: 'testVisual',
      parentId: 'child-buffer',
      position: { x: 20, y: 65 },
      data: { label: 'Grandchild Synth' },
    })

    // Verify all 3 added
    expect(useAppStore.getState().graphNodes.some((n) => n.id === 'parent-buffer')).toBe(true)
    expect(useAppStore.getState().graphNodes.some((n) => n.id === 'child-buffer')).toBe(true)
    expect(useAppStore.getState().graphNodes.some((n) => n.id === 'grandchild-synth')).toBe(true)

    // Remove parent container
    const success = store.removeGraphNode('parent-buffer')
    expect(success).toBe(true)

    // All 3 should be removed
    expect(useAppStore.getState().graphNodes.some((n) => n.id === 'parent-buffer')).toBe(false)
    expect(useAppStore.getState().graphNodes.some((n) => n.id === 'child-buffer')).toBe(false)
    expect(useAppStore.getState().graphNodes.some((n) => n.id === 'grandchild-synth')).toBe(false)

    // Master Output cannot be removed
    expect(store.removeGraphNode('master-frame-buffer')).toBe(false)
  })
})
