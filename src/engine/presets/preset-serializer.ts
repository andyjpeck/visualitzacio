import type { Edge, Node } from '@xyflow/react'
import type { AudioBandsSettings, ResolutionScale } from '../../contracts/preset-settings'
import {
  CURRENT_PRESET_SCHEMA_VERSION,
  type Preset,
  type PresetEdge,
  type PresetFeedbackConfig,
  type PresetNode,
  validatePreset,
} from '../../contracts/preset-schema'

export interface SerializePresetOptions {
  name: string
  author?: string
  description?: string
  targetFps: number
  resolutionScale: ResolutionScale
  audioBands: AudioBandsSettings
  graphNodes: readonly Node[]
  graphEdges?: readonly Edge[]
  feedbackConfig?: PresetFeedbackConfig
}

/**
 * Extracts a portable, validated Preset object from the current application state.
 *
 * Topological relationships are preserved via parentId and sibling executionIndex,
 * without persisting ephemeral canvas pixel coordinates.
 */
export function serializePreset(options: SerializePresetOptions): Preset {
  const now = new Date().toISOString()

  // Group child nodes by parent to assign deterministic executionIndex
  const nodesByParent = new Map<string | undefined, Node[]>()
  for (const node of options.graphNodes) {
    const parent = node.parentId
    const list = nodesByParent.get(parent) ?? []
    list.push(node)
    nodesByParent.set(parent, list)
  }

  // Sort siblings by Y position if available, preserving vertical outliner order
  for (const [, list] of nodesByParent.entries()) {
    list.sort((a, b) => {
      const posA = a.position?.y ?? 0
      const posB = b.position?.y ?? 0
      return posA - posB
    })
  }

  const serializedNodes: PresetNode[] = []

  for (const node of options.graphNodes) {
    const siblings = nodesByParent.get(node.parentId) ?? []
    const executionIndex = siblings.findIndex((s) => s.id === node.id)

    // Separate UI display label from functional parameters
    const dataCopy = { ...node.data }
    const label = typeof dataCopy.label === 'string' ? dataCopy.label : undefined
    delete dataCopy.label

    serializedNodes.push({
      id: node.id,
      type: node.type ?? 'default',
      label,
      parentId: node.parentId,
      executionIndex: executionIndex >= 0 ? executionIndex : 0,
      params: dataCopy,
    })
  }

  const serializedEdges: PresetEdge[] | undefined = options.graphEdges?.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
  }))

  const preset: Preset = {
    schemaVersion: CURRENT_PRESET_SCHEMA_VERSION,
    metadata: {
      name: options.name.trim() || 'Untitled Preset',
      author: options.author?.trim() || 'Visualització User',
      version: 1,
      description: options.description?.trim() || undefined,
      created: now,
    },
    settings: {
      targetFps: options.targetFps,
      resolutionScale: options.resolutionScale,
      audioBands: { ...options.audioBands },
    },
    feedback: options.feedbackConfig,
    nodes: serializedNodes,
    edges: serializedEdges && serializedEdges.length > 0 ? serializedEdges : undefined,
  }

  const validation = validatePreset(preset)
  if (!validation.isValid) {
    throw new Error(`Failed to serialize valid preset: ${validation.errors.join('; ')}`)
  }

  return preset
}

/**
 * Serializes application state into a formatted JSON string.
 */
export function serializePresetToJson(options: SerializePresetOptions, space = 2): string {
  const preset = serializePreset(options)
  return JSON.stringify(preset, null, space)
}
