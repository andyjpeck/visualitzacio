import * as THREE from 'three'

/**
 * Global texture buffer registry enabling named buffer routing (@NAME)
 * between visual passes, frame buffers, and post-processing layers.
 * Includes circular dependency detection and 1x1 black fallback textures.
 */
export class BufferPool {
  private readonly textures = new Map<string, THREE.Texture>()
  private readonly nodeToBuffer = new Map<string, string>()
  private readonly bufferToNode = new Map<string, string>()
  private readonly dependencies = new Map<string, Set<string>>()
  private readonly fallbackTexture: THREE.DataTexture

  constructor() {
    // 1x1 RGBA opaque black fallback texture
    const blackPixel = new Uint8Array([0, 0, 0, 255])
    this.fallbackTexture = new THREE.DataTexture(blackPixel, 1, 1, THREE.RGBAFormat)
    this.fallbackTexture.needsUpdate = true
  }

  /**
   * Registers a named texture (e.g. '@FEEDBACK_1', '@IMAGE_BG').
   *
   * @param name - Identifier prefixed with '@' by convention.
   * @param texture - THREE.Texture instance.
   */
  register(name: string, texture: THREE.Texture): void {
    this.textures.set(name, texture)
  }

  /**
   * Retrieves a texture by name, falling back to a 1x1 black texture if unassigned.
   *
   * @param name - Buffer name identifier.
   */
  get(name: string): THREE.Texture {
    return this.textures.get(name) ?? this.fallbackTexture
  }

  /**
   * Checks whether a named buffer is currently registered in the pool.
   *
   * @param name - Buffer name identifier.
   */
  has(name: string): boolean {
    return this.textures.has(name)
  }

  /**
   * Returns the shared 1x1 black fallback texture.
   */
  getFallbackTexture(): THREE.Texture {
    return this.fallbackTexture
  }

  /**
   * Records the relationship between a node and the buffer it writes to.
   *
   * @param nodeId - Unique node ID.
   * @param bufferName - Named buffer identifier (e.g. '@A').
   */
  recordNodeMapping(nodeId: string, bufferName: string): void {
    this.nodeToBuffer.set(nodeId, bufferName)
    this.bufferToNode.set(bufferName, nodeId)
  }

  /**
   * Records a node's dependency on an external buffer.
   *
   * @param nodeId - Requesting node ID.
   * @param targetBufferName - Target buffer being sampled (e.g. '@B').
   */
  recordDependency(nodeId: string, targetBufferName: string): void {
    let deps = this.dependencies.get(nodeId)
    if (!deps) {
      deps = new Set<string>()
      this.dependencies.set(nodeId, deps)
    }
    deps.add(targetBufferName)
  }

  /**
   * Detects whether requesting targetBufferName from nodeId creates a circular dependency graph.
   *
   * @param nodeId - Requesting node ID.
   * @param targetBufferName - Buffer to be sampled.
   */
  isCircular(nodeId: string, targetBufferName: string): boolean {
    const visited = new Set<string>()
    const targetNodeId = this.bufferToNode.get(targetBufferName)

    if (!targetNodeId) return false
    if (targetNodeId === nodeId) return true

    const stack: string[] = [targetNodeId]

    while (stack.length > 0) {
      const current = stack.pop()!
      if (current === nodeId) {
        return true
      }

      if (!visited.has(current)) {
        visited.add(current)
        const deps = this.dependencies.get(current)
        if (deps) {
          for (const depBuffer of deps) {
            const nextNode = this.bufferToNode.get(depBuffer)
            if (nextNode) {
              stack.push(nextNode)
            }
          }
        }
      }
    }

    return false
  }

  /**
   * Resolves a named buffer texture, checking for circular dependencies.
   * If a cycle is detected or the buffer is missing, safely returns the fallback texture.
   *
   * @param name - Buffer name identifier.
   * @param requestingNodeId - Optional node ID making the request.
   */
  resolve(name: string, requestingNodeId?: string): THREE.Texture {
    if (requestingNodeId && this.isCircular(requestingNodeId, name)) {
      return this.fallbackTexture
    }
    return this.get(name)
  }

  /**
   * Clears all registered textures and dependency tracking.
   */
  clear(): void {
    this.textures.clear()
    this.dependencies.clear()
  }

  /**
   * Releases GPU memory associated with the fallback texture.
   */
  dispose(): void {
    this.clear()
    this.fallbackTexture.dispose()
    this.nodeToBuffer.clear()
    this.bufferToNode.clear()
  }
}
