import type { Node } from '@xyflow/react'

/**
 * Determines whether a graph node has modified / customized parameters
 * that differ from standard defaults or already have an active template applied.
 */
export function isNodeDirty(node?: Node | null): boolean {
  if (!node) return false
  const data = node.data || {}

  // Any active expression formula constitutes a dirty/customized state
  const hasFormulas = Object.keys(data).some(
    (key) => key.endsWith('_formula') && typeof data[key] === 'string' && data[key].trim() !== '',
  )
  if (hasFormulas) return true

  // For Frame Buffer nodes, check feedback and composite parameters
  if (node.type === 'frameBuffer' || node.type === 'masterFrameBuffer') {
    // Feedback loop enabled
    if (data.feedback) return true

    // Non-default blend modes
    if (data.blendMode && data.blendMode !== 'replace') return true
    if (data.outputBlendMode && data.outputBlendMode !== 'replace') return true
    if (data.inputBlendMode && data.inputBlendMode !== 'none' && data.inputBlendMode !== 'replace') return true

    // Modified opacity, scale, rotation, positions
    if (data.opacity !== undefined && data.opacity !== 1.0 && data.opacity !== 1) return true
    if (data.scale !== undefined && data.scale !== 1.0 && data.scale !== 1) return true
    if (data.rotation !== undefined && data.rotation !== 0.0 && data.rotation !== 0) return true

    const posX = data.offsetX !== undefined ? data.offsetX : data.positionX
    const posY = data.offsetY !== undefined ? data.offsetY : data.positionY
    if (posX !== undefined && posX !== 0.0 && posX !== 0) return true
    if (posY !== undefined && posY !== 0.0 && posY !== 0) return true

    // An existing template was already configured
    if (typeof data.appliedTemplateId === 'string' && data.appliedTemplateId !== 'clean-slate') return true
  }

  return false
}
