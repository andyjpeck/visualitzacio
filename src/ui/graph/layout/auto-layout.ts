import type { Edge, Node } from '@xyflow/react'
import dagre from 'dagre'

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

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
  })

  // Register nodes with bounding box dimensions
  for (const node of nodes) {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    })
  }

  // Register edges
  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  // Compute layout
  dagre.layout(dagreGraph)

  // Map nodes to new positions (offset by half width/height so top-left matches React Flow coordinate space)
  const layoutedNodes: Node<T>[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: Math.round(nodeWithPosition.x - nodeWidth / 2),
        y: Math.round(nodeWithPosition.y - nodeHeight / 2),
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}
