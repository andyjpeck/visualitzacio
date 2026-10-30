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

export type SemanticActionType =
  | 'update-node'
  | 'add-node'
  | 'delete-node'
  | 'reorder-nodes'
  | 'reparent-node'
  | 'update-settings'
  | 'update-feedback'
  | 'preset-load'
  | 'batch'
  | 'snapshot-delta'

export interface NodeDelta {
  id: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  beforePosition?: { x: number; y: number }
  afterPosition?: { x: number; y: number }
  beforeParentId?: string | null
  afterParentId?: string | null
}

export interface SettingsDelta {
  before?: Partial<{
    targetFps: number
    resolutionScale: ResolutionScale
    audioBands: AudioBandsSettings
    selectedNodeId: string | null
  }>
  after?: Partial<{
    targetFps: number
    resolutionScale: ResolutionScale
    audioBands: AudioBandsSettings
    selectedNodeId: string | null
  }>
}

export interface FeedbackDelta {
  before?: Partial<FeedbackSnapshot>
  after?: Partial<FeedbackSnapshot>
}

/**
 * Fine-grained semantic action delta representing only what changed between history states.
 */
export interface SemanticActionDelta {
  type: SemanticActionType
  description?: string
  timestamp?: number
  coalescingKey?: string

  // Node parameter and transform modifications (only changed keys)
  modifiedNodes?: NodeDelta[]

  // Structural additions and deletions
  addedNodes?: Node[]
  addedEdges?: Edge[]
  deletedNodes?: Node[]
  deletedEdges?: Edge[]
  deletedIndices?: { id: string; index: number }[]

  // Ordering and hierarchy
  reorderedNodeIds?: {
    before: string[]
    after: string[]
  }
  nodeId?: string
  beforeParentId?: string | null
  afterParentId?: string | null
  beforePosition?: { x: number; y: number }
  afterPosition?: { x: number; y: number }

  // Global settings and feedback modulation
  settings?: SettingsDelta
  feedback?: FeedbackDelta

  // Composite sub-actions
  deltas?: SemanticActionDelta[]

  // Full-snapshot fallback reserved exclusively for complete preset replacements
  fullSnapshotFallback?: {
    before: HistorySnapshot
    after: HistorySnapshot
  }

  // Transient snapshot holder for single-argument record() calls
  beforeSnapshot?: HistorySnapshot
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Computes a fine-grained SemanticActionDelta by diffing two HistorySnapshots.
 * Stores strictly the changed keys, eliminating redundant graph copying.
 */
export function computeSemanticDelta(
  before: HistorySnapshot,
  after: HistorySnapshot,
  description?: string,
): SemanticActionDelta {
  const delta: SemanticActionDelta = {
    type: 'batch',
    description: description ?? 'State Change',
    timestamp: Date.now(),
  }

  // 1. Settings Diff
  const settingsBefore: NonNullable<SettingsDelta['before']> = {}
  const settingsAfter: NonNullable<SettingsDelta['after']> = {}
  let settingsChanged = false

  if (before.targetFps !== after.targetFps) {
    settingsBefore.targetFps = before.targetFps
    settingsAfter.targetFps = after.targetFps
    settingsChanged = true
  }
  if (before.resolutionScale !== after.resolutionScale) {
    settingsBefore.resolutionScale = before.resolutionScale
    settingsAfter.resolutionScale = after.resolutionScale
    settingsChanged = true
  }
  if (before.selectedNodeId !== after.selectedNodeId) {
    settingsBefore.selectedNodeId = before.selectedNodeId
    settingsAfter.selectedNodeId = after.selectedNodeId
    settingsChanged = true
  }
  if (JSON.stringify(before.audioBands) !== JSON.stringify(after.audioBands)) {
    settingsBefore.audioBands = deepClone(before.audioBands)
    settingsAfter.audioBands = deepClone(after.audioBands)
    settingsChanged = true
  }

  if (settingsChanged) {
    delta.settings = { before: settingsBefore, after: settingsAfter }
  }

  // 2. Feedback Diff
  if (before.feedbackConfig && after.feedbackConfig) {
    const fbBefore: Partial<FeedbackSnapshot> = {}
    const fbAfter: Partial<FeedbackSnapshot> = {}
    let fbChanged = false

    const keys: (keyof FeedbackSnapshot)[] = [
      'selectedTemplateId',
      'feedbackEnabled',
      'feedbackBlendMode',
      'feedbackOpacity',
      'feedbackScale',
      'feedbackRotation',
      'feedbackPositionX',
      'feedbackPositionY',
      'isCustomFeedbackConfig',
    ]

    for (const key of keys) {
      if (before.feedbackConfig[key] !== after.feedbackConfig[key]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fbBefore as any)[key] = before.feedbackConfig[key]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fbAfter as any)[key] = after.feedbackConfig[key]
        fbChanged = true
      }
    }

    if (fbChanged) {
      delta.feedback = { before: fbBefore, after: fbAfter }
    }
  }

  // 3. Node Graph Diff
  const beforeNodeMap = new Map(before.graphNodes.map((n) => [n.id, n]))
  const afterNodeMap = new Map(after.graphNodes.map((n) => [n.id, n]))

  // Added nodes
  const addedNodes: Node[] = []
  for (const [id, node] of afterNodeMap) {
    if (!beforeNodeMap.has(id)) {
      addedNodes.push(deepClone(node))
    }
  }

  // Deleted nodes
  const deletedNodes: Node[] = []
  const deletedIndices: { id: string; index: number }[] = []
  before.graphNodes.forEach((node, index) => {
    if (!afterNodeMap.has(node.id)) {
      deletedNodes.push(deepClone(node))
      deletedIndices.push({ id: node.id, index })
    }
  })

  // Modified nodes (same ID, changed properties)
  const modifiedNodes: NodeDelta[] = []
  for (const [id, afterNode] of afterNodeMap) {
    const beforeNode = beforeNodeMap.get(id)
    if (!beforeNode) continue

    const beforeData: Record<string, unknown> = {}
    const afterData: Record<string, unknown> = {}
    let dataChanged = false

    const allDataKeys = new Set([
      ...Object.keys(beforeNode.data ?? {}),
      ...Object.keys(afterNode.data ?? {}),
    ])

    for (const key of allDataKeys) {
      const bVal = (beforeNode.data as Record<string, unknown>)?.[key]
      const aVal = (afterNode.data as Record<string, unknown>)?.[key]
      if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
        beforeData[key] = deepClone(bVal)
        afterData[key] = deepClone(aVal)
        dataChanged = true
      }
    }

    const posChanged =
      beforeNode.position?.x !== afterNode.position?.x ||
      beforeNode.position?.y !== afterNode.position?.y
    const parentChanged = beforeNode.parentId !== afterNode.parentId

    if (dataChanged || posChanged || parentChanged) {
      modifiedNodes.push({
        id,
        ...(dataChanged ? { beforeData, afterData } : {}),
        ...(posChanged
          ? {
              beforePosition: deepClone(beforeNode.position),
              afterPosition: deepClone(afterNode.position),
            }
          : {}),
        ...(parentChanged
          ? {
              beforeParentId: beforeNode.parentId ?? null,
              afterParentId: afterNode.parentId ?? null,
            }
          : {}),
      })
    }
  }

  // Ordering diff
  const beforeIds = before.graphNodes.map((n) => n.id)
  const afterIds = after.graphNodes.map((n) => n.id)
  const isReordered =
    addedNodes.length === 0 &&
    deletedNodes.length === 0 &&
    beforeIds.length === afterIds.length &&
    beforeIds.some((id, idx) => id !== afterIds[idx])

  if (isReordered) {
    delta.reorderedNodeIds = { before: beforeIds, after: afterIds }
  }
  if (addedNodes.length > 0) delta.addedNodes = addedNodes
  if (deletedNodes.length > 0) {
    delta.deletedNodes = deletedNodes
    delta.deletedIndices = deletedIndices
  }
  if (modifiedNodes.length > 0) delta.modifiedNodes = modifiedNodes

  // 4. Edges Diff
  const beforeEdgeMap = new Map(before.graphEdges.map((e) => [e.id, e]))
  const afterEdgeMap = new Map(after.graphEdges.map((e) => [e.id, e]))

  const addedEdges = after.graphEdges
    .filter((e) => !beforeEdgeMap.has(e.id))
    .map(deepClone)
  const deletedEdges = before.graphEdges
    .filter((e) => !afterEdgeMap.has(e.id))
    .map(deepClone)

  if (addedEdges.length > 0) delta.addedEdges = addedEdges
  if (deletedEdges.length > 0) delta.deletedEdges = deletedEdges

  // 5. Categorize primary semantic action type
  if (
    addedNodes.length > 0 &&
    deletedNodes.length === 0 &&
    modifiedNodes.length === 0
  ) {
    delta.type = 'add-node'
  } else if (
    deletedNodes.length > 0 &&
    addedNodes.length === 0 &&
    modifiedNodes.length === 0
  ) {
    delta.type = 'delete-node'
  } else if (isReordered && modifiedNodes.length === 0) {
    delta.type = 'reorder-nodes'
  } else if (
    modifiedNodes.length === 1 &&
    modifiedNodes[0]?.beforeParentId !== undefined &&
    !dataChangedAny(modifiedNodes)
  ) {
    delta.type = 'reparent-node'
    delta.nodeId = modifiedNodes[0].id
    delta.beforeParentId = modifiedNodes[0].beforeParentId
    delta.afterParentId = modifiedNodes[0].afterParentId
    delta.beforePosition = modifiedNodes[0].beforePosition
    delta.afterPosition = modifiedNodes[0].afterPosition
  } else if (
    modifiedNodes.length > 0 &&
    addedNodes.length === 0 &&
    deletedNodes.length === 0 &&
    !settingsChanged &&
    !delta.feedback
  ) {
    delta.type = 'update-node'
  } else if (
    settingsChanged &&
    !delta.feedback &&
    addedNodes.length === 0 &&
    deletedNodes.length === 0 &&
    modifiedNodes.length === 0
  ) {
    delta.type = 'update-settings'
  } else if (
    delta.feedback &&
    !settingsChanged &&
    addedNodes.length === 0 &&
    deletedNodes.length === 0 &&
    modifiedNodes.length === 0
  ) {
    delta.type = 'update-feedback'
  } else {
    delta.type = 'batch'
  }

  return delta
}

function dataChangedAny(mods: NodeDelta[]): boolean {
  return mods.some((m) => m.beforeData && Object.keys(m.beforeData).length > 0)
}

/**
 * Applies a SemanticActionDelta in either 'undo' or 'redo' direction to reconstruct
 * the target state without storing full presets on the history stack.
 */
export function applySemanticDelta(
  currentState: HistorySnapshot,
  delta: SemanticActionDelta,
  direction: 'undo' | 'redo',
): HistorySnapshot {
  const isUndo = direction === 'undo'

  if (delta.type === 'snapshot-delta') {
    // If delta was recorded as a raw snapshot fallback
    return delta.beforeSnapshot ? deepClone(delta.beforeSnapshot) : currentState
  }

  if (delta.type === 'preset-load') {
    const target = isUndo
      ? delta.fullSnapshotFallback?.before
      : delta.fullSnapshotFallback?.after
    return target ? deepClone(target) : currentState
  }

  let nextNodes = [...currentState.graphNodes]
  let nextEdges = [...currentState.graphEdges]
  let nextSettings = {
    targetFps: currentState.targetFps,
    resolutionScale: currentState.resolutionScale,
    audioBands: currentState.audioBands,
    selectedNodeId: currentState.selectedNodeId,
  }
  let nextFeedback = currentState.feedbackConfig
    ? { ...currentState.feedbackConfig }
    : undefined

  // 1. Apply Settings
  if (delta.settings) {
    const patch = isUndo ? delta.settings.before : delta.settings.after
    if (patch) {
      nextSettings = {
        targetFps: patch.targetFps ?? nextSettings.targetFps,
        resolutionScale: patch.resolutionScale ?? nextSettings.resolutionScale,
        audioBands: patch.audioBands ? deepClone(patch.audioBands) : nextSettings.audioBands,
        selectedNodeId:
          patch.selectedNodeId !== undefined
            ? patch.selectedNodeId
            : nextSettings.selectedNodeId,
      }
    }
  }

  // 2. Apply Feedback
  if (delta.feedback && nextFeedback) {
    const patch = isUndo ? delta.feedback.before : delta.feedback.after
    if (patch) {
      nextFeedback = {
        ...nextFeedback,
        ...patch,
      }
    }
  }

  // 3. Apply Node Modifications
  if (delta.modifiedNodes && delta.modifiedNodes.length > 0) {
    const modMap = new Map(delta.modifiedNodes.map((m) => [m.id, m]))
    nextNodes = nextNodes.map((node) => {
      const mod = modMap.get(node.id)
      if (!mod) return node

      const dataPatch = isUndo ? mod.beforeData : mod.afterData
      const posPatch = isUndo ? mod.beforePosition : mod.afterPosition
      const parentPatch = isUndo ? mod.beforeParentId : mod.afterParentId

      return {
        ...node,
        ...(posPatch ? { position: deepClone(posPatch) } : {}),
        ...(parentPatch !== undefined
          ? { parentId: parentPatch ?? undefined }
          : {}),
        ...(dataPatch
          ? { data: { ...(node.data as Record<string, unknown>), ...deepClone(dataPatch) } }
          : {}),
      }
    })
  }

  // 4. Apply Reparent Node
  if (delta.type === 'reparent-node' && delta.nodeId) {
    const targetParent = isUndo ? delta.beforeParentId : delta.afterParentId
    const targetPos = isUndo ? delta.beforePosition : delta.afterPosition
    nextNodes = nextNodes.map((node) => {
      if (node.id !== delta.nodeId) return node
      return {
        ...node,
        parentId: targetParent ?? undefined,
        ...(targetPos ? { position: deepClone(targetPos) } : {}),
      }
    })
  }

  // 5. Apply Add / Delete Nodes & Edges
  if (delta.addedNodes && delta.addedNodes.length > 0) {
    if (isUndo) {
      const addedIds = new Set(delta.addedNodes.map((n) => n.id))
      nextNodes = nextNodes.filter((n) => !addedIds.has(n.id))
    } else {
      nextNodes = [...nextNodes, ...delta.addedNodes.map(deepClone)]
    }
  }

  if (delta.deletedNodes && delta.deletedNodes.length > 0) {
    if (isUndo) {
      const restored = [...nextNodes]
      const indices = delta.deletedIndices ?? []
      for (const node of delta.deletedNodes) {
        const found = indices.find((i) => i.id === node.id)
        const targetIdx =
          found && found.index <= restored.length ? found.index : restored.length
        restored.splice(targetIdx, 0, deepClone(node))
      }
      nextNodes = restored
    } else {
      const deletedIds = new Set(delta.deletedNodes.map((n) => n.id))
      nextNodes = nextNodes.filter((n) => !deletedIds.has(n.id))
    }
  }

  if (delta.addedEdges && delta.addedEdges.length > 0) {
    if (isUndo) {
      const addedEdgeIds = new Set(delta.addedEdges.map((e) => e.id))
      nextEdges = nextEdges.filter((e) => !addedEdgeIds.has(e.id))
    } else {
      nextEdges = [...nextEdges, ...delta.addedEdges.map(deepClone)]
    }
  }

  if (delta.deletedEdges && delta.deletedEdges.length > 0) {
    if (isUndo) {
      nextEdges = [...nextEdges, ...delta.deletedEdges.map(deepClone)]
    } else {
      const deletedEdgeIds = new Set(delta.deletedEdges.map((e) => e.id))
      nextEdges = nextEdges.filter((e) => !deletedEdgeIds.has(e.id))
    }
  }

  // 6. Apply Reordering
  if (delta.reorderedNodeIds) {
    const order = isUndo
      ? delta.reorderedNodeIds.before
      : delta.reorderedNodeIds.after
    if (order && order.length > 0) {
      const nodeMap = new Map(nextNodes.map((n) => [n.id, n]))
      const sorted: Node[] = []
      for (const id of order) {
        const node = nodeMap.get(id)
        if (node) {
          sorted.push(node)
          nodeMap.delete(id)
        }
      }
      for (const remaining of nodeMap.values()) {
        sorted.push(remaining)
      }
      nextNodes = sorted
    }
  }

  // 7. Apply Sub-deltas for composite batches
  if (delta.deltas && delta.deltas.length > 0) {
    let composite: HistorySnapshot = {
      ...currentState,
      graphNodes: nextNodes,
      graphEdges: nextEdges,
      ...nextSettings,
      feedbackConfig: nextFeedback,
    }
    if (isUndo) {
      for (let i = delta.deltas.length - 1; i >= 0; i--) {
        composite = applySemanticDelta(composite, delta.deltas[i]!, 'undo')
      }
    } else {
      for (let i = 0; i < delta.deltas.length; i++) {
        composite = applySemanticDelta(composite, delta.deltas[i]!, 'redo')
      }
    }
    return composite
  }

  return {
    ...currentState,
    graphNodes: nextNodes,
    graphEdges: nextEdges,
    ...nextSettings,
    feedbackConfig: nextFeedback,
    description: delta.description,
    timestamp: Date.now(),
  }
}

/**
 * 100-Step History Engine Powered by Semantic Action Deltas.
 *
 * Instead of storing full preset snapshots at every history frame, only fine-grained
 * semantic diffs (parameter mutations, node additions/deletions, reordering) are stored,
 * reducing memory consumption by orders of magnitude while ensuring 100% reversible undo/redo.
 */
export class UndoRedoManager {
  private readonly past: SemanticActionDelta[] = []
  private readonly future: SemanticActionDelta[] = []
  private activeCoalescingKey: string | null = null
  private coalesceTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly maxDepth: number
  private pendingBaseline: HistorySnapshot | null = null

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

  public getPastDeltas(): readonly SemanticActionDelta[] {
    return this.past
  }

  public getFutureDeltas(): readonly SemanticActionDelta[] {
    return this.future
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
   * Records an explicit SemanticActionDelta onto the history stack.
   * Seamlessly coalesces continuous input gestures (e.g. slider drags, debounced typing)
   * into a single undo frame by updating after-values in place.
   */
  public recordDelta(
    delta: SemanticActionDelta,
    options?: RecordOptions,
  ): void {
    const key = options?.coalescingKey ?? delta.coalescingKey
    const debounceMs = options?.debounceMs ?? 500

    if (key) {
      if (this.activeCoalescingKey === key && this.past.length > 0) {
        const top = this.past[this.past.length - 1]
        if (top && top.coalescingKey === key) {
          if (this.coalesceTimeout) {
            clearTimeout(this.coalesceTimeout)
          }
          this.coalesceTimeout = setTimeout(() => {
            this.commitCoalescing()
          }, debounceMs)

          // In-place coalescing: preserve initial before values, advance after values
          this.coalesceDelta(top, delta)
          return
        }
      }

      this.commitCoalescing()
      this.activeCoalescingKey = key
      this.coalesceTimeout = setTimeout(() => {
        this.commitCoalescing()
      }, debounceMs)
    } else {
      this.commitCoalescing()
    }

    const recordedDelta = deepClone(delta)
    if (options?.description) {
      recordedDelta.description = options.description
    }
    if (key) {
      recordedDelta.coalescingKey = key
    }
    recordedDelta.timestamp = Date.now()

    this.past.push(recordedDelta)
    if (this.past.length > this.maxDepth) {
      this.past.shift()
    }

    this.future.length = 0
    this.pendingBaseline = null
  }

  /**
   * Computes and records the semantic delta between a baseline and a mutated snapshot.
   */
  public recordChange(
    before: HistorySnapshot,
    after: HistorySnapshot,
    options?: RecordOptions,
  ): void {
    const delta = computeSemanticDelta(before, after, options?.description)
    this.recordDelta(delta, options)
  }

  /**
   * Universal record method accepting either a SemanticActionDelta or a baseline HistorySnapshot.
   */
  public record(
    snapshotOrDelta: HistorySnapshot | SemanticActionDelta,
    options?: RecordOptions,
  ): void {
    // If already a SemanticActionDelta
    if ('type' in snapshotOrDelta && typeof snapshotOrDelta.type === 'string') {
      this.recordDelta(snapshotOrDelta as SemanticActionDelta, options)
      return
    }

    const snapshot = snapshotOrDelta as HistorySnapshot

    // If a baseline was already pending, compute diff between pending baseline and incoming snapshot
    if (this.pendingBaseline) {
      const delta = computeSemanticDelta(
        this.pendingBaseline,
        snapshot,
        options?.description,
      )
      this.recordDelta(delta, options)
      this.pendingBaseline = deepClone(snapshot)
      return
    }

    // First snapshot recorded: store as pending baseline
    this.pendingBaseline = deepClone(snapshot)
    // Create a snapshot delta entry so canUndo() is true
    this.recordDelta(
      {
        type: 'snapshot-delta',
        description: options?.description ?? 'State Baseline',
        beforeSnapshot: deepClone(snapshot),
        coalescingKey: options?.coalescingKey,
      },
      options,
    )
  }

  /**
   * Undoes the last semantic action, reversing the delta against currentState and returning the restored state.
   */
  public undo(currentState: HistorySnapshot): HistorySnapshot | null {
    this.commitCoalescing()
    if (!this.canUndo()) return null

    let delta = this.past.pop()
    if (!delta) return null

    // If delta was recorded as a raw snapshot baseline, compute real semantic diff on the fly
    if (delta.type === 'snapshot-delta' && delta.beforeSnapshot) {
      delta = computeSemanticDelta(
        delta.beforeSnapshot,
        currentState,
        delta.description,
      )
    }

    const restored = applySemanticDelta(currentState, delta, 'undo')

    this.future.push(delta)
    if (this.future.length > this.maxDepth) {
      this.future.shift()
    }

    return restored
  }

  /**
   * Redoes the last undone semantic action, advancing currentState along the delta.
   */
  public redo(currentState: HistorySnapshot): HistorySnapshot | null {
    this.commitCoalescing()
    if (!this.canRedo()) return null

    const delta = this.future.pop()
    if (!delta) return null

    const advanced = applySemanticDelta(currentState, delta, 'redo')

    this.past.push(delta)
    if (this.past.length > this.maxDepth) {
      this.past.shift()
    }

    return advanced
  }

  /**
   * Clears the entire history stack.
   */
  public clear(): void {
    this.commitCoalescing()
    this.past.length = 0
    this.future.length = 0
    this.pendingBaseline = null
  }

  private coalesceDelta(target: SemanticActionDelta, incoming: SemanticActionDelta): void {
    target.timestamp = Date.now()

    if (target.type === 'update-node' && incoming.modifiedNodes) {
      target.modifiedNodes = target.modifiedNodes ?? []
      for (const incMod of incoming.modifiedNodes) {
        const existing = target.modifiedNodes.find((m) => m.id === incMod.id)
        if (existing) {
          existing.afterData = {
            ...existing.afterData,
            ...incMod.afterData,
          }
          if (incMod.afterPosition) {
            existing.afterPosition = incMod.afterPosition
          }
        } else {
          target.modifiedNodes.push(deepClone(incMod))
        }
      }
    } else if (target.type === 'update-feedback' && incoming.feedback) {
      target.feedback = {
        before: { ...target.feedback?.before },
        after: { ...target.feedback?.after, ...incoming.feedback.after },
      }
    } else if (target.type === 'update-settings' && incoming.settings) {
      target.settings = {
        before: { ...target.settings?.before },
        after: { ...target.settings?.after, ...incoming.settings.after },
      }
    }
  }
}
