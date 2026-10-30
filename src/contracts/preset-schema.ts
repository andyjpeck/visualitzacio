import type { AudioBandsSettings, ResolutionScale } from './preset-settings'

export const CURRENT_PRESET_SCHEMA_VERSION = 1

export interface PresetMetadata {
  name: string
  author?: string
  version: number
  description?: string
  created: string
  modified?: string
}

export interface PresetNode {
  id: string
  type: string
  label?: string
  parentId?: string
  executionIndex?: number
  params: Record<string, unknown>
}

export interface PresetEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface PresetFeedbackConfig {
  selectedTemplateId?: string
  feedbackEnabled: boolean
  feedbackBlendMode: string
  feedbackOpacity: number | string
  feedbackScale: number | string
  feedbackRotation: number | string
  feedbackPositionX: number | string
  feedbackPositionY: number | string
  isCustomFeedbackConfig?: boolean
}

export interface PresetSettingsData {
  targetFps: number
  resolutionScale: ResolutionScale
  audioBands: AudioBandsSettings
}

export interface Preset {
  schemaVersion: number
  metadata: PresetMetadata
  settings: PresetSettingsData
  feedback?: PresetFeedbackConfig
  nodes: PresetNode[]
  edges?: PresetEdge[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  preset?: Preset
}

const ALLOWED_RESOLUTION_SCALES = new Set([1.0, 0.75, 0.5, 0.25])

/**
 * Validates an arbitrary object or parsed JSON payload against the Preset schema.
 */
export function validatePreset(raw: unknown): ValidationResult {
  const errors: string[] = []

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      errors: ['Preset root must be a non-null object.'],
    }
  }

  const obj = raw as Record<string, unknown>

  // 1. schemaVersion
  if (typeof obj.schemaVersion !== 'number' || obj.schemaVersion <= 0) {
    errors.push('Preset must specify a positive numeric "schemaVersion".')
  }

  // 2. metadata
  if (!obj.metadata || typeof obj.metadata !== 'object' || Array.isArray(obj.metadata)) {
    errors.push('Preset must include a "metadata" object.')
  } else {
    const meta = obj.metadata as Record<string, unknown>
    if (typeof meta.name !== 'string' || meta.name.trim() === '') {
      errors.push('Preset metadata must include a non-empty string "name".')
    }
    if (typeof meta.version !== 'number' || meta.version <= 0) {
      errors.push('Preset metadata must include a positive numeric "version".')
    }
  }

  // 3. settings
  if (!obj.settings || typeof obj.settings !== 'object' || Array.isArray(obj.settings)) {
    errors.push('Preset must include a "settings" object.')
  } else {
    const s = obj.settings as Record<string, unknown>
    if (typeof s.targetFps !== 'number' || s.targetFps <= 0) {
      errors.push('Preset settings must include a positive numeric "targetFps".')
    }
    if (typeof s.resolutionScale !== 'number' || !ALLOWED_RESOLUTION_SCALES.has(s.resolutionScale)) {
      errors.push('Preset settings "resolutionScale" must be one of: 1.0, 0.75, 0.5, 0.25.')
    }
    if (!s.audioBands || typeof s.audioBands !== 'object' || Array.isArray(s.audioBands)) {
      errors.push('Preset settings must include an "audioBands" object.')
    }
  }

  // 4. nodes
  if (!Array.isArray(obj.nodes) || obj.nodes.length === 0) {
    errors.push('Preset must contain a non-empty "nodes" array.')
  } else {
    const nodeIds = new Set<string>()
    let masterCount = 0

    for (let i = 0; i < obj.nodes.length; i++) {
      const node = obj.nodes[i]
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        errors.push(`Node at index ${i} must be a valid object.`)
        continue
      }
      const n = node as Record<string, unknown>
      if (typeof n.id !== 'string' || n.id.trim() === '') {
        errors.push(`Node at index ${i} must have a non-empty string "id".`)
      } else {
        if (nodeIds.has(n.id)) {
          errors.push(`Duplicate node id "${n.id}" found at index ${i}.`)
        }
        nodeIds.add(n.id)
      }

      if (typeof n.type !== 'string' || n.type.trim() === '') {
        errors.push(`Node at index ${i} must have a non-empty string "type".`)
      }

      if (n.type === 'masterFrameBuffer' || n.id === 'master-frame-buffer') {
        masterCount++
      }

      if (n.params !== undefined && (typeof n.params !== 'object' || Array.isArray(n.params) || n.params === null)) {
        errors.push(`Node "${n.id || i}" params must be an object if defined.`)
      }
    }

    if (masterCount !== 1) {
      errors.push(`Preset must contain exactly one Master Output container node (found ${masterCount}).`)
    }

    // Verify parent relationships do not reference nonexistent nodes
    for (const node of obj.nodes as Record<string, unknown>[]) {
      if (typeof node.parentId === 'string' && node.parentId.trim() !== '') {
        if (!nodeIds.has(node.parentId)) {
          errors.push(`Node "${node.id}" references non-existent parentId "${node.parentId}".`)
        }
        if (node.parentId === node.id) {
          errors.push(`Node "${node.id}" cannot be its own parent.`)
        }
      }
    }
  }

  // 5. edges (optional)
  if (obj.edges !== undefined) {
    if (!Array.isArray(obj.edges)) {
      errors.push('Preset "edges" must be an array if provided.')
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    }
  }

  return {
    isValid: true,
    errors: [],
    preset: raw as Preset,
  }
}
