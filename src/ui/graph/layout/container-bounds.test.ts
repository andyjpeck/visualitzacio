import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
import {
  calculateNodeDimensions,
  getNextChildPosition,
  LEAF_NODE_HEIGHT,
  LEAF_NODE_WIDTH,
  recalculateContainerBounds,
  snapContainerStack,
} from './container-bounds'

describe('container-bounds Layout Utilities', () => {
  it('returns default leaf dimensions for non-container nodes', () => {
    const leaf: Node = {
      id: 'synth-1',
      type: 'testVisual',
      position: { x: 0, y: 0 },
      data: {},
    }

    const dims = calculateNodeDimensions(leaf, [leaf])
    expect(dims.width).toBe(LEAF_NODE_WIDTH)
    expect(dims.height).toBe(LEAF_NODE_HEIGHT)
  })

  it('calculates container dimensions to enclose direct children with padding', () => {
    const master: Node = {
      id: 'master',
      type: 'masterFrameBuffer',
      position: { x: 0, y: 0 },
      data: {},
    }
    const child: Node = {
      id: 'child-1',
      parentId: 'master',
      type: 'testVisual',
      position: { x: 20, y: 65 },
      data: {},
    }

    const allNodes = [master, child]
    const dims = calculateNodeDimensions(master, allNodes)

    // Child is at 20 + 240 = 260. With 20px padding = 280.
    expect(dims.width).toBe(280)
    // Child bottom is 65 + 56 = 121. With 20px padding = 141, clamped to minHeight 160.
    expect(dims.height).toBe(160)
  })

  it('grows parent container when an inner frame buffer with children expands', () => {
    const master: Node = {
      id: 'master',
      type: 'masterFrameBuffer',
      position: { x: 0, y: 0 },
      data: {},
    }
    const innerFb: Node = {
      id: 'inner-fb',
      parentId: 'master',
      type: 'frameBuffer',
      position: { x: 20, y: 65 },
      data: {},
    }
    const innerChild: Node = {
      id: 'inner-synth',
      parentId: 'inner-fb',
      type: 'testVisual',
      position: { x: 20, y: 65 },
      data: {},
    }

    const allNodes = [master, innerFb, innerChild]
    const updated = recalculateContainerBounds(allNodes)

    const updatedInnerFb = updated.find((n) => n.id === 'inner-fb')!
    const updatedMaster = updated.find((n) => n.id === 'master')!

    // Inner FB encloses innerChild (20 + 240 + 20 = 280)
    expect(updatedInnerFb.style?.width).toBe(280)
    expect(updatedInnerFb.style?.height).toBe(160)

    // Master must grow wider than inner FB: 20 (pos) + 280 (innerFb width) + 20 (padding) = 320!
    expect(updatedMaster.style?.width).toBe(320)
    // Master height: 65 (pos) + 160 (innerFb height) + 20 (padding) = 245!
    expect(updatedMaster.style?.height).toBe(245)
  })

  it('calculates getNextChildPosition stacking children vertically below each other', () => {
    const master: Node = {
      id: 'master',
      type: 'masterFrameBuffer',
      position: { x: 0, y: 0 },
      data: {},
    }
    const child1: Node = {
      id: 'child-1',
      parentId: 'master',
      type: 'testVisual',
      position: { x: 20, y: 65 },
      data: {},
    }

    const allNodes = [master, child1]
    const nextPos = getNextChildPosition('master', allNodes)

    // Next pos must be below child1 (65 + 56 + 15 = 136)
    expect(nextPos.x).toBe(20)
    expect(nextPos.y).toBe(136)
  })

  it('snapContainerStack locks x=20 and snaps children into vertical slots based on drag order', () => {
    const master: Node = {
      id: 'master',
      type: 'masterFrameBuffer',
      position: { x: 0, y: 0 },
      data: {},
    }
    const child1: Node = {
      id: 'child-1',
      parentId: 'master',
      type: 'testVisual',
      position: { x: 50, y: 300 }, // dragged below child2
      style: { width: 240, height: 56 },
      data: { label: 'Child 1' },
    }
    const child2: Node = {
      id: 'child-2',
      parentId: 'master',
      type: 'testVisual',
      position: { x: 100, y: 100 },
      style: { width: 240, height: 56 },
      data: { label: 'Child 2' },
    }

    const allNodes = [master, child1, child2]
    const snapped = snapContainerStack('master', allNodes)

    const snappedChild2 = snapped.find((n) => n.id === 'child-2')!
    const snappedChild1 = snapped.find((n) => n.id === 'child-1')!

    // Child 2 had lower y (100 vs 300), so it takes Slot 0
    expect(snappedChild2.position.x).toBe(20)
    expect(snappedChild2.position.y).toBe(65)

    // Child 1 takes Slot 1 (65 + 56 + 15 = 136)
    expect(snappedChild1.position.x).toBe(20)
    expect(snappedChild1.position.y).toBe(136)
  })
})
