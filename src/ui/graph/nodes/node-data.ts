/**
 * Data contracts and type definitions for custom React Flow nodes.
 */

export interface BaseNodeData {
  label: string
  bypassed?: boolean
  [key: string]: unknown
}

export interface MasterFrameBufferNodeData extends BaseNodeData {
  blendMode?: string
  inputBlendMode?: string
  outputBlendMode?: string
  opacity?: number | string
  resolutionScale?: number
}

export interface FrameBufferNodeData extends BaseNodeData {
  saveTo?: string
  loadFrom?: string
  blendMode?: string
  inputBlendMode?: string
  outputBlendMode?: string
  feedback?: boolean
  opacity?: number | string
  scale?: number | string
  rotation?: number | string
  positionX?: number | string
  positionY?: number | string
}

export interface StaticImageNodeData extends BaseNodeData {
  saveTo?: string
  imageUrl?: string
  fitMode?: 'cover' | 'contain' | 'stretch'
  opacity?: number | string
}

export interface TestVisualNodeData extends BaseNodeData {
  shape?: string
  reactive?: boolean
  scale?: number | string
}
