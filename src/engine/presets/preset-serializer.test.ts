import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
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

  it('serializes a minimal single-node graph into a valid Preset object with root', () => {
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

    expect(preset.root).toBeDefined()
    expect(preset.root?.id).toBe('master-frame-buffer')
    expect(preset.root?.type).toBe('masterFrameBuffer')
    expect(preset.root?.label).toBe('Master Output')
    expect(preset.root?.params).toEqual({
      opacity: 1.0,
      blendMode: 'replace',
    })
    expect(preset.root?.children).toBeUndefined()
    expect(preset.edges).toBeUndefined()

    const validation = validatePreset(preset)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('serializes nested container hierarchies with array-inferred execution order and zero edges', () => {
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

    const preset = serializePreset({
      name: 'Vortex Composition',
      author: 'Sound Artist',
      description: 'Audio-reactive vortex tunnel preset',
      targetFps: 120,
      resolutionScale: 0.75,
      audioBands: { ...DEFAULT_AUDIO_BANDS, bassMax: 300 },
      graphNodes: [masterNode, childBuffer, synthNode2, synthNode1], // note arbitrary input order
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

    // Verify root container and nested children
    expect(preset.root).toBeDefined()
    expect(preset.root?.id).toBe('master-frame-buffer')
    expect(preset.root?.children).toHaveLength(1)

    const serializedBuffer = preset.root?.children?.[0]
    expect(serializedBuffer?.id).toBe('buffer-alpha')
    expect(serializedBuffer?.children).toHaveLength(2)

    // Siblings under buffer-alpha are ordered deterministically by visual Y position
    const child1 = serializedBuffer?.children?.[0]
    const child2 = serializedBuffer?.children?.[1]
    expect(child1?.id).toBe('synth-layer-1') // y: 65
    expect(child2?.id).toBe('synth-layer-2') // y: 155
    expect(child1?.params.formula).toBe('1.0 + $BASS * 0.5')
    expect(child1?.params.label).toBeUndefined() // label moved to top-level property

    // Verify edges are completely eliminated from exported JSON
    expect(preset.edges).toBeUndefined()

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
    expect(parsed.root.id).toBe('master-frame-buffer')
    expect(parsed.edges).toBeUndefined()

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
    ).toThrow(/Master Output/)
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
        schemaVersion: 2,
        metadata: { name: 'Bad Settings', version: 1 },
        settings: {
          targetFps: -10,
          resolutionScale: 0.33, // Not in [1.0, 0.75, 0.5, 0.25]
          audioBands: DEFAULT_AUDIO_BANDS,
        },
        root: { id: 'master-frame-buffer', type: 'masterFrameBuffer', params: {} },
      }

      const result = validatePreset(invalidSettings)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('positive numeric "targetFps"'))).toBe(true)
      expect(result.errors.some((e) => e.includes('resolutionScale'))).toBe(true)
    })

    it('rejects presets with duplicate node IDs in nested tree', () => {
      const duplicateIds = {
        schemaVersion: 2,
        metadata: { name: 'Duplicate IDs', version: 1 },
        settings: {
          targetFps: 60,
          resolutionScale: 1.0,
          audioBands: DEFAULT_AUDIO_BANDS,
        },
        root: {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          params: {},
          children: [
            { id: 'dup-node', type: 'testVisual', params: {} },
            { id: 'dup-node', type: 'testVisual', params: {} },
          ],
        },
      }

      const result = validatePreset(duplicateIds)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('Duplicate node id'))).toBe(true)
    })

    it('validates legacy v1 flat array presets seamlessly for backwards compatibility', () => {
      const legacyPreset = {
        schemaVersion: 1,
        metadata: { name: 'Legacy Preset', version: 1 },
        settings: {
          targetFps: 60,
          resolutionScale: 1.0,
          audioBands: DEFAULT_AUDIO_BANDS,
        },
        nodes: [
          { id: 'master-frame-buffer', type: 'masterFrameBuffer', params: {} },
          { id: 'layer-1', type: 'testVisual', parentId: 'master-frame-buffer', params: {} },
        ],
      }

      const result = validatePreset(legacyPreset)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })
})
