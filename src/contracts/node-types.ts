/**
 * Canonical node types for Visualització visual synthesis engine and graph pipeline.
 *
 * Any new component or layer type added to the application MUST be registered here.
 * The high-fidelity verification test suite dynamically iterates over this registry
 * to ensure all node types have passing WebGL smoke tests and valid presets.
 */

export const LAYER_NODE_TYPES = [
  'frameBuffer',
  'staticImage',
  'duperscopeNode',
  'testVisual',
] as const

export type LayerNodeType = (typeof LAYER_NODE_TYPES)[number]

export const ALL_NODE_TYPES = [
  'masterFrameBuffer',
  ...LAYER_NODE_TYPES,
] as const

export type AllNodeType = (typeof ALL_NODE_TYPES)[number]

/**
 * Type guard for LayerNodeType.
 */
export function isLayerNodeType(type: string): type is LayerNodeType {
  return (LAYER_NODE_TYPES as readonly string[]).includes(type)
}
