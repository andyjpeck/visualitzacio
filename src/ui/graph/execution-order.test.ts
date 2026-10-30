import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
import { computeExecutionOrder } from './execution-order'

describe('computeExecutionOrder', () => {
  it('returns empty map for empty node array', () => {
    const order = computeExecutionOrder([])
    expect(order.size).toBe(0)
  })

  it('orders children before their container, and sorts publishers before consumers', () => {
    const nodes: Node[] = [
      {
        id: 'master-frame-buffer',
        position: { x: 0, y: 0 },
        data: { label: 'Master' },
      },
      {
        id: 'consumer-buffer',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 100 },
        data: { label: 'Consumer', loadFrom: '@TEX' },
      },
      {
        id: 'source-buffer',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 200 }, // visually lower, but publishes @TEX
        data: { label: 'Source', saveTo: '@TEX' },
      },
      {
        id: 'synth-child',
        parentId: 'source-buffer',
        position: { x: 20, y: 65 },
        data: { label: 'Synth' },
      },
    ]

    const order = computeExecutionOrder(nodes)

    // 1. Synth executes first inside source-buffer
    expect(order.get('synth-child')).toBe(1)
    // 2. Source buffer finishes and publishes @TEX
    expect(order.get('source-buffer')).toBe(2)
    // 3. Consumer buffer consumes @TEX and composites to master
    expect(order.get('consumer-buffer')).toBe(3)
    // 4. Master composites to screen
    expect(order.get('master-frame-buffer')).toBe(4)
  })

  it('sorts sibling nodes by spatial Y (top-to-bottom), then X (left-to-right)', () => {
    const nodes: Node[] = [
      {
        id: 'master',
        position: { x: 0, y: 0 },
        data: { label: 'Master' },
      },
      {
        id: 'item-bottom-right',
        parentId: 'master',
        position: { x: 200, y: 150 },
        data: { label: 'BR' },
      },
      {
        id: 'item-top-right',
        parentId: 'master',
        position: { x: 200, y: 50 },
        data: { label: 'TR' },
      },
      {
        id: 'item-top-left',
        parentId: 'master',
        position: { x: 50, y: 50 },
        data: { label: 'TL' },
      },
      {
        id: 'item-bottom-left',
        parentId: 'master',
        position: { x: 50, y: 150 },
        data: { label: 'BL' },
      },
    ]

    const order = computeExecutionOrder(nodes)

    // At y=50: TL (x=50) before TR (x=200)
    expect(order.get('item-top-left')).toBe(1)
    expect(order.get('item-top-right')).toBe(2)

    // At y=150: BL (x=50) before BR (x=200)
    expect(order.get('item-bottom-left')).toBe(3)
    expect(order.get('item-bottom-right')).toBe(4)

    // Master is last
    expect(order.get('master')).toBe(5)
  })
})
