import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createMockRenderer } from '../../test/fixtures/renderer-mock'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import { validatePreset } from '../../contracts/preset-schema'
import { deserializePreset } from './preset-deserializer'
import { DuperscopeNode } from '../nodes/duperscope-node'

describe('Preset Verification: Quadrant Mirrored Spectrum', () => {
  const presetPath = path.resolve(__dirname, '../../../presets/quadrant-mirrored-spectrum.json')

  it('exists and is valid JSON matching PresetSchema v2', () => {
    expect(fs.existsSync(presetPath)).toBe(true)
    const content = fs.readFileSync(presetPath, 'utf-8')
    const json = JSON.parse(content)

    const validation = validatePreset(json)
    expect(validation.isValid, `Validation errors: ${validation.errors.join(', ')}`).toBe(true)
    expect(validation.preset).toBeDefined()
    expect(validation.preset?.schemaVersion).toBe(2)
  })

  it('deserializes cleanly into visual graph nodes and buffer flow edges', () => {
    const content = fs.readFileSync(presetPath, 'utf-8')
    const json = JSON.parse(content)

    const result = deserializePreset(json)
    expect(result.success, `Deserialization errors: ${result.errors.join(', ')}`).toBe(true)

    const nodeIds = new Set(result.nodes.map((n) => n.id))
    expect(nodeIds.has('master-frame-buffer')).toBe(true)
    expect(nodeIds.has('myframe')).toBe(true)
    expect(nodeIds.has('myline-bottom')).toBe(true)
    expect(nodeIds.has('myline-right')).toBe(true)
    expect(nodeIds.has('quadrant-upper-left')).toBe(true)
    expect(nodeIds.has('quadrant-upper-right')).toBe(true)
    expect(nodeIds.has('quadrant-lower-left')).toBe(true)
    expect(nodeIds.has('quadrant-lower-right')).toBe(true)

    // Check properties on upper-left quadrant (scale: 0.5, positionX: -0.5, positionY: 0.5)
    const qUpperLeft = result.nodes.find((n) => n.id === 'quadrant-upper-left')
    expect(qUpperLeft?.data.scale).toBe(0.5)
    expect(qUpperLeft?.data.positionX).toBe(-0.5)
    expect(qUpperLeft?.data.positionY).toBe(0.5)
    expect(qUpperLeft?.data.loadFrom).toBe('@FRAME')

    // Check properties on upper-right quadrant (flipX: true, positionX: 0.5, positionY: 0.5)
    const qUpperRight = result.nodes.find((n) => n.id === 'quadrant-upper-right')
    expect(qUpperRight?.data.scale).toBe(0.5)
    expect(qUpperRight?.data.flipX).toBe(true)
    expect(qUpperRight?.data.positionX).toBe(0.5)
    expect(qUpperRight?.data.positionY).toBe(0.5)
    expect(qUpperRight?.data.loadFrom).toBe('@FRAME')

    // Check properties on lower-left quadrant (flipY: true, positionX: -0.5, positionY: -0.5)
    const qLowerLeft = result.nodes.find((n) => n.id === 'quadrant-lower-left')
    expect(qLowerLeft?.data.scale).toBe(0.5)
    expect(qLowerLeft?.data.flipY).toBe(true)
    expect(qLowerLeft?.data.positionX).toBe(-0.5)
    expect(qLowerLeft?.data.positionY).toBe(-0.5)
    expect(qLowerLeft?.data.loadFrom).toBe('@FRAME')

    // Check properties on lower-right quadrant (flipX: true, flipY: true, positionX: 0.5, positionY: -0.5)
    const qLowerRight = result.nodes.find((n) => n.id === 'quadrant-lower-right')
    expect(qLowerRight?.data.scale).toBe(0.5)
    expect(qLowerRight?.data.flipX).toBe(true)
    expect(qLowerRight?.data.flipY).toBe(true)
    expect(qLowerRight?.data.positionX).toBe(0.5)
    expect(qLowerRight?.data.positionY).toBe(-0.5)
    expect(qLowerRight?.data.loadFrom).toBe('@FRAME')

    // Check that named buffer edges are established from myframe (@FRAME) to the 4 quadrants
    const frameEdges = result.edges.filter((e) => e.source === 'myframe')
    expect(frameEdges.length).toBe(4)
  })

  it('compiles both Duperscope lines and verifies non-empty geometry generation', () => {
    const renderer = createMockRenderer()
    const ctx = createDefaultFrameContext()
    ctx.$WIDTH = 1920
    ctx.$HEIGHT = 1080
    ctx.$ASPECT = 1920 / 1080
    ctx.$TIME = 2.0
    ctx.$BASS = 0.8
    ctx.$MID = 0.5

    const bottomLine = new DuperscopeNode({
      id: 'myline-bottom',
      drawMode: 'lines',
      audioMode: 'spectrum',
      channel: 'center',
      opacity: 1.0,
      initCode: 'n = 256;',
      beatCode: 'linesize = 5.0;',
      frameCode: 'linesize = 3.5; r = 0.1 + $BASS * 0.4; g = 0.75; b = 1.0;',
      pointCode: 'x = -1.0 + (i * 2.0); y = -0.95 + (v * 0.75); r = 0.1 + i * 0.5; g = 0.7 + (1.0 - i) * 0.3; b = 1.0;',
    })
    bottomLine.init(renderer)
    bottomLine.resize(1920, 1080, 1.0)
    bottomLine.update(ctx)
    expect(bottomLine.hasErrors).toBe(false)
    expect(bottomLine.getActiveSegmentCount()).toBeGreaterThan(0)

    const rightLine = new DuperscopeNode({
      id: 'myline-right',
      drawMode: 'lines',
      audioMode: 'spectrum',
      channel: 'center',
      opacity: 1.0,
      initCode: 'n = 256;',
      beatCode: 'linesize = 5.0;',
      frameCode: 'linesize = 3.5; r = 0.2 + $BASS * 0.4; g = 0.70; b = 1.0;',
      pointCode: 'y = -1.0 + (i * 2.0); x = 0.95 - (v * 0.75); r = 0.2 + (1.0 - i) * 0.4; g = 0.6 + i * 0.4; b = 1.0;',
    })
    rightLine.init(renderer)
    rightLine.resize(1920, 1080, 1.0)
    rightLine.update(ctx)
    expect(rightLine.hasErrors).toBe(false)
    expect(rightLine.getActiveSegmentCount()).toBeGreaterThan(0)
  })
})
