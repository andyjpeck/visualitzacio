import type { Node } from '@xyflow/react'

export const LEAF_NODE_WIDTH = 240
export const LEAF_NODE_HEIGHT = 56
export const CONTAINER_PADDING = 20
export const CONTAINER_HEADER_HEIGHT = 65
export const CHILD_GAP = 15
export const MIN_CHILD_X = 15
export const MIN_CHILD_Y = 60

export interface NodeDimensions {
  width: number
  height: number
}

/**
 * Computes the required dimensions for a node.
 * For leaf nodes, returns standard width and height.
 * For container nodes, recursively computes the bounding box to enclose all direct children.
 */
export function calculateNodeDimensions<T extends Record<string, unknown>>(
  node: Node<T>,
  allNodes: Node<T>[],
): NodeDimensions {
  const isContainer =
    node.type === 'masterFrameBuffer' ||
    node.type === 'frameBuffer' ||
    Boolean(node.data?.isContainer)

  if (!isContainer) {
    return {
      width: (node.style?.width as number) || LEAF_NODE_WIDTH,
      height: (node.style?.height as number) || LEAF_NODE_HEIGHT,
    }
  }

  const directChildren = allNodes.filter((n) => n.parentId === node.id)
  if (directChildren.length === 0) {
    return {
      width: node.type === 'masterFrameBuffer' ? 280 : LEAF_NODE_WIDTH,
      height: node.type === 'masterFrameBuffer' ? 160 : LEAF_NODE_HEIGHT,
    }
  }

  let maxRight = 0
  let maxBottom = 0

  for (const child of directChildren) {
    const childDim = calculateNodeDimensions(child, allNodes)
    const right = (child.position?.x ?? CONTAINER_PADDING) + childDim.width
    const bottom = (child.position?.y ?? CONTAINER_HEADER_HEIGHT) + childDim.height

    if (right > maxRight) maxRight = right
    if (bottom > maxBottom) maxBottom = bottom
  }

  const minWidth = node.type === 'masterFrameBuffer' ? 280 : 260
  const minHeight = 160

  return {
    width: Math.max(minWidth, maxRight + CONTAINER_PADDING),
    height: Math.max(minHeight, maxBottom + CONTAINER_PADDING),
  }
}

/**
 * Returns the next available position inside a container node so that
 * a newly added child is placed below all existing children with a clean vertical gap.
 */
export function getNextChildPosition<T extends Record<string, unknown>>(
  parentId: string,
  allNodes: Node<T>[],
): { x: number; y: number } {
  const directChildren = allNodes.filter((n) => n.parentId === parentId)
  if (directChildren.length === 0) {
    return { x: CONTAINER_PADDING, y: CONTAINER_HEADER_HEIGHT }
  }

  let lowestBottom = CONTAINER_HEADER_HEIGHT
  for (const child of directChildren) {
    const dim = calculateNodeDimensions(child, allNodes)
    const bottom = (child.position?.y ?? CONTAINER_HEADER_HEIGHT) + dim.height
    if (bottom > lowestBottom) {
      lowestBottom = bottom
    }
  }

  return {
    x: CONTAINER_PADDING,
    y: lowestBottom + CHILD_GAP,
  }
}

/**
 * Recalculates style width and height for all container nodes in the graph
 * to ensure every parent node strictly encloses all of its children.
 */
export function recalculateContainerBounds<T extends Record<string, unknown>>(
  nodes: Node<T>[],
): Node<T>[] {
  let currentNodes = [...nodes]

  // Multi-pass bottom-up convergence to propagate sizes up nested container hierarchies
  for (let pass = 0; pass < 4; pass++) {
    let changed = false
    currentNodes = currentNodes.map((node) => {
      const isContainer =
        node.type === 'masterFrameBuffer' ||
        node.type === 'frameBuffer' ||
        Boolean(node.data?.isContainer)

      if (!isContainer) return node

      const dims = calculateNodeDimensions(node, currentNodes)
      const currentWidth = node.style?.width as number | undefined
      const currentHeight = node.style?.height as number | undefined

      if (currentWidth !== dims.width || currentHeight !== dims.height) {
        changed = true
        return {
          ...node,
          style: {
            ...node.style,
            width: dims.width,
            height: dims.height,
          },
        }
      }
      return node
    })

    if (!changed) break
  }

  return currentNodes
}

/**
 * Reflows all container stacks in the graph bottom-up into clean, non-overlapping vertical columns.
 * For each container in order from deepest to root:
 * 1. Direct children are sorted (publishers first, then by current Y position).
 * 2. Every child is locked to horizontal x = CONTAINER_PADDING.
 * 3. Every child's Y position is assigned sequentially based on the preceding sibling's height + gap.
 * 4. All container heights and widths are updated to enclose their stacks with padding.
 */
export function reflowGraphStacks<T extends Record<string, unknown>>(
  nodes: Node<T>[],
): Node<T>[] {
  if (nodes.length === 0) return nodes

  // Find all container IDs (nodes that have children)
  const containerIds = new Set<string>()
  for (const node of nodes) {
    if (node.parentId) {
      containerIds.add(node.parentId)
    }
  }

  // Calculate container hierarchy depth so innermost containers reflow first
  const getDepth = (id: string, visited = new Set<string>()): number => {
    if (visited.has(id)) return 0
    visited.add(id)
    const node = nodes.find((n) => n.id === id)
    if (!node || !node.parentId) return 0
    return 1 + getDepth(node.parentId, visited)
  }

  const sortedContainerIds = Array.from(containerIds).sort(
    (a, b) => getDepth(b) - getDepth(a),
  )

  let currentNodes = [...nodes]

  // Reflow containers bottom-up
  for (const containerId of sortedContainerIds) {
    const directChildren = currentNodes.filter((n) => n.parentId === containerId)
    if (directChildren.length === 0) continue

    // Sibling sort: Respect user's vertical stack sequence (ascending Y)
    const sortedChildren = [...directChildren].sort((a, b) => {
      return (a.position?.y ?? 0) - (b.position?.y ?? 0)
    })

    let currentY = CONTAINER_HEADER_HEIGHT
    const posMap = new Map<string, { x: number; y: number }>()

    for (const child of sortedChildren) {
      posMap.set(child.id, {
        x: CONTAINER_PADDING,
        y: currentY,
      })
      const dims = calculateNodeDimensions(child, currentNodes)
      currentY += dims.height + CHILD_GAP
    }

    currentNodes = currentNodes.map((node) => {
      const newPos = posMap.get(node.id)
      if (newPos) {
        return {
          ...node,
          position: newPos,
        }
      }
      return node
    })
  }

  // Finally recalculate width & height of all containers to hug the reflowed stacks
  return recalculateContainerBounds(currentNodes)
}

/**
 * Snaps all direct children of a container into a single, clean vertical column stack.
 * Reflows all containers bottom-up to ensure ancestor containers expand and siblings shift down.
 */
export function snapContainerStack<T extends Record<string, unknown>>(
  parentId: string,
  nodes: Node<T>[],
): Node<T>[] {
  void parentId
  return reflowGraphStacks(nodes)
}
