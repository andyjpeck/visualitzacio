import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
import { DEFAULT_AUDIO_BANDS } from '../../contracts/preset-settings'
import { serializePresetToJson } from './preset-serializer'
import { deserializePreset } from './preset-deserializer'

describe('Preset Roundtrip & Deserializer Suite (Task 4.3)', () => {
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

  const childBuffer: Node = {
    id: 'buffer-alpha',
    type: 'frameBuffer',
    parentId: 'master-frame-buffer',
    position: { x: 20, y: 65 },
    data: {
      label: 'Kaleidoscope Buffer',
      opacity: 0.95,
      rotation: 60, // in degrees
      scale: 1.05,
      saveTo: '@KALEIDO',
    },
  }

  const childSynth: Node = {
    id: 'synth-crystal',
    type: 'testVisual',
    parentId: 'buffer-alpha',
    position: { x: 20, y: 65 },
    data: {
      label: 'Crystal Synthesizer',
      opacity: 0.8,
      formula: '1.0 + $BASS * 0.75',
      loadFrom: '@KALEIDO',
    },
  }

  it('performs lossless roundtrip: serialize -> JSON -> deserialize', () => {
    const originalNodes = [masterNode, childBuffer, childSynth]

    const serializedJson = serializePresetToJson({
      name: 'Roundtrip Test Preset',
      author: 'Antigravity Test',
      description: 'End-to-end roundtrip test',
      targetFps: 144,
      resolutionScale: 0.5,
      audioBands: { ...DEFAULT_AUDIO_BANDS, bassMax: 350 },
      graphNodes: originalNodes,
      feedbackConfig: {
        selectedTemplateId: 'feedback-vortex',
        feedbackEnabled: true,
        feedbackBlendMode: 'add',
        feedbackOpacity: 0.9,
        feedbackScale: 0.99,
        feedbackRotation: 2.5,
        feedbackPositionX: 0,
        feedbackPositionY: 0,
      },
    })

    // Deserialize from JSON
    const result = deserializePreset(serializedJson)
    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.targetFps).toBe(144)
    expect(result.resolutionScale).toBe(0.5)
    expect(result.audioBands?.bassMax).toBe(350)
    expect(result.metadata?.name).toBe('Roundtrip Test Preset')
    expect(result.feedbackConfig?.feedbackEnabled).toBe(true)
    expect(result.feedbackConfig?.feedbackRotation).toBe(2.5)

    // Verify reconstructed nodes
    expect(result.nodes).toHaveLength(3)

    const restoredMaster = result.nodes.find((n) => n.id === 'master-frame-buffer')
    const restoredBuffer = result.nodes.find((n) => n.id === 'buffer-alpha')
    const restoredSynth = result.nodes.find((n) => n.id === 'synth-crystal')

    expect(restoredMaster).toBeDefined()
    expect(restoredBuffer).toBeDefined()
    expect(restoredSynth).toBeDefined()

    expect(restoredMaster?.type).toBe('masterFrameBuffer')
    expect(restoredBuffer?.parentId).toBe('master-frame-buffer')
    expect(restoredSynth?.parentId).toBe('buffer-alpha')

    expect(restoredBuffer?.data.label).toBe('Kaleidoscope Buffer')
    expect(restoredBuffer?.data.rotation).toBe(60)
    expect(restoredBuffer?.data.saveTo).toBe('@KALEIDO')
    expect(restoredSynth?.data.formula).toBe('1.0 + $BASS * 0.75')

    // Verify automatic layout computed non-zero dimensions
    expect(restoredMaster?.style?.width).toBeGreaterThan(0)
    expect(restoredMaster?.style?.height).toBeGreaterThan(0)

    // Verify edges are dynamically reconstructed from saveTo / loadFrom tags
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].source).toBe('buffer-alpha')
    expect(result.edges[0].target).toBe('synth-crystal')
  })

  it('gracefully handles malformed JSON string with syntax error reporting', () => {
    const result = deserializePreset('{ invalid json syntax ... ')
    expect(result.success).toBe(false)
    expect(result.errors[0]).toMatch(/Invalid JSON syntax/)
    expect(result.nodes).toEqual([])
  })

  it('rejects schema-invalid presets during deserialization', () => {
    const invalidPreset = {
      schemaVersion: 1,
      metadata: { name: '', version: 1 }, // Empty name
      settings: { targetFps: 60, resolutionScale: 1.0, audioBands: DEFAULT_AUDIO_BANDS },
      nodes: [],
    }

    const result = deserializePreset(invalidPreset)
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('preserves duperscopeNode scripts and mode parameters across serialize/deserialize roundtrip', () => {
    const scopeNode: Node = {
      id: 'duperscope-1',
      type: 'duperscopeNode',
      parentId: 'master-frame-buffer',
      position: { x: 20, y: 65 },
      data: {
        label: 'Laser Tunnel',
        drawMode: 'lineLoop',
        audioMode: 'spectrum',
        channel: 'center',
        opacity: 0.85,
        initCode: 'n = 360; angle = 0;',
        beatCode: 'angle = angle + 0.1;',
        frameCode: 'angle = angle + 0.015;',
        pointCode: 'x = cos(i * 2 * PI); y = sin(i * 2 * PI);',
        appliedTemplateId: 'oscilloscope-tunnel',
      },
    }

    const json = serializePresetToJson({
      name: 'Duperscope Roundtrip Preset',
      targetFps: 60,
      resolutionScale: 1.0,
      audioBands: DEFAULT_AUDIO_BANDS,
      graphNodes: [masterNode, scopeNode],
    })

    const result = deserializePreset(json)
    expect(result.success).toBe(true)
    expect(result.nodes).toHaveLength(2)

    const restoredScope = result.nodes.find((n) => n.id === 'duperscope-1')
    expect(restoredScope).toBeDefined()
    expect(restoredScope?.type).toBe('duperscopeNode')
    expect(restoredScope?.parentId).toBe('master-frame-buffer')
    expect(restoredScope?.data.label).toBe('Laser Tunnel')
    expect(restoredScope?.data.drawMode).toBe('lineLoop')
    expect(restoredScope?.data.audioMode).toBe('spectrum')
    expect(restoredScope?.data.channel).toBe('center')
    expect(restoredScope?.data.opacity).toBe(0.85)
    expect(restoredScope?.data.initCode).toBe('n = 360; angle = 0;')
    expect(restoredScope?.data.beatCode).toBe('angle = angle + 0.1;')
    expect(restoredScope?.data.frameCode).toBe('angle = angle + 0.015;')
    expect(restoredScope?.data.pointCode).toBe('x = cos(i * 2 * PI); y = sin(i * 2 * PI);')
    expect(restoredScope?.data.appliedTemplateId).toBe('oscilloscope-tunnel')
  })
})