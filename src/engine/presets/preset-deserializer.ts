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
 * Automatically executes DAG layout and container bounding-box recalculation so the loaded
 * preset is rendered cleanly without manual repositioning.
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

  // Build raw nodes with provisional positions based on executionIndex
  const provisionalNodes: Node[] = preset.nodes.map((pn: PresetNode) => {
    const isRoot = !pn.parentId
    const initialY = isRoot
      ? 0
      : CONTAINER_HEADER_HEIGHT + (pn.executionIndex ?? 0) * (LEAF_NODE_HEIGHT + CHILD_GAP)

    return {
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
    }
  })

  // Reconstruct graph edges
  const provisionalEdges: Edge[] = (preset.edges ?? []).map((pe: PresetEdge) => ({
    id: pe.id,
    source: pe.source,
    target: pe.target,
    sourceHandle: pe.sourceHandle,
    targetHandle: pe.targetHandle,
  }))

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
