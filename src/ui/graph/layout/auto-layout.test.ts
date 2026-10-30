import { describe, expect, it } from 'vitest'
import type { Edge, Node } from '@xyflow/react'
import { autoLayoutGraph } from './auto-layout'

describe('autoLayoutGraph (Dagre Hierarchical Layout)', () => {
  it('returns empty nodes when empty array is provided', () => {
    const result = autoLayoutGraph([], [])
    expect(result.nodes).toEqual([])
    expect(result.edges).toEqual([])
  })

  it('positions parent node above child node in top-to-bottom mode (TB)', () => {
    const nodes: Node[] = [
      { id: 'parent', position: { x: 0, y: 0 }, data: { label: 'Parent' } },
      { id: 'child', position: { x: 0, y: 0 }, data: { label: 'Child' } },
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'parent', target: 'child' }]

    const result = autoLayoutGraph(nodes, edges, { direction: 'TB' })

    const parentNode = result.nodes.find((n) => n.id === 'parent')!
    const childNode = result.nodes.find((n) => n.id === 'child')!

    // Child must be strictly below parent in TB layout
    expect(childNode.position.y).toBeGreaterThan(parentNode.position.y)
  })

  it('positions 3-tier pipeline in sequential vertical tiers', () => {
    const nodes: Node[] = [
      { id: 'node-A', position: { x: 0, y: 0 }, data: { label: 'A' } },
      { id: 'node-B', position: { x: 0, y: 0 }, data: { label: 'B' } },
      { id: 'node-C', position: { x: 0, y: 0 }, data: { label: 'C' } },
    ]
    const edges: Edge[] = [
      { id: 'e-ab', source: 'node-A', target: 'node-B' },
      { id: 'e-bc', source: 'node-B', target: 'node-C' },
    ]

    const result = autoLayoutGraph(nodes, edges, { direction: 'TB', rankSep: 100 })

    const posA = result.nodes.find((n) => n.id === 'node-A')!.position
    const posB = result.nodes.find((n) => n.id === 'node-B')!.position
    const posC = result.nodes.find((n) => n.id === 'node-C')!.position

    expect(posB.y).toBeGreaterThan(posA.y)
    expect(posC.y).toBeGreaterThan(posB.y)
  })

  it('positions parallel sibling nodes side-by-side with non-overlapping X coordinates', () => {
    const nodes: Node[] = [
      { id: 'root', position: { x: 0, y: 0 }, data: { label: 'Root' } },
      { id: 'branch-1', position: { x: 0, y: 0 }, data: { label: 'Branch 1' } },
      { id: 'branch-2', position: { x: 0, y: 0 }, data: { label: 'Branch 2' } },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'root', target: 'branch-1' },
      { id: 'e2', source: 'root', target: 'branch-2' },
    ]

    const result = autoLayoutGraph(nodes, edges, { direction: 'TB', nodeWidth: 200, nodeSep: 50 })

    const b1 = result.nodes.find((n) => n.id === 'branch-1')!
    const b2 = result.nodes.find((n) => n.id === 'branch-2')!

    // Siblings share the same vertical rank
    expect(b1.position.y).toBe(b2.position.y)

    // Siblings have non-overlapping X positions
    expect(Math.abs(b1.position.x - b2.position.x)).toBeGreaterThanOrEqual(200)
  })

  it('supports horizontal left-to-right layout (LR)', () => {
    const nodes: Node[] = [
      { id: 'left', position: { x: 0, y: 0 }, data: { label: 'Left' } },
      { id: 'right', position: { x: 0, y: 0 }, data: { label: 'Right' } },
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'left', target: 'right' }]

    const result = autoLayoutGraph(nodes, edges, { direction: 'LR' })

    const leftNode = result.nodes.find((n) => n.id === 'left')!
    const rightNode = result.nodes.find((n) => n.id === 'right')!

    // Right node is strictly to the right of left node in LR layout
    expect(rightNode.position.x).toBeGreaterThan(leftNode.position.x)
  })

  it('is immutable and does not mutate input node objects', () => {
    const originalNodes: Node[] = [
      { id: 'n1', position: { x: 10, y: 10 }, data: { label: 'N1' } },
    ]
    const originalPosition = { ...originalNodes[0].position }

    autoLayoutGraph(originalNodes, [])

    expect(originalNodes[0].position).toEqual(originalPosition)
  })
})
