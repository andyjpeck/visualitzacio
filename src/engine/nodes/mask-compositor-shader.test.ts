import { describe, expect, it } from 'vitest'
import {
  createMaskCompositorMaterial,
  evaluateMaskMix,
} from './mask-compositor-shader'

describe('Mask Compositor Shader & Material (Task 1.2, #18)', () => {
  it('creates ShaderMaterial with correct uniforms and configuration', () => {
    const mat = createMaskCompositorMaterial()

    expect(mat).toBeDefined()
    expect(mat.transparent).toBe(true)
    expect(mat.depthTest).toBe(false)
    expect(mat.depthWrite).toBe(false)

    expect(mat.uniforms.uForegroundTexture).toBeDefined()
    expect(mat.uniforms.uBackgroundTexture).toBeDefined()
    expect(mat.uniforms.uMaskTexture).toBeDefined()
    expect(mat.uniforms.uHasForeground.value).toBe(0)
    expect(mat.uniforms.uHasBackground.value).toBe(0)
    expect(mat.uniforms.uHasMask.value).toBe(0)
    expect(mat.uniforms.uMaskInvert.value).toBe(0)

    expect(mat.vertexShader).toContain('void main()')
    expect(mat.fragmentShader).toContain('uniform sampler2D uForegroundTexture;')
    expect(mat.fragmentShader).toContain('uniform sampler2D uBackgroundTexture;')
    expect(mat.fragmentShader).toContain('uniform sampler2D uMaskTexture;')
    expect(mat.fragmentShader).toContain('if (uMaskInvert == 1) {')
    expect(mat.fragmentShader).toContain('maskVal = 1.0 - maskVal;')
    expect(mat.fragmentShader).toContain('mix(fg, bg, clamp(maskVal, 0.0, 1.0))')
  })

  it('correctly evaluates software 3-way mask blending', () => {
    const fg: [number, number, number, number] = [0.0, 0.2, 0.8, 1.0] // Water (blue)
    const bg: [number, number, number, number] = [1.0, 0.5, 0.0, 1.0] // Sunset (orange)

    // Dry (mask = 0.0): 100% foreground (water)
    const dry = evaluateMaskMix(fg, bg, 0.0, false)
    expect(dry[0]).toBeCloseTo(0.0)
    expect(dry[1]).toBeCloseTo(0.2)
    expect(dry[2]).toBeCloseTo(0.8)
    expect(dry[3]).toBeCloseTo(1.0)

    // Splash (mask = 1.0): 100% background (sunset)
    const splash = evaluateMaskMix(fg, bg, 1.0, false)
    expect(splash[0]).toBeCloseTo(1.0)
    expect(splash[1]).toBeCloseTo(0.5)
    expect(splash[2]).toBeCloseTo(0.0)
    expect(splash[3]).toBeCloseTo(1.0)

    // Halfway dissolve (mask = 0.5): 50/50 mix
    const half = evaluateMaskMix(fg, bg, 0.5, false)
    expect(half[0]).toBeCloseTo(0.5)
    expect(half[1]).toBeCloseTo(0.35)
    expect(half[2]).toBeCloseTo(0.4)
    expect(half[3]).toBeCloseTo(1.0)

    // Inverted mask: mask = 0.0 becomes splash (sunset), mask = 1.0 becomes dry (water)
    const invertedDry = evaluateMaskMix(fg, bg, 0.0, true)
    expect(invertedDry[0]).toBeCloseTo(1.0)
    expect(invertedDry[1]).toBeCloseTo(0.5)

    const invertedSplash = evaluateMaskMix(fg, bg, 1.0, true)
    expect(invertedSplash[0]).toBeCloseTo(0.0)
    expect(invertedSplash[1]).toBeCloseTo(0.2)
  })
})
