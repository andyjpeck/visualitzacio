import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { validatePreset } from '../../contracts/preset-schema'
import { deserializePreset } from './preset-deserializer'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import { createMockRenderer } from '../../test/fixtures/renderer-mock'
import { FrameBufferNode } from '../frame-buffer/frame-buffer-node'
import { MaskCompositorNode } from '../nodes/mask-compositor-node'
import { StaticImageNode } from '../nodes/static-image-node'
import { DuperscopeNode } from '../nodes/duperscope-node'
import { BufferPool } from '../frame-buffer/buffer-pool'

describe('Preset Verification: Rainy Ocean Sunset Reveal (Track 15, #18)', () => {
  const presetPath = path.resolve(__dirname, '../../../presets/rainy-ocean-sunset.json')

  it('exists and is valid JSON matching PresetSchema v2', () => {
    expect(fs.existsSync(presetPath)).toBe(true)
    const content = fs.readFileSync(presetPath, 'utf-8')
    const json = JSON.parse(content)

    const validation = validatePreset(json)
    expect(validation.isValid, `Validation errors: ${validation.errors.join(', ')}`).toBe(true)
    expect(validation.preset).toBeDefined()
    expect(validation.preset?.schemaVersion).toBe(2)
    expect(validation.preset?.metadata.name).toBe('Rainy Ocean Sunset Reveal')
  })

  it('deserializes cleanly into visual graph nodes and hierarchical structure', () => {
    const content = fs.readFileSync(presetPath, 'utf-8')
    const json = JSON.parse(content)

    const result = deserializePreset(json)
    expect(result.success, `Deserialization errors: ${result.errors.join(', ')}`).toBe(true)

    const nodeIds = new Set(result.nodes.map((n) => n.id))
    expect(nodeIds.has('master-frame-buffer')).toBe(true)
    expect(nodeIds.has('sunset-buffer')).toBe(true)
    expect(nodeIds.has('sunset-image')).toBe(true)
    expect(nodeIds.has('water-buffer')).toBe(true)
    expect(nodeIds.has('water-image')).toBe(true)
    expect(nodeIds.has('rain-feedback-buffer')).toBe(true)
    expect(nodeIds.has('rain-particles')).toBe(true)
    expect(nodeIds.has('mask-reveal-pass')).toBe(true)

    // Check mask compositor properties
    const maskNode = result.nodes.find((n) => n.id === 'mask-reveal-pass')
    expect(maskNode?.type).toBe('maskCompositor')
    expect(maskNode?.data.foregroundFrom).toBe('@WATER')
    expect(maskNode?.data.backgroundFrom).toBe('@SUNSET')
    expect(maskNode?.data.maskFrom).toBe('@RAIN')
    expect(maskNode?.data.maskInvert).toBe(false)

    // Check rain buffer feedback decay
    const rainBuffer = result.nodes.find((n) => n.id === 'rain-feedback-buffer')
    expect(rainBuffer?.data.feedback).toBe(true)
    expect(rainBuffer?.data.opacity).toBe(0.92)
    expect(rainBuffer?.data.saveTo).toBe('@RAIN')
  })

  it('instantiates and executes complete render lifecycle with BufferPool texture flow', () => {
    const renderer = createMockRenderer()
    const pool = new BufferPool()
    const ctx = createDefaultFrameContext()

    // 1. Instantiate sunset layer
    const sunsetBuffer = new FrameBufferNode({ id: 'sunset-buffer', saveTo: '@SUNSET', outputBlendMode: 'none' })
    const sunsetImage = new StaticImageNode({ id: 'sunset-image', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
    sunsetBuffer.addChild(sunsetImage)
    sunsetBuffer.init(renderer, pool)
    sunsetBuffer.resize(1920, 1080)

    // 2. Instantiate water layer
    const waterBuffer = new FrameBufferNode({ id: 'water-buffer', saveTo: '@WATER', outputBlendMode: 'none' })
    const waterImage = new StaticImageNode({ id: 'water-image', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
    waterBuffer.addChild(waterImage)
    waterBuffer.init(renderer, pool)
    waterBuffer.resize(1920, 1080)

    // 3. Instantiate rain layer
    const rainBuffer = new FrameBufferNode({ id: 'rain-feedback-buffer', saveTo: '@RAIN', feedback: true, opacity: 0.92, outputBlendMode: 'none' })
    const rainParticles = new DuperscopeNode({
      id: 'rain-particles',
      drawMode: 'points',
      initCode: 'n = 100;',
      pointCode: 'x = i; y = i;',
    })
    rainBuffer.addChild(rainParticles)
    rainBuffer.init(renderer, pool)
    rainBuffer.resize(1920, 1080)

    // 4. Instantiate mask compositor
    const compositor = new MaskCompositorNode({
      id: 'mask-reveal-pass',
      foregroundFrom: '@WATER',
      backgroundFrom: '@SUNSET',
      maskFrom: '@RAIN',
    })
    compositor.init(renderer, pool)

    // Execute render frame
    sunsetBuffer.update(ctx)
    waterBuffer.update(ctx)
    rainBuffer.update(ctx)
    compositor.update(ctx)

    // Verify buffer pool has all registered textures
    expect(pool.has('@SUNSET')).toBe(true)
    expect(pool.has('@WATER')).toBe(true)
    expect(pool.has('@RAIN')).toBe(true)

    // Verify compositor material received all textures
    const mat = compositor.getMaterial()
    expect(mat.uniforms.uHasForeground.value).toBe(1)
    expect(mat.uniforms.uHasBackground.value).toBe(1)
    expect(mat.uniforms.uHasMask.value).toBe(1)

    // Cleanup
    sunsetBuffer.dispose()
    waterBuffer.dispose()
    rainBuffer.dispose()
    compositor.dispose()
  })
})
