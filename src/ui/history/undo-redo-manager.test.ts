import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type HistorySnapshot,
  MAX_HISTORY_SNAPSHOTS,
  UndoRedoManager,
} from './undo-redo-manager'
import { DEFAULT_AUDIO_BANDS } from '../../contracts/preset-settings'

function createSampleSnapshot(label: string, scale = 1.0): HistorySnapshot {
  return {
    graphNodes: [
      {
        id: 'master-frame-buffer',
        type: 'masterFrameBuffer',
        position: { x: 0, y: 0 },
        data: { label: 'Master Output' },
      },
      {
        id: 'node-1',
        type: 'testVisual',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 65 },
        data: { label, scale },
      },
    ],
    graphEdges: [],
    targetFps: 60,
    resolutionScale: 1.0,
    audioBands: { ...DEFAULT_AUDIO_BANDS },
    selectedNodeId: 'node-1',
  }
}

describe('UndoRedoManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with empty past and future and cannot undo or redo', () => {
    const manager = new UndoRedoManager()
    expect(manager.canUndo()).toBe(false)
    expect(manager.canRedo()).toBe(false)
    expect(manager.getHistoryDepth()).toEqual({ past: 0, future: 0 })
  })

  it('records discrete snapshots and performs single undo and redo', () => {
    const manager = new UndoRedoManager()
    const s0 = createSampleSnapshot('Initial', 1.0)
    const s1 = createSampleSnapshot('Scale Up', 1.5)

    manager.record(s0, { description: 'Initial state' })
    expect(manager.canUndo()).toBe(true)
    expect(manager.canRedo()).toBe(false)
    expect(manager.getHistoryDepth()).toEqual({ past: 1, future: 0 })

    // Undo from s1 back to s0
    const restored0 = manager.undo(s1)
    expect(restored0).not.toBeNull()
    expect(restored0?.graphNodes[1]?.data.label).toBe('Initial')
    expect(restored0?.graphNodes[1]?.data.scale).toBe(1.0)
    expect(manager.canUndo()).toBe(false)
    expect(manager.canRedo()).toBe(true)
    expect(manager.getHistoryDepth()).toEqual({ past: 0, future: 1 })

    // Redo back to s1
    const restored1 = manager.redo(restored0!)
    expect(restored1).not.toBeNull()
    expect(restored1?.graphNodes[1]?.data.label).toBe('Scale Up')
    expect(restored1?.graphNodes[1]?.data.scale).toBe(1.5)
    expect(manager.canUndo()).toBe(true)
    expect(manager.canRedo()).toBe(false)
  })

  it('caps history stack strictly at maxDepth (100 snapshots) using FIFO queue', () => {
    const manager = new UndoRedoManager(MAX_HISTORY_SNAPSHOTS)

    for (let i = 0; i < 120; i++) {
      manager.record(createSampleSnapshot(`Step ${i}`, i))
    }

    const depth = manager.getHistoryDepth()
    expect(depth.past).toBe(100)

    // The oldest 20 steps (0..19) should have been shifted out.
    // The top of past should be Step 119.
    const current = createSampleSnapshot('Current', 120)
    const last = manager.undo(current)
    expect(last?.graphNodes[1]?.data.label).toBe('Step 119')

    // Undo 98 more times to get down to the very oldest retained snapshot
    let oldest = last
    for (let i = 0; i < 98; i++) {
      oldest = manager.undo(oldest!)
    }
    expect(oldest?.graphNodes[1]?.data.label).toBe('Step 21')

    // One more undo reaches Step 20
    const veryFirst = manager.undo(oldest!)
    expect(veryFirst?.graphNodes[1]?.data.label).toBe('Step 20')
    expect(manager.canUndo()).toBe(false)
  })

  it('clears redo future stack when a new action is recorded after an undo', () => {
    const manager = new UndoRedoManager()
    const s0 = createSampleSnapshot('Step 0')
    const s1 = createSampleSnapshot('Step 1')
    const s2Branch = createSampleSnapshot('Branch Step 2')

    manager.record(s0)
    manager.record(s1)
    expect(manager.getHistoryDepth().past).toBe(2)

    // Undo to Step 1
    const undone = manager.undo(s1)
    expect(undone?.graphNodes[1]?.data.label).toBe('Step 1')
    expect(manager.canRedo()).toBe(true)

    // User takes a new branch action instead of redoing
    manager.record(s2Branch)
    expect(manager.canRedo()).toBe(false)
    expect(manager.getHistoryDepth().future).toBe(0)
  })

  it('coalesces rapid continuous input gestures into exactly one undoable step', () => {
    const manager = new UndoRedoManager()
    const initial = createSampleSnapshot('Baseline', 1.0)

    // Baseline before drag starts
    manager.record(initial, { coalescingKey: 'slider-scale', debounceMs: 500 })
    expect(manager.getHistoryDepth().past).toBe(1)

    // Simulating 60 FPS slider drag over 300ms
    for (let i = 1; i <= 20; i++) {
      const intermediate = createSampleSnapshot('Dragging', 1.0 + i * 0.05)
      manager.record(intermediate, { coalescingKey: 'slider-scale', debounceMs: 500 })
      vi.advanceTimersByTime(16) // ~16ms per frame
    }

    // Still only 1 baseline snapshot recorded in past
    expect(manager.getHistoryDepth().past).toBe(1)

    // Advance beyond debounce window (500ms) to commit coalescing
    vi.advanceTimersByTime(600)

    // Final state of the drag
    const finalDragState = createSampleSnapshot('Dragging', 2.0)

    // Performing undo should directly revert to 'Baseline' (1.0), not any intermediate frame!
    const reverted = manager.undo(finalDragState)
    expect(reverted?.graphNodes[1]?.data.label).toBe('Baseline')
    expect(reverted?.graphNodes[1]?.data.scale).toBe(1.0)

    // Redo returns to final drag state (2.0)
    const redone = manager.redo(reverted!)
    expect(redone?.graphNodes[1]?.data.scale).toBe(2.0)
  })

  it('explicit commitCoalescing seals the session immediately', () => {
    const manager = new UndoRedoManager()
    const s0 = createSampleSnapshot('S0', 1.0)
    manager.record(s0, { coalescingKey: 'text-typing', debounceMs: 500 })

    const s1 = createSampleSnapshot('S1', 1.1)
    manager.record(s1, { coalescingKey: 'text-typing', debounceMs: 500 })
    expect(manager.getHistoryDepth().past).toBe(1)

    // Explicitly commit (e.g. on pointer up or focus blur)
    manager.commitCoalescing()

    // Subsequent edit with same key creates a distinct new snapshot
    const s2 = createSampleSnapshot('S2', 1.2)
    manager.record(s2, { coalescingKey: 'text-typing', debounceMs: 500 })
    expect(manager.getHistoryDepth().past).toBe(2)
  })

  it('ensures deep clone immutability so in-place mutations do not corrupt snapshots', () => {
    const manager = new UndoRedoManager()
    const original = createSampleSnapshot('Original', 1.0)
    manager.record(original)

    // Mutate the original object directly
    original.graphNodes[1]!.data.label = 'MUTATED'
    original.graphNodes[1]!.data.scale = 999.0

    const restored = manager.undo(original)
    expect(restored?.graphNodes[1]?.data.label).toBe('Original')
    expect(restored?.graphNodes[1]?.data.scale).toBe(1.0)
  })

  it('clears past and future on clear()', () => {
    const manager = new UndoRedoManager()
    manager.record(createSampleSnapshot('S0'))
    manager.record(createSampleSnapshot('S1'))
    manager.undo(createSampleSnapshot('Current'))

    expect(manager.canUndo()).toBe(true)
    expect(manager.canRedo()).toBe(true)

    manager.clear()
    expect(manager.canUndo()).toBe(false)
    expect(manager.canRedo()).toBe(false)
    expect(manager.getHistoryDepth()).toEqual({ past: 0, future: 0 })
  })

  describe('Semantic Action Deltas & Memory Efficiency', () => {
    it('stores only the semantic delta and does not duplicate entire node graphs or heavy payloads', () => {
      const manager = new UndoRedoManager()

      // Node 0 has a heavy 100KB Base64 image payload that never changes
      const heavyImagePayload = 'data:image/png;base64,' + 'A'.repeat(100000)
      const baseState: HistorySnapshot = {
        graphNodes: [
          {
            id: 'master-frame-buffer',
            type: 'masterFrameBuffer',
            position: { x: 0, y: 0 },
            data: { label: 'Master Output', imageBase64: heavyImagePayload },
          },
          {
            id: 'node-1',
            type: 'testVisual',
            parentId: 'master-frame-buffer',
            position: { x: 20, y: 65 },
            data: { label: 'Crystal Synth', opacity: 0.5, scale: 1.0 },
          },
        ],
        graphEdges: [],
        targetFps: 60,
        resolutionScale: 1.0,
        audioBands: { ...DEFAULT_AUDIO_BANDS },
        selectedNodeId: 'node-1',
      }

      // User adjusts opacity on node-1: record a semantic action delta
      manager.recordDelta({
        type: 'update-node',
        description: 'Adjust Opacity',
        modifiedNodes: [
          {
            id: 'node-1',
            beforeData: { opacity: 0.5 },
            afterData: { opacity: 0.9 },
          },
        ],
      })

      // Verify the history stack has exactly 1 entry, which is a SemanticActionDelta
      const pastDeltas = manager.getPastDeltas()
      expect(pastDeltas).toHaveLength(1)
      const delta = pastDeltas[0]!
      expect(delta.type).toBe('update-node')
      expect(delta.description).toBe('Adjust Opacity')

      // Assert that heavy payload is NEVER duplicated in the delta
      expect(JSON.stringify(delta)).not.toContain(heavyImagePayload)
      expect(delta.modifiedNodes?.[0]?.beforeData).toEqual({ opacity: 0.5 })
      expect(delta.modifiedNodes?.[0]?.afterData).toEqual({ opacity: 0.9 })

      // Mutated current state (where opacity is 0.9)
      const mutatedState: HistorySnapshot = {
        ...baseState,
        graphNodes: [
          baseState.graphNodes[0]!,
          {
            ...baseState.graphNodes[1]!,
            data: { ...baseState.graphNodes[1]!.data, opacity: 0.9 },
          },
        ],
      }

      // Undo restores opacity to 0.5 without touching the heavy image node
      const undone = manager.undo(mutatedState)
      expect(undone).not.toBeNull()
      expect(undone?.graphNodes[1]?.data.opacity).toBe(0.5)
      expect(undone?.graphNodes[0]?.data.imageBase64).toBe(heavyImagePayload)

      // Redo restores opacity to 0.9
      const redone = manager.redo(undone!)
      expect(redone).not.toBeNull()
      expect(redone?.graphNodes[1]?.data.opacity).toBe(0.9)
    })

    it('handles structural addition and deletion deltas with original index restoration', () => {
      const manager = new UndoRedoManager()
      const baseState = createSampleSnapshot('Base')

      const newNode = {
        id: 'node-2',
        type: 'testVisual',
        parentId: 'master-frame-buffer',
        position: { x: 30, y: 150 },
        data: { label: 'New Child Layer' },
      }

      // 1. Record Add Node delta
      manager.recordDelta({
        type: 'add-node',
        description: 'Add Layer',
        addedNodes: [newNode],
        addedEdges: [],
      })

      const stateWithNode: HistorySnapshot = {
        ...baseState,
        graphNodes: [...baseState.graphNodes, newNode],
      }

      // Undo addition
      const undoneAdd = manager.undo(stateWithNode)
      expect(undoneAdd?.graphNodes).toHaveLength(2)
      expect(undoneAdd?.graphNodes.find((n) => n.id === 'node-2')).toBeUndefined()

      // Redo addition
      const redoneAdd = manager.redo(undoneAdd!)
      expect(redoneAdd?.graphNodes).toHaveLength(3)
      expect(redoneAdd?.graphNodes.find((n) => n.id === 'node-2')).toBeDefined()

      // 2. Record Delete Node delta
      manager.recordDelta({
        type: 'delete-node',
        description: 'Delete Layer',
        deletedNodes: [newNode],
        deletedEdges: [],
        deletedIndices: [{ id: 'node-2', index: 2 }],
      })

      // Undo deletion restores the node at its exact original index
      const undoneDelete = manager.undo(baseState)
      expect(undoneDelete?.graphNodes).toHaveLength(3)
      expect(undoneDelete?.graphNodes[2]?.id).toBe('node-2')

      // Redo deletion removes it again
      const redoneDelete = manager.redo(undoneDelete!)
      expect(redoneDelete?.graphNodes).toHaveLength(2)
      expect(redoneDelete?.graphNodes.find((n) => n.id === 'node-2')).toBeUndefined()
    })

    it('handles layer reordering and reparenting deltas', () => {
      const manager = new UndoRedoManager()
      const baseState: HistorySnapshot = {
        graphNodes: [
          { id: 'master-frame-buffer', type: 'masterFrameBuffer', position: { x: 0, y: 0 }, data: {} },
          { id: 'layer-a', type: 'testVisual', parentId: 'master-frame-buffer', position: { x: 10, y: 10 }, data: {} },
          { id: 'layer-b', type: 'testVisual', parentId: 'master-frame-buffer', position: { x: 10, y: 50 }, data: {} },
        ],
        graphEdges: [],
        targetFps: 60,
        resolutionScale: 1.0,
        audioBands: { ...DEFAULT_AUDIO_BANDS },
        selectedNodeId: 'layer-a',
      }

      // Reorder delta: swap layer-a and layer-b
      manager.recordDelta({
        type: 'reorder-nodes',
        description: 'Reorder Layers',
        reorderedNodeIds: {
          before: ['master-frame-buffer', 'layer-a', 'layer-b'],
          after: ['master-frame-buffer', 'layer-b', 'layer-a'],
        },
      })

      const reorderedState: HistorySnapshot = {
        ...baseState,
        graphNodes: [
          baseState.graphNodes[0]!,
          baseState.graphNodes[2]!,
          baseState.graphNodes[1]!,
        ],
      }

      const undoneOrder = manager.undo(reorderedState)
      expect(undoneOrder?.graphNodes.map((n) => n.id)).toEqual([
        'master-frame-buffer',
        'layer-a',
        'layer-b',
      ])

      const redoneOrder = manager.redo(undoneOrder!)
      expect(redoneOrder?.graphNodes.map((n) => n.id)).toEqual([
        'master-frame-buffer',
        'layer-b',
        'layer-a',
      ])

      // Reparent delta: move layer-b into another container
      manager.recordDelta({
        type: 'reparent-node',
        description: 'Reparent Layer',
        nodeId: 'layer-b',
        beforeParentId: 'master-frame-buffer',
        afterParentId: 'nested-container',
        beforePosition: { x: 10, y: 50 },
        afterPosition: { x: 20, y: 100 },
      })

      const reparentedState: HistorySnapshot = {
        ...reorderedState,
        graphNodes: reorderedState.graphNodes.map((n) =>
          n.id === 'layer-b'
            ? { ...n, parentId: 'nested-container', position: { x: 20, y: 100 } }
            : n,
        ),
      }

      const undoneReparent = manager.undo(reparentedState)
      const restoredNode = undoneReparent?.graphNodes.find((n) => n.id === 'layer-b')
      expect(restoredNode?.parentId).toBe('master-frame-buffer')
      expect(restoredNode?.position).toEqual({ x: 10, y: 50 })

      const redoneReparent = manager.redo(undoneReparent!)
      const reRestoredNode = redoneReparent?.graphNodes.find((n) => n.id === 'layer-b')
      expect(reRestoredNode?.parentId).toBe('nested-container')
      expect(reRestoredNode?.position).toEqual({ x: 20, y: 100 })
    })

    it('in-place coalescing updates afterData on top delta without adding stack frames', () => {
      const manager = new UndoRedoManager()

      // Dragging a slider from 0.1 to 0.9 across 50 frames
      for (let i = 1; i <= 50; i++) {
        manager.recordDelta(
          {
            type: 'update-node',
            description: 'Slider Drag',
            modifiedNodes: [
              {
                id: 'node-1',
                beforeData: { opacity: 0.1 },
                afterData: { opacity: 0.1 + i * 0.016 },
              },
            ],
          },
          { coalescingKey: 'slider-opacity-node-1', debounceMs: 500 },
        )
      }

      // Expect exactly 1 delta on past stack!
      const past = manager.getPastDeltas()
      expect(past).toHaveLength(1)
      expect(past[0]?.modifiedNodes?.[0]?.beforeData).toEqual({ opacity: 0.1 })
      expect(past[0]?.modifiedNodes?.[0]?.afterData?.opacity).toBeCloseTo(0.9, 2)
    })
  })
})
