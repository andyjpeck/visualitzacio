import type { Connection, Edge } from '@xyflow/react'

export interface ConnectionValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validates connection compatibility and prevents invalid cycles in the graph.
 *
 * Rules:
 * 1. No self-connections: A node cannot connect to itself.
 * 2. Port compatibility:
 *    - `exec-out` handles can only connect to `exec-in` handles.
 *    - `buffer-out` handles can only connect to `buffer-in` handles.
 * 3. Execution Cycle Prevention: Execution hierarchy edges must form a DAG (Directed Acyclic Graph).
 *    If target node can reach source node via existing execution edges, the connection is rejected.
 */
export function validateConnection(
  connection: Connection,
  existingEdges: Edge[],
): ConnectionValidationResult {
  const { source, target, sourceHandle, targetHandle } = connection

  // 1. Reject self-connections
  if (source === target) {
    return {
      valid: false,
      reason: 'Self-connections are not permitted.',
    }
  }

  // 2. Reject mismatched handle types
  const isSourceExec = sourceHandle === 'exec-out' || (!sourceHandle && !targetHandle)
  const isTargetExec = targetHandle === 'exec-in' || (!sourceHandle && !targetHandle)

  const isSourceBuffer = sourceHandle === 'buffer-out'
  const isTargetBuffer = targetHandle === 'buffer-in'

  if (isSourceExec && !isTargetExec) {
    return {
      valid: false,
      reason: 'Execution ports (top/bottom) can only connect to other execution ports.',
    }
  }

  if (isSourceBuffer && !isTargetBuffer) {
    return {
      valid: false,
      reason: 'Texture buffer ports (left/right) can only connect to buffer ports.',
    }
  }

  if (!isSourceExec && !isSourceBuffer) {
    return {
      valid: false,
      reason: `Invalid source handle: ${sourceHandle}`,
    }
  }

  // 3. Execution DAG Cycle Detection (DFS)
  if (isSourceExec && isTargetExec) {
    if (wouldCreateCycle(source, target, existingEdges)) {
      return {
        valid: false,
        reason: 'Connection would create an execution loop (DAG violation).',
      }
    }
  }

  return { valid: true }
}

/**
 * Checks whether adding a directed edge from `source` to `target` would create a cycle.
 * Traverses reachable nodes from `target` using DFS; if `source` is reachable, a cycle would form.
 */
export function wouldCreateCycle(
  source: string,
  target: string,
  edges: Edge[],
): boolean {
  const visited = new Set<string>()
  const queue = [target]

  while (queue.length > 0) {
    const current = queue.pop()!
    if (current === source) {
      return true
    }

    if (!visited.has(current)) {
      visited.add(current)

      // Find all outgoing execution edges from `current`
      const outgoing = edges.filter(
        (e) => e.source === current && (e.sourceHandle === 'exec-out' || !e.sourceHandle),
      )

      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          queue.push(edge.target)
        }
      }
    }
  }

  return false
}
