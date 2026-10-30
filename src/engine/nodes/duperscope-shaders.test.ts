import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  createDuperscopeRibbonMaterial,
  createDuperscopePointsMaterial,
  createRibbonQuadGeometry,
} from './duperscope-shaders'

describe('Duperscope Shaders (Task 2.1)', () => {
  describe('Instanced Ribbon Material', () => {
    it('creates a ShaderMaterial with correct uniforms and properties', () => {
      const material = createDuperscopeRibbonMaterial()

      expect(material).toBeInstanceOf(THREE.ShaderMaterial)
      expect(material.transparent).toBe(true)
      expect(material.depthTest).toBe(false)
      expect(material.depthWrite).toBe(false)

      expect(material.uniforms.uResolution.value).toBeInstanceOf(THREE.Vector2)
      expect(material.uniforms.uAspect.value).toBe(1.0)
      expect(material.uniforms.uPixelRatio.value).toBe(1.0)
      expect(material.uniforms.uOpacity.value).toBe(1.0)

      expect(material.vertexShader).toContain('instanceStart')
      expect(material.vertexShader).toContain('instanceEnd')
      expect(material.vertexShader).toContain('uAspect')
      expect(material.fragmentShader).toContain('gl_FragColor')
    })

    it('creates a pre-allocated InstancedBufferGeometry for ribbons with corner attributes and indices', () => {
      const geometry = createRibbonQuadGeometry(4096)

      expect(geometry).toBeInstanceOf(THREE.InstancedBufferGeometry)
      expect(geometry.instanceCount).toBe(0)
      expect(geometry.getAttribute('aCorner')).toBeDefined()
      expect(geometry.getAttribute('instanceStart')).toBeDefined()
      expect(geometry.getAttribute('instanceEnd')).toBeDefined()
      expect(geometry.getAttribute('instanceStartColor')).toBeDefined()
      expect(geometry.getAttribute('instanceEndColor')).toBeDefined()
      expect(geometry.getAttribute('instanceStartSize')).toBeDefined()
      expect(geometry.getAttribute('instanceEndSize')).toBeDefined()
      expect(geometry.index).toBeDefined()
    })
  })

  describe('Circular Points Material', () => {
    it('creates a points ShaderMaterial with circular anti-aliasing in fragment shader', () => {
      const material = createDuperscopePointsMaterial()

      expect(material).toBeInstanceOf(THREE.ShaderMaterial)
      expect(material.transparent).toBe(true)
      expect(material.uniforms.uAspect.value).toBe(1.0)
      expect(material.uniforms.uPixelRatio.value).toBe(1.0)
      expect(material.uniforms.uOpacity.value).toBe(1.0)

      expect(material.vertexShader).toContain('gl_PointSize')
      expect(material.vertexShader).toContain('uAspect')
      expect(material.fragmentShader).toContain('gl_PointCoord')
      expect(material.fragmentShader).toContain('discard')
    })
  })
})
