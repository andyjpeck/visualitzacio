import { describe, expect, it } from 'vitest'
import { createDefaultFrameContext } from '../contracts/frame-context'
import { createMockRenderer } from '../test/fixtures/renderer-mock'
import { ExpressionEngine } from './expressions/expression-engine'
import { TestVisualNode } from './visual-node'

describe('TestVisualNode', () => {
  it('modulates mesh rotation with $TIME and scale with $BASS and $BEAT', () => {
    const node = new TestVisualNode()
    const mockRenderer = createMockRenderer()
    node.init(mockRenderer)

    const ctx = createDefaultFrameContext()
    ctx.$TIME = 2.0
    ctx.$BASS = 0.8
    ctx.$BEAT = 1.0

    node.update(ctx)

    // Verify rotation
    expect(node.mesh.rotation.x).toBeCloseTo(0.8, 2)
    expect(node.mesh.rotation.y).toBeCloseTo(1.2, 2)

    // Verify scale: 1.0 + 0.8 * 0.5 + 1.0 * 0.3 = 1.7
    expect(node.mesh.scale.x).toBeCloseTo(1.7, 2)

    // Verify render was called
    expect(mockRenderer.render).toHaveBeenCalledWith(node.scene, node.camera)

    node.dispose()
  })

  it('updates camera aspect ratio on resize', () => {
    const node = new TestVisualNode()
    node.resize(1920, 1080)
    expect(node.camera.aspect).toBeCloseTo(1920 / 1080, 3)
  })

  it('modulates scale with dynamic expression when configured', () => {
    const node = new TestVisualNode()
    const engine = new ExpressionEngine()
    node.setScaleExpression('1.0 + $BASS * 2.0', engine)

    const ctx = createDefaultFrameContext()
    ctx.$BASS = 0.5
    node.update(ctx)

    // 1.0 + 0.5 * 2.0 = 2.0
    expect(node.mesh.scale.x).toBeCloseTo(2.0, 2)
  })

  it('switches geometry shapes dynamically (Cube, Torus, Sphere, Crystal)', () => {
    const node = new TestVisualNode()
    expect(node.getShape()).toBe('Crystal')

    node.setShape('Cube')
    expect(node.getShape()).toBe('Cube')
    expect(node.mesh.geometry.type).toBe('BoxGeometry')

    node.setShape('Torus')
    expect(node.getShape()).toBe('Torus')
    expect(node.mesh.geometry.type).toBe('TorusGeometry')

    node.setShape('Sphere')
    expect(node.getShape()).toBe('Sphere')
    expect(node.mesh.geometry.type).toBe('SphereGeometry')

    node.setShape('Crystal')
    expect(node.getShape()).toBe('Crystal')
    expect(node.mesh.geometry.type).toBe('IcosahedronGeometry')

    node.dispose()
  })

  it('toggles audio reactivity', () => {
    const node = new TestVisualNode()
    expect(node.getAudioReactive()).toBe(true)

    node.setAudioReactive(false)
    expect(node.getAudioReactive()).toBe(false)

    const ctx = createDefaultFrameContext()
    ctx.$BASS = 0.9
    ctx.$BEAT = 1.0
    node.update(ctx)

    // When audio reactive is disabled, scale remains base 1.0 without bass/beat pump
    expect(node.mesh.scale.x).toBe(1.0)
    node.dispose()
  })
})
