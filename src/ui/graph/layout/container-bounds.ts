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
