import { describe, expect, it } from 'vitest'
import type { Edge, Node } from '@xyflow/react'
import {
  CURRENT_PRESET_SCHEMA_VERSION,
  validatePreset,
} from '../../contracts/preset-schema'
import { DEFAULT_AUDIO_BANDS } from '../../contracts/preset-settings'
import {
  serializePreset,
  serializePresetToJson,
} from './preset-serializer'

describe('Preset Serialization & Schema Engine (Task 4.2)', () => {
  const masterNode: Node = {
    id: 'master-frame-buffer',
    type: 'masterFrameBuffer',
    position: { x: 0, y: 0 },
    data: {
      label: 'Master Output',
      opacity: 1.0,
      blendMode: 'replace',
    },
  }

  it('serializes a minimal single-node graph into a valid Preset object', () => {
    const preset = serializePreset({
      name: 'Minimal Test Preset',
      author: 'Tester',
      targetFps: 60,
      resolutionScale: 1.0,
      audioBands: DEFAULT_AUDIO_BANDS,
      graphNodes: [masterNode],
    })

    expect(preset.schemaVersion).toBe(CURRENT_PRESET_SCHEMA_VERSION)
    expect(preset.metadata.name).toBe('Minimal Test Preset')
    expect(preset.metadata.author).toBe('Tester')
    expect(preset.metadata.version).toBe(1)
    expect(preset.metadata.created).toBeDefined()
    expect(preset.settings.targetFps).toBe(60)
    expect(preset.settings.resolutionScale).toBe(1.0)
    expect(preset.settings.audioBands).toEqual(DEFAULT_AUDIO_BANDS)

    expect(preset.nodes).toHaveLength(1)
    expect(preset.nodes[0].id).toBe('master-frame-buffer')
    expect(preset.nodes[0].type).toBe('masterFrameBuffer')
    expect(preset.nodes[0].label).toBe('Master Output')
    expect(preset.nodes[0].params).toEqual({
      opacity: 1.0,
      blendMode: 'replace',
    })
    // Ensure ephemeral canvas coordinates are not serialized
    expect((preset.nodes[0] as unknown as { position?: unknown }).position).toBeUndefined()

    const validation = validatePreset(preset)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('serializes nested container hierarchies and assigns deterministic executionIndex based on sibling order', () => {
    const childBuffer: Node = {
      id: 'buffer-alpha',
      type: 'frameBuffer',
      parentId: 'master-frame-buffer',
      position: { x: 20, y: 65 },
      data: {
        label: 'Vortex Buffer',
        opacity: 0.95,
        scale: 1.02,
        rotation: 45, // in degrees
        saveTo: '@VORTEX',
      },
    }

    const synthNode1: Node = {
      id: 'synth-layer-1',
      type: 'testVisual',
      parentId: 'buffer-alpha',
      position: { x: 20, y: 65 },
      data: {
        label: 'Lead Crystal',
        opacity: 0.8,
        formula: '1.0 + $BASS * 0.5',
      },
    }

    const synthNode2: Node = {
      id: 'synth-layer-2',
      type: 'testVisual',
      parentId: 'buffer-alpha',
      position: { x: 20, y: 155 },
      data: {
        label: 'Accent Crystal',
        opacity: 0.5,
      },
    }

    const edge: Edge = {
      id: 'e-buffer-synth',
      source: 'synth-layer-1',
      target: 'buffer-alpha',
    }

    const preset = serializePreset({
      name: 'Vortex Composition',
      author: 'Sound Artist',
      description: 'Audio-reactive vortex tunnel preset',
      targetFps: 120,
      resolutionScale: 0.75,
      audioBands: { ...DEFAULT_AUDIO_BANDS, bassMax: 300 },
      graphNodes: [masterNode, childBuffer, synthNode2, synthNode1], // note arbitrary input order
      graphEdges: [edge],
      feedbackConfig: {
        selectedTemplateId: 'feedback-vortex',
        feedbackEnabled: true,
        feedbackBlendMode: 'add',
        feedbackOpacity: 0.96,
        feedbackScale: 0.98,
        feedbackRotation: 1.15,
        feedbackPositionX: 0,
        feedbackPositionY: 0,
      },
    })

    expect(preset.metadata.description).toBe('Audio-reactive vortex tunnel preset')
    expect(preset.settings.targetFps).toBe(120)
    expect(preset.settings.resolutionScale).toBe(0.75)
    expect(preset.feedback?.feedbackEnabled).toBe(true)
    expect(preset.feedback?.feedbackRotation).toBe(1.15)

    // Siblings under buffer-alpha should have executionIndex assigned based on vertical position
    const serializedSynth1 = preset.nodes.find((n) => n.id === 'synth-layer-1')
    const serializedSynth2 = preset.nodes.find((n) => n.id === 'synth-layer-2')

    expect(serializedSynth1?.executionIndex).toBe(0) // y: 65
    expect(serializedSynth2?.executionIndex).toBe(1) // y: 155
    expect(serializedSynth1?.params.formula).toBe('1.0 + $BASS * 0.5')
    expect(serializedSynth1?.params.label).toBeUndefined() // label moved to top-level node property

    expect(preset.edges).toHaveLength(1)
    expect(preset.edges?.[0].id).toBe('e-buffer-synth')

    const validation = validatePreset(preset)
    expect(validation.isValid).toBe(true)
  })

  it('serializes to formatted JSON string via serializePresetToJson', () => {
    const json = serializePresetToJson({
      name: 'JSON Test Preset',
      targetFps: 60,
      resolutionScale: 1.0,
      audioBands: DEFAULT_AUDIO_BANDS,
      graphNodes: [masterNode],
    })

    expect(typeof json).toBe('string')
    const parsed = JSON.parse(json)
    expect(parsed.schemaVersion).toBe(CURRENT_PRESET_SCHEMA_VERSION)
    expect(parsed.metadata.name).toBe('JSON Test Preset')

    const validation = validatePreset(parsed)
    expect(validation.isValid).toBe(true)
  })

  it('throws descriptive error during serialization if graph is missing a Master Output node', () => {
    const orphanSynth: Node = {
      id: 'synth-1',
      type: 'testVisual',
      position: { x: 0, y: 0 },
      data: { label: 'Synth Without Master' },
    }

    expect(() =>
      serializePreset({
        name: 'Invalid Preset',
        targetFps: 60,
        resolutionScale: 1.0,
        audioBands: DEFAULT_AUDIO_BANDS,
        graphNodes: [orphanSynth],
      })
    ).toThrow(/Failed to serialize valid preset.*exactly one Master Output/)
  })

  describe('validatePreset schema verification', () => {
    it('rejects null, non-objects, or empty schemas', () => {
      expect(validatePreset(null).isValid).toBe(false)
      expect(validatePreset('string').isValid).toBe(false)
      expect(validatePreset([]).isValid).toBe(false)
      expect(validatePreset({}).isValid).toBe(false)
    })

    it('rejects presets with invalid resolution scale or non-positive target FPS', () => {
      const invalidSettings = {
        schemaVersion: 1,
        metadata: { name: 'Bad Settings', version: 1 },
        settings: {
          targetFps: -10,
          resolutionScale: 0.33, // Not in [1.0, 0.75, 0.5, 0.25]
          audioBands: DEFAULT_AUDIO_BANDS,
        },
        nodes: [{ id: 'master-frame-buffer', type: 'masterFrameBuffer', params: {} }],
      }

      const result = validatePreset(invalidSettings)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('positive numeric "targetFps"'))).toBe(true)
      expect(result.errors.some((e) => e.includes('resolutionScale'))).toBe(true)
    })

    it('rejects presets with invalid parent references or self-parenting', () => {
      const invalidHierarchy = {
        schemaVersion: 1,
        metadata: { name: 'Broken Hierarchy', version: 1 },
        settings: {
          targetFps: 60,
          resolutionScale: 1.0,
          audioBands: DEFAULT_AUDIO_BANDS,
        },
        nodes: [
          { id: 'master-frame-buffer', type: 'masterFrameBuffer', params: {} },
          { id: 'child-1', type: 'frameBuffer', parentId: 'non-existent-parent', params: {} },
          { id: 'child-2', type: 'testVisual', parentId: 'child-2', params: {} },
        ],
      }

      const result = validatePreset(invalidHierarchy)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('non-existent parentId'))).toBe(true)
      expect(result.errors.some((e) => e.includes('cannot be its own parent'))).toBe(true)
    })

    it('rejects presets with duplicate node IDs', () => {
      const duplicateIds = {
        schemaVersion: 1,
        metadata: { name: 'Duplicate IDs', version: 1 },
        settings: {
          targetFps: 60,
          resolutionScale: 1.0,
          audioBands: DEFAULT_AUDIO_BANDS,
        },
        nodes: [
          { id: 'master-frame-buffer', type: 'masterFrameBuffer', params: {} },
          { id: 'dup-node', type: 'testVisual', params: {} },
          { id: 'dup-node', type: 'testVisual', params: {} },
        ],
      }

      const result = validatePreset(duplicateIds)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('Duplicate node id'))).toBe(true)
    })
  })
})
