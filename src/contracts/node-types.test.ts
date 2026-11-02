import { describe, expect, it } from 'vitest'
import {
  ALL_NODE_TYPES,
  isLayerNodeType,
  LAYER_NODE_TYPES,
} from './node-types'

describe('node-types contracts (Track 15)', () => {
  it('includes maskCompositor in LAYER_NODE_TYPES and ALL_NODE_TYPES', () => {
    expect(LAYER_NODE_TYPES).toContain('maskCompositor')
    expect(ALL_NODE_TYPES).toContain('maskCompositor')
    expect(isLayerNodeType('maskCompositor')).toBe(true)
  })
})
