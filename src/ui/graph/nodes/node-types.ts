import type { NodeTypes } from '@xyflow/react'
import { MasterFrameBufferNodeComponent } from './master-frame-buffer-node'
import { FrameBufferNodeComponent } from './frame-buffer-node'
import { StaticImageNodeComponent } from './static-image-node'
import { TestVisualNodeComponent } from './test-visual-node'

export const nodeTypes: NodeTypes = {
  masterFrameBuffer: MasterFrameBufferNodeComponent,
  frameBuffer: FrameBufferNodeComponent,
  staticImage: StaticImageNodeComponent,
  testVisual: TestVisualNodeComponent,
}
