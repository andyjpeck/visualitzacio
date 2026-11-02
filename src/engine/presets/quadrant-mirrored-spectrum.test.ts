import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { validatePreset } from '../../contracts/preset-schema'
import { deserializePreset } from './preset-deserializer'

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

    // Check beat bounce and twist on master root
    const masterNode = result.nodes.find((n) => n.id === 'master-frame-buffer')
    expect(masterNode?.data.scale).toBe('1.0 + #BEAT(0.8) * clamp(0.25 + $BASS * 0.45, 0.25, 0.70)')
    expect(masterNode?.data.rotation).toBe(
      '#BEAT(0.8) * (sin($TIME * 1.7 + sin($TIME * 0.8) * 1.5) > 0 ? 1 : -1) * clamp(18.0 + $RMS * 36.0, 18.0, 54.0)',
    )

    // Check directional feedback wind away from X and Y axes
    const myframeBottom = result.nodes.find((n) => n.id === 'myframe-bottom')
    expect(myframeBottom?.data.feedback).toBe(true)
    expect(myframeBottom?.data.positionY).toBe(0.011)
    expect(myframeBottom?.data.positionX).toBe(0)

    const myframeRight = result.nodes.find((n) => n.id === 'myframe-right')
    expect(myframeRight?.data.feedback).toBe(true)
    expect(myframeRight?.data.positionX).toBe(-0.011)
    expect(myframeRight?.data.positionY).toBe(0)

    expect(nodeIds.has('myframe-bottom')).toBe(true)
    expect(nodeIds.has('myframe-right')).toBe(true)
    expect(nodeIds.has('myline-bottom')).toBe(true)
    expect(nodeIds.has('myline-right')).toBe(true)
    expect(nodeIds.has('myline-lightning')).toBe(true)
    expect(nodeIds.has('myline-lightning-secondary')).toBe(true)
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
})
