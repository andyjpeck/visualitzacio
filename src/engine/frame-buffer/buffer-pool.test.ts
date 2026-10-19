import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { BufferPool } from './buffer-pool'

describe('BufferPool', () => {
  let pool: BufferPool

  beforeEach(() => {
    pool = new BufferPool()
  })

  it('registers and resolves named textures', () => {
    const tex = new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1)
    pool.register('@FEEDBACK', tex)

    expect(pool.has('@FEEDBACK')).toBe(true)
    expect(pool.get('@FEEDBACK')).toBe(tex)
  })

  it('returns fallback 1x1 black texture for unregistered buffers without crashing', () => {
    const fallback = pool.get('@NON_EXISTENT')
    expect(fallback).toBeDefined()
    expect(fallback).toBe(pool.getFallbackTexture())
  })

  it('clears registered textures on reset', () => {
    const tex = new THREE.DataTexture(new Uint8Array([0, 255, 0, 255]), 1, 1)
    pool.register('@LAYER_1', tex)
    expect(pool.has('@LAYER_1')).toBe(true)

    pool.clear()
    expect(pool.has('@LAYER_1')).toBe(false)
    expect(pool.get('@LAYER_1')).toBe(pool.getFallbackTexture())
  })

  it('detects circular dependencies between buffers and returns fallback', () => {
    // Node A (saves to @A) loads @B
    // Node B (saves to @B) loads @A
    pool.recordNodeMapping('node-a', '@A')
    pool.recordNodeMapping('node-b', '@B')

    pool.recordDependency('node-a', '@B')
    pool.recordDependency('node-b', '@A')

    expect(pool.isCircular('node-a', '@B')).toBe(true)
    expect(pool.isCircular('node-b', '@A')).toBe(true)

    // Resolving with requesting node checks for cycle
    const texA = new THREE.DataTexture(new Uint8Array(4), 1, 1)
    const texB = new THREE.DataTexture(new Uint8Array(4), 1, 1)
    pool.register('@A', texA)
    pool.register('@B', texB)

    const resolvedForA = pool.resolve('@B', 'node-a')
    expect(resolvedForA).toBe(pool.getFallbackTexture())
  })

  it('safely resolves non-circular dependency chains', () => {
    // Node Background (@BG) -> Node Main (@MAIN) -> Screen
    pool.recordNodeMapping('node-bg', '@BG')
    pool.recordNodeMapping('node-main', '@MAIN')

    pool.recordDependency('node-main', '@BG')

    expect(pool.isCircular('node-main', '@BG')).toBe(false)

    const texBg = new THREE.DataTexture(new Uint8Array(4), 1, 1)
    pool.register('@BG', texBg)

    const resolved = pool.resolve('@BG', 'node-main')
    expect(resolved).toBe(texBg)
  })

  it('disposes fallback texture on pool disposal', () => {
    const fallback = pool.getFallbackTexture()
    const disposeSpy = vi.spyOn(fallback, 'dispose')

    pool.dispose()
    expect(disposeSpy).toHaveBeenCalled()
  })
})
