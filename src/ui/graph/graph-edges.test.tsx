import { describe, expect, it } from 'vitest'
import type { Edge, Node } from '@xyflow/react'
import { syncNamedBufferEdges } from './buffer-edges'

describe('Named Buffer Flow Edges (syncNamedBufferEdges)', () => {
  it('creates directed buffer edge between publisher (saveTo) and consumer (loadFrom)', () => {
    const nodes: Node[] = [
      {
        id: 'source-node',
        position: { x: 0, y: 0 },
        data: { label: 'Source', saveTo: '@BUFFER_A' },
      },
      {
        id: 'dest-node',
        position: { x: 100, y: 0 },
        data: { label: 'Dest', loadFrom: '@BUFFER_A' },
      },
    ]

    const edges = syncNamedBufferEdges(nodes, [])
    expect(edges).toHaveLength(1)
    expect(edges[0]?.id).toBe('e-source-node-dest-node-buffer')
    expect(edges[0]?.source).toBe('source-node')
    expect(edges[0]?.target).toBe('dest-node')
    expect(edges[0]?.sourceHandle).toBe('buffer-out')
    expect(edges[0]?.targetHandle).toBe('buffer-in')
    expect(edges[0]?.animated).toBe(true)
  })

  it('handles multi-cast buffer distribution (one publisher to multiple consumers)', () => {
    const nodes: Node[] = [
      {
        id: 'source-node',
        position: { x: 0, y: 0 },
        data: { label: 'Source', saveTo: '@IMAGE' },
      },
      {
        id: 'dest-node-1',
        position: { x: 100, y: 0 },
        data: { label: 'Dest 1', loadFrom: '@IMAGE' },
      },
      {
        id: 'dest-node-2',
        position: { x: 200, y: 0 },
        data: { label: 'Dest 2', loadFrom: '@IMAGE' },
      },
    ]

    const edges = syncNamedBufferEdges(nodes, [])
    expect(edges).toHaveLength(2)
    expect(edges[0]?.source).toBe('source-node')
    expect(edges[0]?.target).toBe('dest-node-1')
    expect(edges[0]?.sourceHandle).toBe('buffer-out')
    expect(edges[0]?.targetHandle).toBe('buffer-in')

    expect(edges[1]?.source).toBe('source-node')
    expect(edges[1]?.target).toBe('dest-node-2')
  })

  it('preserves existing execution edges and updates buffer edges when tags change', () => {
    const nodes: Node[] = [
      {
        id: 'source-node',
        position: { x: 0, y: 0 },
        data: { label: 'Source', saveTo: '@BUFFER_A' },
      },
      {
        id: 'dest-node',
        position: { x: 100, y: 0 },
        data: { label: 'Dest', loadFrom: '@BUFFER_A' },
      },
    ]

    const existingEdges: Edge[] = [
      {
        id: 'e-exec',
        source: 'source-node',
        target: 'dest-node',
        sourceHandle: 'exec-out',
        targetHandle: 'exec-in',
      },
    ]

    const edges = syncNamedBufferEdges(nodes, existingEdges)
    expect(edges).toHaveLength(2)
    expect(edges.find((e) => e.id === 'e-exec')).toBeDefined()
    expect(edges.find((e) => e.sourceHandle === 'buffer-out')).toBeDefined()

    // When loadFrom is cleared, buffer edge is removed and exec edge remains
    const clearedNodes = [nodes[0]!, { ...nodes[1]!, data: { label: 'Dest', loadFrom: '' } }]
    const updatedEdges = syncNamedBufferEdges(clearedNodes, edges)
    expect(updatedEdges).toHaveLength(1)
    expect(updatedEdges[0]?.id).toBe('e-exec')
  })
})
