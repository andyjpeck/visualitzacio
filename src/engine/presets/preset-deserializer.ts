import type { Edge, Node } from '@xyflow/react'
import type { AudioBandsSettings, ResolutionScale } from '../../contracts/preset-settings'
import {
  type PresetEdge,
  type PresetFeedbackConfig,
  type PresetMetadata,
  type PresetNode,
  validatePreset,
} from '../../contracts/preset-schema'
import { autoLayoutGraph } from '../../ui/graph/layout/auto-layout'
import {
  CHILD_GAP,
  CONTAINER_HEADER_HEIGHT,
  CONTAINER_PADDING,
  LEAF_NODE_HEIGHT,
} from '../../ui/graph/layout/container-bounds'
import { syncNamedBufferEdges } from '../../ui/graph/buffer-edges'

export interface DeserializedPresetResult {
  success: boolean
  errors: string[]
  nodes: Node[]
  edges: Edge[]
  targetFps?: number
  resolutionScale?: ResolutionScale
  audioBands?: AudioBandsSettings
  feedbackConfig?: PresetFeedbackConfig
  metadata?: PresetMetadata
}

/**
 * Validates and deserializes an arbitrary preset object or JSON string into runtime graph nodes,
 * edges, performance settings, and audio frequency bands.
 *
 * Supports canonical v2 nested tree format (`root` + `children`) and legacy v1 flat format (`nodes`).
 * Automatically reconstructs buffer flow edges from `saveTo` / `loadFrom` tags and executes DAG layout.
 */
export function deserializePreset(raw: unknown): DeserializedPresetResult {
  let parsedRaw = raw

  if (typeof raw === 'string') {
    try {
      parsedRaw = JSON.parse(raw)
    } catch (err) {
      return {
        success: false,
        errors: [`Invalid JSON syntax: ${(err as Error).message}`],
        nodes: [],
        edges: [],
      }
    }
  }

  const validation = validatePreset(parsedRaw)
  if (!validation.isValid || !validation.preset) {
    return {
      success: false,
      errors: validation.errors,
      nodes: [],
      edges: [],
    }
  }

  const preset = validation.preset
  const provisionalNodes: Node[] = []

  if (preset.root) {
    // Canonical v2 Nested Tree Unpacking
    function unpackTreeNode(
      pn: PresetNode,
      parentId?: string,
      siblingIndex = 0,
    ): void {
      const isRoot = !parentId
      const initialY = isRoot
        ? 0
        : CONTAINER_HEADER_HEIGHT + siblingIndex * (LEAF_NODE_HEIGHT + CHILD_GAP)

      provisionalNodes.push({
        id: pn.id,
        type: pn.type,
        parentId,
        extent: isRoot ? undefined : 'parent',
        position: {
          x: isRoot ? 0 : CONTAINER_PADDING,
          y: initialY,
        },
        data: {
          label: pn.label ?? pn.id,
          ...pn.params,
        },
      })

      if (Array.isArray(pn.children)) {
        pn.children.forEach((child, index) => {
          unpackTreeNode(child, pn.id, index)
        })
      }
    }

    unpackTreeNode(preset.root)
  } else if (Array.isArray(preset.nodes)) {
    // Legacy v1 Flat Array Unpacking
    preset.nodes.forEach((pn: PresetNode, index: number) => {
      const isRoot = !pn.parentId
      const siblingIndex = pn.executionIndex ?? index
      const initialY = isRoot
        ? 0
        : CONTAINER_HEADER_HEIGHT + siblingIndex * (LEAF_NODE_HEIGHT + CHILD_GAP)

      provisionalNodes.push({
        id: pn.id,
        type: pn.type,
        parentId: pn.parentId,
        extent: isRoot ? undefined : 'parent',
        position: {
          x: isRoot ? 0 : CONTAINER_PADDING,
          y: initialY,
        },
        data: {
          label: pn.label ?? pn.id,
          ...pn.params,
        },
      })
    })
  }

  // Reconstruct edges:
  // 1. Derive buffer texture flow edges from saveTo and loadFrom tags
  let provisionalEdges = syncNamedBufferEdges(provisionalNodes, [])

  // 2. If legacy explicit edges were provided, merge non-buffer execution edges
  if (Array.isArray(preset.edges)) {
    const existingIds = new Set(provisionalEdges.map((e) => e.id))
    const legacyEdges: Edge[] = preset.edges
      .filter((pe: PresetEdge) => !existingIds.has(pe.id))
      .map((pe: PresetEdge) => ({
        id: pe.id,
        source: pe.source,
        target: pe.target,
        sourceHandle: pe.sourceHandle,
        targetHandle: pe.targetHandle,
      }))
    provisionalEdges = [...provisionalEdges, ...legacyEdges]
  }

  // Run automatic DAG layout and container stack reflow
  const layouted = autoLayoutGraph(provisionalNodes, provisionalEdges)

  return {
    success: true,
    errors: [],
    nodes: layouted.nodes,
    edges: layouted.edges,
    targetFps: preset.settings.targetFps,
    resolutionScale: preset.settings.resolutionScale,
    audioBands: preset.settings.audioBands,
    feedbackConfig: preset.feedback,
    metadata: preset.metadata,
  }
}
