import type { Edge, Node } from '@xyflow/react'

export const BUFFER_EDGE_STYLE = {
  stroke: '#a855f7',
  strokeWidth: 2,
}

/**
 * Synchronizes texture buffer flow edges (buffer-out -> buffer-in) based on matching
 * saveTo and loadFrom tags on graph nodes.
 */
export function syncNamedBufferEdges(nodes: Node[], currentEdges: Edge[]): Edge[] {
  // Preserve execution edges or any non-buffer edge
  const execEdges = currentEdges.filter(
    (e) => e.sourceHandle !== 'buffer-out' && e.targetHandle !== 'buffer-in',
  )

  // Map each saveTo tag to its publishing node id
  const saveTagMap = new Map<string, string>()
  for (const node of nodes) {
    const saveTo = typeof node.data?.saveTo === 'string' ? node.data.saveTo.trim() : ''
    if (saveTo && saveTo !== '@') {
      saveTagMap.set(saveTo, node.id)
    }
  }

  // Build expected buffer edges
  const newBufferEdges: Edge[] = []
  for (const node of nodes) {
    const loadFrom = typeof node.data?.loadFrom === 'string' ? node.data.loadFrom.trim() : ''
    if (loadFrom && loadFrom !== '@') {
      const sourceId = saveTagMap.get(loadFrom)
      if (sourceId && sourceId !== node.id) {
        const edgeId = `e-${sourceId}-${node.id}-buffer`
        newBufferEdges.push({
          id: edgeId,
          source: sourceId,
          target: node.id,
          sourceHandle: 'buffer-out',
          targetHandle: 'buffer-in',
          animated: true,
          style: BUFFER_EDGE_STYLE,
        })
      }
    }
  }

  // Check if buffer edges changed
  const existingBufferEdges = currentEdges.filter(
    (e) => e.sourceHandle === 'buffer-out' || e.targetHandle === 'buffer-in',
  )

  if (
    existingBufferEdges.length === newBufferEdges.length &&
    existingBufferEdges.every((e, i) => {
      const n = newBufferEdges[i]
      return n && e.id === n.id && e.source === n.source && e.target === n.target
    })
  ) {
    return currentEdges
  }

  return [...execEdges, ...newBufferEdges]
}
