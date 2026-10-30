import type { Node } from '@xyflow/react'

/**
 * Calculates the exact linear execution pass sequence of nodes in the graph.
 *
 * Rules:
 * 1. Containers execute their child nodes before finishing their own composite pass.
 * 2. Sibling nodes within a container are sorted:
 *    a) Dependency order: Publisher nodes (with saveTo) run before consumer nodes (with loadFrom).
 *    b) Spatial position: Ascending Y (top-to-bottom), then ascending X (left-to-right).
 * 3. Returns a Map of nodeId -> execution sequence number (1-based index).
 */
export function computeExecutionOrder(nodes: Node[]): Map<string, number> {
  const orderMap = new Map<string, number>()
  if (nodes.length === 0) return orderMap

  // Group children by parentId
  const childrenByParent = new Map<string, Node[]>()
  for (const node of nodes) {
    const parentId = node.parentId || 'root'
    const list = childrenByParent.get(parentId) || []
    list.push(node)
    childrenByParent.set(parentId, list)
  }

  // Sorter for sibling nodes within any container
  const sortSiblings = (siblings: Node[]): Node[] => {
    return [...siblings].sort((a, b) => {
      // 1. Publishers before consumers
      const aPub = Boolean(a.data?.saveTo)
      const bPub = Boolean(b.data?.saveTo)
      if (aPub && !bPub) return -1
      if (!aPub && bPub) return 1

      // 2. Spatial position: Y first (top-to-bottom), then X (left-to-right)
      const aY = a.position?.y ?? 0
      const bY = b.position?.y ?? 0
      if (aY !== bY) return aY - bY

      const aX = a.position?.x ?? 0
      const bX = b.position?.x ?? 0
      return aX - bX
    })
  }

  let counter = 1

  // Traverse a node and its children depth-first
  const traverse = (node: Node) => {
    const rawChildren = childrenByParent.get(node.id) || []
    const sortedChildren = sortSiblings(rawChildren)

    // Execute children first
    for (const child of sortedChildren) {
      traverse(child)
    }

    // Then this node executes/composites
    orderMap.set(node.id, counter++)
  }

  // Root level: Master Frame Buffer
  const topLevel = sortSiblings(childrenByParent.get('root') || nodes.filter((n) => !n.parentId))
  for (const rootNode of topLevel) {
    traverse(rootNode)
  }

  return orderMap
}
