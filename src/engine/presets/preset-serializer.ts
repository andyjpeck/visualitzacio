import type { Edge, Node } from '@xyflow/react'
import type { AudioBandsSettings, ResolutionScale } from '../../contracts/preset-settings'
import {
  CURRENT_PRESET_SCHEMA_VERSION,
  type Preset,
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
 * Encodes containment and execution hierarchy naturally using nested JSON `children` arrays,
 * completely eliminating redundant `parentId`, `executionIndex`, and `edges` fields.
 */
export function serializePreset(options: SerializePresetOptions): Preset {
  const now = new Date().toISOString()

  // Group child nodes by parent to preserve deterministic sibling execution order
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

  // Find root Master Output container
  const rootNode =
    options.graphNodes.find(
      (n) => n.id === 'master-frame-buffer' || n.type === 'masterFrameBuffer',
    ) ??
    options.graphNodes.find((n) => !n.parentId) ??
    options.graphNodes[0]

  if (!rootNode) {
    throw new Error('Cannot serialize preset: no root Master Output node found.')
  }

  function serializeTreeNode(node: Node): PresetNode {
    const dataCopy = { ...node.data }
    const label = typeof dataCopy.label === 'string' ? dataCopy.label : undefined
    delete dataCopy.label

    const children = nodesByParent.get(node.id) ?? []
    const serializedChildren = children.map(serializeTreeNode)

    return {
      id: node.id,
      type: node.type ?? 'default',
      ...(label && label !== node.id ? { label } : {}),
      params: dataCopy,
      ...(serializedChildren.length > 0 ? { children: serializedChildren } : {}),
    }
  }

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
    ...(options.feedbackConfig ? { feedback: options.feedbackConfig } : {}),
    root: serializeTreeNode(rootNode),
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
