import { FrameBufferNode, type FrameBufferNodeOptions } from './frame-buffer-node'
import type { ExpressionEngine } from '../expressions/expression-engine'

export type TemplateCategory = 'basic' | 'feedback' | 'multi-pass' | 'audio-reactive'

export interface FrameBufferTemplateConfig {
  feedback: boolean
  blendMode: string
  opacity: number | string
  scale: number | string
  rotation: number | string
  positionX: number | string
  positionY: number | string
  clearColor?: string
}

export interface FrameBufferTemplate {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: TemplateCategory
  readonly config: FrameBufferTemplateConfig
  instantiate(engine?: ExpressionEngine): FrameBufferNode
}

export const FRAME_BUFFER_TEMPLATES: readonly FrameBufferTemplate[] = [
  {
    id: 'clean-slate',
    name: 'Clean Slate Default',
    description: 'Standard direct render buffer without feedback or decay.',
    category: 'basic',
    config: {
      feedback: false,
      blendMode: 'replace',
      opacity: 1.0,
      scale: 1.0,
      rotation: 0.0,
      positionX: 0.0,
      positionY: 0.0,
    },
    instantiate(engine?: ExpressionEngine): FrameBufferNode {
      return createNodeFromTemplate(this, engine)
    },
  },
  {
    id: 'phosphor-trails',
    name: 'Analog Phosphor Trails',
    description: 'High persistence additive feedback producing vintage CRT phosphor glow and motion blur.',
    category: 'feedback',
    config: {
      feedback: true,
      blendMode: 'additive',
      opacity: 0.94,
      scale: 1.0,
      rotation: 0.0,
      positionX: 0.0,
      positionY: 0.0,
    },
    instantiate(engine?: ExpressionEngine): FrameBufferNode {
      return createNodeFromTemplate(this, engine)
    },
  },
  {
    id: 'feedback-vortex',
    name: 'Infinite Feedback Vortex',
    description: 'Slow inward zoom with continuous rotation creating an infinite kaleidoscopic tunnel.',
    category: 'feedback',
    config: {
      feedback: true,
      blendMode: 'replace',
      opacity: 0.96,
      scale: 0.98,
      rotation: 0.02,
      positionX: 0.0,
      positionY: 0.0,
    },
    instantiate(engine?: ExpressionEngine): FrameBufferNode {
      return createNodeFromTemplate(this, engine)
    },
  },
  {
    id: 'four-corner',
    name: '4-Corner Multi-Screen Replicator',
    description: 'Multi-screen array tiling 4 feedback quadrants surrounding a centered focal core.',
    category: 'multi-pass',
    config: {
      feedback: true,
      blendMode: 'additive',
      opacity: 0.9,
      scale: 0.5,
      rotation: 0.0,
      positionX: 0.0,
      positionY: 0.0,
    },
    instantiate(engine?: ExpressionEngine): FrameBufferNode {
      return createNodeFromTemplate(this, engine)
    },
  },
  {
    id: 'pip-echo',
    name: 'Picture-in-Picture (PIP) Echo',
    description: 'Main stage with miniature top-right picture-in-picture feedback echo.',
    category: 'multi-pass',
    config: {
      feedback: true,
      blendMode: 'additive',
      opacity: 0.85,
      scale: 0.35,
      rotation: 0.0,
      positionX: 0.6,
      positionY: 0.6,
    },
    instantiate(engine?: ExpressionEngine): FrameBufferNode {
      return createNodeFromTemplate(this, engine)
    },
  },
  {
    id: 'beat-shockwave',
    name: 'Beat-Pulsed Shockwave Feedback',
    description: 'Explosive feedback expansion that shocks outward on every kick drum beat and twists with bass.',
    category: 'audio-reactive',
    config: {
      feedback: true,
      blendMode: 'additive',
      opacity: '0.85 + $BEAT * 0.1',
      scale: '1.0 + $BEAT * 0.08',
      rotation: '$BASS * 0.03',
      positionX: 0.0,
      positionY: 0.0,
    },
    instantiate(engine?: ExpressionEngine): FrameBufferNode {
      return createNodeFromTemplate(this, engine)
    },
  },
]

function createNodeFromTemplate(
  template: FrameBufferTemplate,
  engine?: ExpressionEngine,
): FrameBufferNode {
  const options: FrameBufferNodeOptions = {
    id: `fb-${template.id}`,
    name: template.name,
    isMaster: true,
    feedback: template.config.feedback,
    blendMode: template.config.blendMode,
    opacity: template.config.opacity,
    scale: template.config.scale,
    rotation: template.config.rotation,
    positionX: template.config.positionX,
    positionY: template.config.positionY,
    clearColor: template.config.clearColor,
    expressionEngine: engine,
  }
  return new FrameBufferNode(options)
}

/**
 * Looks up a built-in frame buffer template by unique ID.
 *
 * @param id - Template identifier string (e.g. 'clean-slate', 'phosphor-trails').
 */
export function getTemplateById(id: string): FrameBufferTemplate | undefined {
  return FRAME_BUFFER_TEMPLATES.find((t) => t.id === id)
}

/**
 * Applies a template configuration to an existing FrameBufferNode instance.
 *
 * @param node - Target FrameBufferNode.
 * @param template - Template definition to apply.
 * @param engine - Active ExpressionEngine instance for dynamic formula binding.
 */
export function applyTemplateToNode(
  node: FrameBufferNode,
  template: FrameBufferTemplate,
  engine?: ExpressionEngine,
): void {
  node.setFeedback(template.config.feedback)
  node.blendMode = template.config.blendMode
  if (engine) {
    node.bindExpression('opacity', template.config.opacity, engine)
    node.bindExpression('scale', template.config.scale, engine)
    node.bindExpression('rotation', template.config.rotation, engine)
    node.bindExpression('positionX', template.config.positionX, engine)
    node.bindExpression('positionY', template.config.positionY, engine)
  }
}
