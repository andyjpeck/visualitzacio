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
})
