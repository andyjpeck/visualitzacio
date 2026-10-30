import type { Edge, Node } from '@xyflow/react'
import type {
  AudioBandsSettings,
  ResolutionScale,
} from '../../contracts/preset-settings'

export const MAX_HISTORY_SNAPSHOTS = 100

export interface FeedbackSnapshot {
  selectedTemplateId: string
  feedbackEnabled: boolean
  feedbackBlendMode: string
  feedbackOpacity: number | string
  feedbackScale: number | string
  feedbackRotation: number | string
  feedbackPositionX: number | string
  feedbackPositionY: number | string
  isCustomFeedbackConfig: boolean
}

export interface HistorySnapshot {
  graphNodes: Node[]
  graphEdges: Edge[]
  targetFps: number
  resolutionScale: ResolutionScale
  audioBands: AudioBandsSettings
  selectedNodeId: string | null
  feedbackConfig?: FeedbackSnapshot
  description?: string
  timestamp?: number
}

export interface RecordOptions {
  /**
   * Unique key for a continuous input action (e.g. 'slider-scale', 'formula-typing').
   * Subsequent records with the same key within debounceMs coalesce into a single undo step.
   */
  coalescingKey?: string

  /**
   * Debounce period in milliseconds to auto-commit coalescing (default 500ms).
   */
  debounceMs?: number

  /**
   * Optional human-readable action description for telemetry or debugging.
   */
  description?: string
}

/**
 * 100-Step Immutable JSON History Engine with Continuous Input Coalescing.
 *
 * Implements an undo/redo stack capped at 100 snapshots. Supports coalescing
 * high-frequency continuous interactions (like slider drags or formula keystrokes)
 * so that an entire gesture records as exactly one undoable step.
 */
export class UndoRedoManager {
  private readonly past: HistorySnapshot[] = []
  private readonly future: HistorySnapshot[] = []
  private activeCoalescingKey: string | null = null
  private coalesceTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly maxDepth: number

  constructor(maxDepth = MAX_HISTORY_SNAPSHOTS) {
    this.maxDepth = maxDepth
  }

  public canUndo(): boolean {
    return this.past.length > 0
  }

  public canRedo(): boolean {
    return this.future.length > 0
  }

  public getHistoryDepth(): { past: number; future: number } {
    return {
      past: this.past.length,
      future: this.future.length,
    }
  }

  /**
   * Commits and terminates any active continuous coalescing session.
   */
  public commitCoalescing(): void {
    if (this.coalesceTimeout) {
      clearTimeout(this.coalesceTimeout)
      this.coalesceTimeout = null
    }
    this.activeCoalescingKey = null
  }

  /**
   * Records a snapshot into the history stack.
   *
   * If `coalescingKey` is specified:
   * - If no session with this key is active, the baseline snapshot is recorded and the session opens.
   * - Subsequent calls with the identical key within `debounceMs` restart the timer without
   *   creating duplicate undo entries.
   */
  public record(
    snapshot: HistorySnapshot,
    options?: RecordOptions,
  ): void {
    const key = options?.coalescingKey
    const debounceMs = options?.debounceMs ?? 500

    if (key) {
      if (this.activeCoalescingKey === key) {
        // Continuous action in progress: refresh debounce timer, do not add duplicate past state
        if (this.coalesceTimeout) {
          clearTimeout(this.coalesceTimeout)
        }
        this.coalesceTimeout = setTimeout(() => {
          this.commitCoalescing()
        }, debounceMs)
        return
      }

      // Fresh or different coalescing session
      this.commitCoalescing()
      this.activeCoalescingKey = key
      this.coalesceTimeout = setTimeout(() => {
        this.commitCoalescing()
      }, debounceMs)
    } else {
      this.commitCoalescing()
    }

    const cloned = this.cloneSnapshot(snapshot)
    if (options?.description) {
      cloned.description = options.description
    }
    cloned.timestamp = Date.now()

    this.past.push(cloned)
    if (this.past.length > this.maxDepth) {
      this.past.shift()
    }

    // New action always clears the redo stack
    this.future.length = 0
  }

  /**
   * Undoes the last action, moving currentState onto the redo stack and returning the previous snapshot.
   */
  public undo(currentState: HistorySnapshot): HistorySnapshot | null {
    this.commitCoalescing()
    if (!this.canUndo()) return null

    const previous = this.past.pop()
    if (!previous) return null

    const clonedCurrent = this.cloneSnapshot(currentState)
    clonedCurrent.timestamp = Date.now()

    this.future.push(clonedCurrent)
    if (this.future.length > this.maxDepth) {
      this.future.shift()
    }

    return this.cloneSnapshot(previous)
  }

  /**
   * Redoes the last undone action, moving currentState onto the undo stack and returning the next snapshot.
   */
  public redo(currentState: HistorySnapshot): HistorySnapshot | null {
    this.commitCoalescing()
    if (!this.canRedo()) return null

    const next = this.future.pop()
    if (!next) return null

    const clonedCurrent = this.cloneSnapshot(currentState)
    clonedCurrent.timestamp = Date.now()

    this.past.push(clonedCurrent)
    if (this.past.length > this.maxDepth) {
      this.past.shift()
    }

    return this.cloneSnapshot(next)
  }

  /**
   * Clears the entire history stack.
   */
  public clear(): void {
    this.commitCoalescing()
    this.past.length = 0
    this.future.length = 0
  }

  private cloneSnapshot(snapshot: HistorySnapshot): HistorySnapshot {
    return JSON.parse(JSON.stringify(snapshot))
  }
}
