import { describe, it, expect } from 'vitest'
import {
  FRAME_BUFFER_TEMPLATES,
  getTemplateById,
  applyTemplateToNode,
} from './frame-buffer-templates'
import { FrameBufferNode } from './frame-buffer-node'
import { ExpressionEngine } from '../expressions/expression-engine'

describe('FrameBufferTemplates', () => {
  it('contains exactly the 6 curated built-in templates required by spec', () => {
    expect(FRAME_BUFFER_TEMPLATES).toHaveLength(6)

    const ids = FRAME_BUFFER_TEMPLATES.map((t) => t.id)
    expect(ids).toEqual([
      'clean-slate',
      'phosphor-trails',
      'feedback-vortex',
      'four-corner',
      'pip-echo',
      'beat-shockwave',
    ])
  })

  it('validates each template structure, options, and instantiations', () => {
    const engine = new ExpressionEngine()

    for (const template of FRAME_BUFFER_TEMPLATES) {
      expect(template.id).toBeDefined()
      expect(template.name).toBeDefined()
      expect(template.description).toBeDefined()
      expect(template.config).toBeDefined()

      const node = template.instantiate(engine)
      expect(node).toBeInstanceOf(FrameBufferNode)
      expect(node.blendMode).toBe(template.config.blendMode)
      expect(node.feedback).toBe(template.config.feedback)
    }
  })

  it('retrieves templates by ID using getTemplateById', () => {
    const vortex = getTemplateById('feedback-vortex')
    expect(vortex).toBeDefined()
    expect(vortex?.name).toBe('Infinite Feedback Vortex')
    expect(vortex?.config.scale).toBe(0.98)

    const unknown = getTemplateById('unknown-id')
    expect(unknown).toBeUndefined()
  })

  it('applies a template configuration to an existing FrameBufferNode', () => {
    const engine = new ExpressionEngine()
    const node = new FrameBufferNode({ id: 'target-node' })

    const trails = getTemplateById('phosphor-trails')!
    applyTemplateToNode(node, trails, engine)

    expect(node.feedback).toBe(true)
    expect(node.blendMode).toBe('add')
    expect(node.opacity).toBe(0.94)
    expect(node.scale).toBe(1.0)
  })
})
