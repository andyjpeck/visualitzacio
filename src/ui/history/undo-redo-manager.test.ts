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
})
