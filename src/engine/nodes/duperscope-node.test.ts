import { describe, expect, it } from 'vitest'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import { createMockRenderer } from '../../test/fixtures/renderer-mock'
import { DuperscopeNode } from './duperscope-node'

describe('DuperscopeNode (Task 2.2)', () => {
  it('instantiates with default properties and creates scene / meshes', () => {
    const node = new DuperscopeNode({ id: 'duperscope-test-1' })

    expect(node.id).toBe('duperscope-test-1')
    expect(node.bypassed).toBe(false)
    expect(node.drawMode).toBe('lines')
    expect(node.audioMode).toBe('waveform')
    expect(node.channel).toBe('center')
    expect(node.scene).toBeDefined()
    expect(node.hasErrors).toBe(false)

    node.dispose()
  })

  it('evaluates and renders lines draw mode with instanced segment geometry', () => {
    const node = new DuperscopeNode({
      id: 'duperscope-test-2',
      drawMode: 'lines',
      initCode: 'n = 10;',
      frameCode: 'r = 0.8; linesize = 3.0;',
      pointCode: 'x = i * 2.0 - 1.0; y = 0.5;',
    })

    const ctx = createDefaultFrameContext()
    ctx.$WIDTH = 1920
    ctx.$HEIGHT = 1080
    ctx.$ASPECT = 1920 / 1080

    node.update(ctx)

    // For 10 points in 'lines' mode, instanceCount should be 10 - 1 = 9 segments
    expect(node.getActiveSegmentCount()).toBe(9)
    expect(node.getActivePointCount()).toBe(10)
    expect(node.hasErrors).toBe(false)

    node.dispose()
  })

  it('evaluates lineLoop mode connecting last point back to first', () => {
    const node = new DuperscopeNode({
      id: 'duperscope-test-3',
      drawMode: 'lineLoop',
      initCode: 'n = 10;',
    })

    const ctx = createDefaultFrameContext()
    node.update(ctx)

    // For 10 points in 'lineLoop' mode, instanceCount should be 10 segments
    expect(node.getActiveSegmentCount()).toBe(10)

    node.dispose()
  })

  it('evaluates points mode and sets point draw range', () => {
    const node = new DuperscopeNode({
      id: 'duperscope-test-4',
      drawMode: 'points',
      initCode: 'n = 25;',
    })

    const ctx = createDefaultFrameContext()
    node.update(ctx)

    expect(node.getActivePointCount()).toBe(25)
    expect(node.getActiveSegmentCount()).toBe(0)

    node.dispose()
  })

  it('outputs a blank frame (0 segments / 0 points) when in an error state', () => {
    const node = new DuperscopeNode({
      id: 'duperscope-test-5',
      drawMode: 'lines',
      initCode: 'n = 10;',
      pointCode: 'x = cos(;', // Syntax error!
    })

    expect(node.hasErrors).toBe(true)
    expect(node.errorMessage).toBeDefined()

    const ctx = createDefaultFrameContext()
    node.update(ctx)

    // Blank frame: 0 active segments and 0 points drawn
    expect(node.getActiveSegmentCount()).toBe(0)
    expect(node.getActivePointCount()).toBe(0)

    node.dispose()
  })

  it('outputs a blank frame when bypassed is true', () => {
    const node = new DuperscopeNode({
      id: 'duperscope-test-6',
      drawMode: 'lines',
      initCode: 'n = 10;',
    })

    node.bypassed = true
    const ctx = createDefaultFrameContext()
    node.update(ctx)

    expect(node.getActiveSegmentCount()).toBe(0)

    node.dispose()
  })

  it('renders through RendererLike and disposes cleanly without memory leaks', () => {
    const node = new DuperscopeNode({ id: 'duperscope-test-7' })
    const renderer = createMockRenderer()

    node.init(renderer)
    node.resize(1280, 720, 1.0)
    node.update(createDefaultFrameContext())

    expect(() => node.render(renderer)).not.toThrow()
    expect(renderer.render).toHaveBeenCalledWith(node.scene, node.camera)
    expect(() => node.dispose()).not.toThrow()
  })
})
