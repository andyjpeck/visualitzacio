import type { Edge, Node } from '@xyflow/react'
import dagre from 'dagre'
import { reflowGraphStacks } from './container-bounds'

export interface AutoLayoutOptions {
  direction?: 'TB' | 'LR'
  nodeWidth?: number
  nodeHeight?: number
  rankSep?: number
  nodeSep?: number
}

/**
 * Calculates deterministic, non-overlapping hierarchical layout for nodes and edges
 * using the Dagre directed graph layout engine.
 */
export function autoLayoutGraph<T extends Record<string, unknown>>(
  nodes: Node<T>[],
  edges: Edge[],
  options: AutoLayoutOptions = {},
): { nodes: Node<T>[]; edges: Edge[] } {
  const {
    direction = 'TB',
    nodeWidth = 240,
    nodeHeight = 130,
    rankSep = 70,
    nodeSep = 50,
  } = options

  if (nodes.length === 0) {
    return { nodes: [], edges }
  }

  const topLevelNodes = nodes.filter((n) => !n.parentId)
  const childNodes = nodes.filter((n) => Boolean(n.parentId))

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
  })

  // Register top-level nodes with bounding box dimensions
  for (const node of topLevelNodes) {
    const w = (node.style?.width as number) || nodeWidth
    const h = (node.style?.height as number) || nodeHeight
    dagreGraph.setNode(node.id, {
      width: w,
      height: h,
    })
  }

  // Register edges connecting top-level nodes
  const topLevelIds = new Set(topLevelNodes.map((n) => n.id))
  for (const edge of edges) {
    if (topLevelIds.has(edge.source) && topLevelIds.has(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target)
    }
  }

  // Compute layout
  dagre.layout(dagreGraph)

  // Map top-level nodes to new positions (offset by half width/height so top-left matches React Flow coordinate space)
  const layoutedTopNodes: Node<T>[] = topLevelNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    if (!nodeWithPosition) return node
    const w = (node.style?.width as number) || nodeWidth
    const h = (node.style?.height as number) || nodeHeight
    return {
      ...node,
      position: {
        x: Math.round(nodeWithPosition.x - w / 2),
        y: Math.round(nodeWithPosition.y - h / 2),
      },
    }
  })

  // For child nodes, preserve their relative position inside their parent
  const layoutedChildNodes: Node<T>[] = childNodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x || 20,
      y: node.position.y || 65,
    },
  }))

  return {
    nodes: reflowGraphStacks([...layoutedTopNodes, ...layoutedChildNodes]),
    edges,
  }
}
