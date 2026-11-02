import type { Node } from '@xyflow/react'
import { splitStatements, stripComments } from '../../engine/nodes/duperscope-compiler'

export type ComplexityTier = 'bypassed' | 'low' | 'medium' | 'high' | 'heavy'

/**
 * Static computational complexity & GPU cost estimate for a single scene graph layer.
 */
export interface LayerComplexityMetrics {
  nodeId: string
  /** Direct computational cost score of this node alone (0 when bypassed). */
  selfScore: number
  /** Cumulative cost score of this node plus all nested descendant layers. */
  subtreeScore: number
  /** Integer percentage (0–100) of total active scene complexity attributable to this node directly. */
  sharePercent: number
  /** Integer percentage (0–100) of total active scene complexity attributable to this node and its descendants. */
  subtreeSharePercent: number
  /** Visual severity tier derived from share percentage and selfScore. */
  tier: ComplexityTier
  /** Estimated number of full-screen WebGL composite/feedback passes per frame. */
  fullScreenPasses: number
  /** Estimated offscreen HalfFloatType FBO VRAM footprint in megabytes (at 1080p * resolutionScale^2). */
  estimatedVramMb: number
  /** Estimated procedural AST / point loop operations per frame (for Duperscope & expression bindings). */
  estimatedPointOps: number
  /** Actionable optimization tips and anti-pattern warnings for preset authors. */
  lintWarnings: string[]
}

const BASE_1080P_HALF_FLOAT_FBO_MB = (1920 * 1080 * 8) / (1024 * 1024) // ~15.82 MB per RGBA16F FBO
const HEAVY_FUNCTION_REGEX = /\b(sin|cos|tan|asin|acos|atan|atan2|pow|sqrt|exp|log)\b|#FFT|#WAVEFORM|#BEAT/g
const N_ASSIGNMENT_REGEX = /(?:^|[;\n])\s*n\s*=\s*([0-9]+(?:\.[0-9]+)?)/

function normalizeTag(tag: unknown): string | null {
  if (typeof tag !== 'string' || tag.trim() === '') return null
  const trimmed = tag.trim()
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

function parseEstimatedPoints(initCode: string, frameCode: string): number {
  const combined = `${stripComments(initCode)}\n${stripComments(frameCode)}`
  const lines = splitStatements(combined)
  let points = 200
  for (const stmt of lines) {
    const match = N_ASSIGNMENT_REGEX.exec(stmt)
    if (match) {
      const parsed = Number(match[1])
      if (Number.isFinite(parsed)) {
        points = Math.max(0, Math.min(4096, Math.floor(parsed)))
      }
    }
  }
  return points
}

function countHeavyCalls(code: string): number {
  const cleaned = stripComments(code)
  const matches = cleaned.match(HEAVY_FUNCTION_REGEX)
  return matches ? matches.length : 0
}

function countExpressionBoundParams(data: Record<string, unknown> | undefined): number {
  if (!data) return 0
  const paramModes = data.paramModes as Record<string, string> | undefined
  if (!paramModes || typeof paramModes !== 'object') return 0
  let count = 0
  for (const key of Object.keys(paramModes)) {
    if (paramModes[key] === 'expression') {
      count++
    }
  }
  return count
}

/**
 * Computes Tier 0 static computational complexity estimates, percentage cost shares,
 * and anti-pattern lint warnings for all nodes in the scene graph.
 *
 * Runs strictly in the UI Control Plane when `graphNodes` or `resolutionScale` changes,
 * introducing zero overhead into the 60 FPS WebGL render loop.
 *
 * @param nodes - Current React Flow scene graph nodes.
 * @param resolutionScale - Active preset resolution scale multiplier (default 1.0).
 * @returns Map from node ID to its computed `LayerComplexityMetrics`.
 */
export function computeSceneLayerComplexity(
  nodes: Node[],
  resolutionScale = 1.0,
): Map<string, LayerComplexityMetrics> {
  const result = new Map<string, LayerComplexityMetrics>()
  const childrenByParent = new Map<string, Node[]>()
  const consumersByTag = new Map<string, Node[]>()

  for (const node of nodes) {
    if (node.parentId) {
      const list = childrenByParent.get(node.parentId) ?? []
      list.push(node)
      childrenByParent.set(node.parentId, list)
    }
    const loadTag = normalizeTag(node.data?.loadFrom)
    if (loadTag && !node.data?.bypassed) {
      const consumers = consumersByTag.get(loadTag) ?? []
      consumers.push(node)
      consumersByTag.set(loadTag, consumers)
    }
  }

  const vramScaleFactor = Math.max(0.0625, resolutionScale * resolutionScale)
  const singleFboMb = Number((BASE_1080P_HALF_FLOAT_FBO_MB * vramScaleFactor).toFixed(1))

  // 1. Compute selfScore, pass counts, VRAM, point ops, and lint warnings per node
  for (const node of nodes) {
    const data = (node.data ?? {}) as Record<string, unknown>
    const isBypassed = Boolean(data.bypassed)
    const isMaster = node.id === 'master-frame-buffer' || node.type === 'masterFrameBuffer'
    const isFrameBuffer = isMaster || node.type === 'frameBuffer'
    const directChildren = childrenByParent.get(node.id) ?? []
    const activeChildren = directChildren.filter((c) => !c.data?.bypassed)

    const lintWarnings: string[] = []
    const exprParamCount = countExpressionBoundParams(data)

    if (isBypassed) {
      result.set(node.id, {
        nodeId: node.id,
        selfScore: 0,
        subtreeScore: 0,
        sharePercent: 0,
        subtreeSharePercent: 0,
        tier: 'bypassed',
        fullScreenPasses: 0,
        estimatedVramMb: 0,
        estimatedPointOps: 0,
        lintWarnings: [],
      })
      continue
    }

    const numericOpacity = typeof data.opacity === 'number' ? data.opacity : 1.0
    const isOpacityExpression =
      (data.paramModes as Record<string, string> | undefined)?.opacity === 'expression'
    if (!isMaster && !isOpacityExpression && numericOpacity <= 0.001) {
      lintWarnings.push(
        'Tip: Layer has 0 opacity; bypass the layer when unused to skip evaluation.',
      )
    }

    let selfScore = 0
    let fullScreenPasses = 0
    let estimatedVramMb = 0
    let estimatedPointOps = exprParamCount

    if (isFrameBuffer) {
      const feedback = Boolean(data.feedback)
      const saveTo = normalizeTag(data.saveTo)
      const loadFrom = normalizeTag(data.loadFrom)
      const inputBlendMode =
        typeof data.inputBlendMode === 'string'
          ? data.inputBlendMode
          : loadFrom
            ? 'replace'
            : 'none'

      const isPassThrough =
        !isMaster &&
        !feedback &&
        directChildren.length === 0 &&
        Boolean(loadFrom) &&
        inputBlendMode !== 'none' &&
        !saveTo

      if (isPassThrough) {
        fullScreenPasses = 1
        estimatedVramMb = 0
        selfScore = 12 + exprParamCount * 2
      } else if (feedback && (activeChildren.length > 0 || Boolean(loadFrom))) {
        fullScreenPasses = 3 + (loadFrom && inputBlendMode !== 'none' ? 1 : 0)
        estimatedVramMb = Number((singleFboMb * 3).toFixed(1))
        selfScore = 55 + exprParamCount * 2
        if (!isMaster) {
          lintWarnings.push(
            'Note: Ping-pong feedback with children uses 3 offscreen FBOs and 3–4 full-screen shader passes.',
          )
        }
      } else if (feedback) {
        fullScreenPasses = 2
        estimatedVramMb = Number((singleFboMb * 2).toFixed(1))
        selfScore = 36 + exprParamCount * 2
      } else {
        fullScreenPasses = isMaster ? 1 : 2
        estimatedVramMb = singleFboMb
        selfScore = 25 + exprParamCount * 2
      }

      // Check if all consumers of saveTo sample this buffer at <= 0.5x scale
      if (saveTo) {
        const consumers = consumersByTag.get(saveTo) ?? []
        if (consumers.length > 0) {
          const allDownscaled = consumers.every((c) => {
            const cData = (c.data ?? {}) as Record<string, unknown>
            const scale = typeof cData.scale === 'number' ? cData.scale : 1.0
            const scaleX = typeof cData.scaleX === 'number' ? cData.scaleX : scale
            const scaleY = typeof cData.scaleY === 'number' ? cData.scaleY : scale
            return Math.max(scale, scaleX, scaleY) <= 0.5
          })
          if (allDownscaled) {
            lintWarnings.push(
              `Tip: All consumers sample ${saveTo} at ≤0.5x scale; reducing resolution scale saves fill-rate.`,
            )
          }
        }
      }
    } else if (node.type === 'duperscopeNode') {
      const initCode = typeof data.initCode === 'string' ? data.initCode : 'n = 200;'
      const beatCode = typeof data.beatCode === 'string' ? data.beatCode : ''
      const frameCode = typeof data.frameCode === 'string' ? data.frameCode : ''
      const pointCode = typeof data.pointCode === 'string' ? data.pointCode : ''

      const estimatedPoints = parseEstimatedPoints(initCode, frameCode)
      const frameStmts = splitStatements(frameCode).length + splitStatements(beatCode).length
      const pointStmts = Math.max(1, splitStatements(pointCode).length)
      const pointHeavyCalls = countHeavyCalls(pointCode)

      estimatedPointOps =
        frameStmts + estimatedPoints * (pointStmts + pointHeavyCalls) + exprParamCount
      selfScore =
        10 +
        frameStmts * 0.5 +
        (estimatedPoints * (1 + pointStmts * 0.8 + pointHeavyCalls * 1.2)) / 20 +
        exprParamCount * 2

      if (estimatedPoints >= 256 && pointHeavyCalls >= 4) {
        lintWarnings.push(
          "Tip: Precompute frame-invariant math in 'frame' instead of 'point' or reduce point count 'n'.",
        )
      }
    } else if (node.type === 'staticImage') {
      selfScore = 8 + exprParamCount * 2
    } else {
      // testVisual / Crystal Synth or other leaf visual nodes
      selfScore = 14 + exprParamCount * 2
    }

    result.set(node.id, {
      nodeId: node.id,
      selfScore,
      subtreeScore: selfScore,
      sharePercent: 0,
      subtreeSharePercent: 0,
      tier: 'low',
      fullScreenPasses,
      estimatedVramMb,
      estimatedPointOps,
      lintWarnings,
    })
  }

  // 2. Compute total scene score and recursive subtree scores
  let totalSceneScore = 0
  for (const metrics of result.values()) {
    totalSceneScore += metrics.selfScore
  }

  const computeSubtree = (nodeId: string, visited = new Set<string>()): number => {
    if (visited.has(nodeId)) return 0
    visited.add(nodeId)
    const m = result.get(nodeId)
    if (!m) return 0
    let sum = m.selfScore
    const children = childrenByParent.get(nodeId) ?? []
    for (const child of children) {
      sum += computeSubtree(child.id, visited)
    }
    m.subtreeScore = sum
    return sum
  }

  for (const node of nodes) {
    computeSubtree(node.id)
  }

  // 3. Normalize sharePercent, subtreeSharePercent, and tier
  for (const metrics of result.values()) {
    if (metrics.selfScore <= 0 || totalSceneScore <= 0) {
      metrics.sharePercent = 0
      metrics.subtreeSharePercent =
        totalSceneScore > 0 ? Math.min(100, Math.round((metrics.subtreeScore / totalSceneScore) * 100)) : 0
      metrics.tier = 'bypassed'
      continue
    }

    const share = Math.min(100, Math.max(1, Math.round((metrics.selfScore / totalSceneScore) * 100)))
    const subtreeShare = Math.min(
      100,
      Math.max(share, Math.round((metrics.subtreeScore / totalSceneScore) * 100)),
    )
    metrics.sharePercent = share
    metrics.subtreeSharePercent = subtreeShare

    if (share >= 50 || metrics.selfScore >= 90) {
      metrics.tier = 'heavy'
    } else if (share >= 30 || metrics.selfScore >= 55) {
      metrics.tier = 'high'
    } else if (share >= 15 || metrics.selfScore >= 25) {
      metrics.tier = 'medium'
    } else {
      metrics.tier = 'low'
    }
  }

  return result
}
