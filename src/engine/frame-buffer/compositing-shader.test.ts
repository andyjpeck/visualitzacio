import { describe, expect, it } from 'vitest'
import {
  BLEND_MODES,
  createCompositingMaterial,
  evaluateBlend,
  transformUv,
} from './compositing-shader'

describe('CompositingShader & Blend Modes', () => {
  describe('evaluateBlend', () => {
    it('evaluates replace blend mode correctly', () => {
      const bg: [number, number, number, number] = [0.2, 0.4, 0.6, 1.0]
      const fg: [number, number, number, number] = [0.8, 0.6, 0.4, 1.0]

      const fullReplace = evaluateBlend(bg, fg, 'replace', 1.0)
      expect(fullReplace).toEqual([0.8, 0.6, 0.4, 1.0])

      const halfReplace = evaluateBlend(bg, fg, 'replace', 0.5)
      expect(halfReplace[0]).toBeCloseTo(0.5)
      expect(halfReplace[1]).toBeCloseTo(0.5)
      expect(halfReplace[2]).toBeCloseTo(0.5)

      const zeroReplace = evaluateBlend(bg, fg, 'replace', 0.0)
      expect(zeroReplace).toEqual(bg)
    })

    it('evaluates additive blend mode correctly with clamping', () => {
      const bg: [number, number, number, number] = [0.4, 0.2, 0.8, 1.0]
      const fg: [number, number, number, number] = [0.5, 0.6, 0.7, 1.0]

      const additive = evaluateBlend(bg, fg, 'additive', 1.0)
      expect(additive[0]).toBeCloseTo(0.9)
      expect(additive[1]).toBeCloseTo(0.8)
      expect(additive[2]).toBeCloseTo(1.0) // clamped to 1.0
    })

    it('evaluates maximum blend mode correctly', () => {
      const bg: [number, number, number, number] = [0.2, 0.9, 0.4, 1.0]
      const fg: [number, number, number, number] = [0.7, 0.3, 0.6, 1.0]

      const maxResult = evaluateBlend(bg, fg, 'maximum', 1.0)
      expect(maxResult[0]).toBeCloseTo(0.7)
      expect(maxResult[1]).toBeCloseTo(0.9)
      expect(maxResult[2]).toBeCloseTo(0.6)
    })

    it('evaluates minimum blend mode correctly', () => {
      const bg: [number, number, number, number] = [0.5, 0.5, 0.5, 1.0]
      const fg: [number, number, number, number] = [0.2, 0.8, 0.4, 1.0]

      const minResult = evaluateBlend(bg, fg, 'minimum', 1.0)
      expect(minResult[0]).toBeCloseTo(0.2)
      expect(minResult[1]).toBeCloseTo(0.5)
      expect(minResult[2]).toBeCloseTo(0.4)

      // When opacity is 0, min with 1.0 should leave bg unchanged
      const minZero = evaluateBlend(bg, fg, 'minimum', 0.0)
      expect(minZero[0]).toBeCloseTo(0.5)
      expect(minZero[1]).toBeCloseTo(0.5)
      expect(minZero[2]).toBeCloseTo(0.5)
    })

    it('evaluates subtractive blend mode correctly with clamping at zero', () => {
      const bg: [number, number, number, number] = [0.6, 0.3, 0.9, 1.0]
      const fg: [number, number, number, number] = [0.2, 0.5, 0.4, 1.0]

      const subResult = evaluateBlend(bg, fg, 'subtractive', 1.0)
      expect(subResult[0]).toBeCloseTo(0.4)
      expect(subResult[1]).toBeCloseTo(0.0) // clamped at 0
      expect(subResult[2]).toBeCloseTo(0.5)
    })

    it('evaluates multiplicative blend mode correctly', () => {
      const bg: [number, number, number, number] = [0.5, 0.8, 0.2, 1.0]
      const fg: [number, number, number, number] = [0.5, 0.5, 0.5, 1.0]

      const mulResult = evaluateBlend(bg, fg, 'multiplicative', 1.0)
      expect(mulResult[0]).toBeCloseTo(0.25)
      expect(mulResult[1]).toBeCloseTo(0.4)
      expect(mulResult[2]).toBeCloseTo(0.1)

      const mulZero = evaluateBlend(bg, fg, 'multiplicative', 0.0)
      expect(mulZero).toEqual(bg)
    })
  })

  describe('transformUv', () => {
    it('returns identity uv when scale is 1, rotation is 0, and offset is 0', () => {
      const center = transformUv([0.5, 0.5], 1.0, 0.0, [0, 0])
      expect(center[0]).toBeCloseTo(0.5)
      expect(center[1]).toBeCloseTo(0.5)

      const corner = transformUv([0.8, 0.2], 1.0, 0.0, [0, 0])
      expect(corner[0]).toBeCloseTo(0.8)
      expect(corner[1]).toBeCloseTo(0.2)
    })

    it('samples inward when scale > 1 (zooming outward)', () => {
      // Screen point at 1.0 with scale 2.0 should sample from 0.75
      const scaled = transformUv([1.0, 0.5], 2.0, 0.0, [0, 0])
      expect(scaled[0]).toBeCloseTo(0.75)
      expect(scaled[1]).toBeCloseTo(0.5)
    })

    it('samples outward when scale < 1 (zooming inward vortex)', () => {
      // Screen point at 0.75 with scale 0.5 should sample from 1.0
      const scaled = transformUv([0.75, 0.5], 0.5, 0.0, [0, 0])
      expect(scaled[0]).toBeCloseTo(1.0)
      expect(scaled[1]).toBeCloseTo(0.5)
    })

    it('shifts sampling location with position offset', () => {
      const shifted = transformUv([0.5, 0.5], 1.0, 0.0, [0.1, -0.2])
      expect(shifted[0]).toBeCloseTo(0.4)
      expect(shifted[1]).toBeCloseTo(0.7)
    })

    it('rotates sampling coordinate around center', () => {
      // Point at [0.75, 0.5] rotated 90 degrees (pi/2)
      const rotated = transformUv([0.75, 0.5], 1.0, Math.PI / 2, [0, 0])
      expect(rotated[0]).toBeCloseTo(0.5)
      expect(rotated[1]).toBeCloseTo(0.25)
    })
  })

  describe('createCompositingMaterial', () => {
    it('instantiates THREE.ShaderMaterial with all required uniforms and default values', () => {
      const mat = createCompositingMaterial()
      expect(mat).toBeDefined()
      expect(mat.uniforms.uBaseTexture).toBeDefined()
      expect(mat.uniforms.uBlendTexture).toBeDefined()
      expect(mat.uniforms.uHasBase.value).toBe(0)
      expect(mat.uniforms.uOpacity.value).toBe(1.0)
      expect(mat.uniforms.uBlendMode.value).toBe(BLEND_MODES.replace)
      expect(mat.uniforms.uScale.value.x).toBe(1.0)
      expect(mat.uniforms.uScale.value.y).toBe(1.0)
      expect(mat.uniforms.uRotation.value).toBe(0.0)
      expect(mat.uniforms.uOffset.value.x).toBe(0.0)
      expect(mat.uniforms.uOffset.value.y).toBe(0.0)
      expect(mat.transparent).toBe(true)
      expect(mat.depthTest).toBe(false)
      expect(mat.depthWrite).toBe(false)
    })
  })
})
