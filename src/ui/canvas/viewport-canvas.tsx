import React, { useEffect, useRef } from 'react'
import { RenderEngine } from '../../engine/render-engine'
import { TestVisualNode } from '../../engine/visual-node'
import { FrameBufferNode } from '../../engine/frame-buffer/frame-buffer-node'
import { StaticImageNode, type ImageFitMode } from '../../engine/nodes/static-image-node'
import type { VisualNode } from '../../contracts/renderer-like'
import {
  type ExpressionEngine,
  getDefaultExpressionEngine,
} from '../../engine/expressions/expression-engine'
import { useAppStore } from '../store/app-store'

export interface ViewportCanvasProps {
  onEngineReady?: (engine: RenderEngine) => void
}

/**
 * Main WebGL rendering canvas container mounted in the DOM.
 * Manages RenderEngine lifecycle, ResizeObserver with debouncing,
 * and live synchronization between the visual node graph and RenderEngine scene hierarchy.
 */
export function ViewportCanvas({
  onEngineReady,
}: ViewportCanvasProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<RenderEngine | null>(null)
  const masterBufferRef = useRef<FrameBufferNode | null>(null)
  const nodeMapRef = useRef<Map<string, VisualNode>>(new Map())
  const parentMapRef = useRef<Map<string, FrameBufferNode>>(new Map())
  const exprEngineRef = useRef<ExpressionEngine>(getDefaultExpressionEngine())
  const resizeTimeoutRef = useRef<number | null>(null)

  const targetFps = useAppStore((state) => state.targetFps)
  const resolutionScale = useAppStore((state) => state.resolutionScale)
  const setCurrentFps = useAppStore((state) => state.setCurrentFps)
  const graphNodes = useAppStore((state) => state.graphNodes)

  const onEngineReadyRef = useRef(onEngineReady)
  useEffect(() => {
    onEngineReadyRef.current = onEngineReady
  }, [onEngineReady])

  // Initialize engine once
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.className = 'w-full h-full block'
    container.appendChild(canvas)

    const initialSettings = useAppStore.getState()
    const engine = new RenderEngine({
      canvas,
      presetSettings: {
        target_fps: initialSettings.targetFps,
        resolution_scale: initialSettings.resolutionScale,
        audio_bands: initialSettings.audioBands,
      },
      onFpsUpdate: (fps) => {
        setCurrentFps(fps)
      },
    })

    const masterBuffer = new FrameBufferNode({
      id: 'master-frame-buffer',
      name: 'Master Output',
      isMaster: true,
      feedback: initialSettings.feedbackEnabled,
      blendMode: initialSettings.feedbackBlendMode,
      opacity: initialSettings.feedbackOpacity,
      scale: initialSettings.feedbackScale,
      rotation: initialSettings.feedbackRotation,
      positionX: initialSettings.feedbackPositionX,
      positionY: initialSettings.feedbackPositionY,
      expressionEngine: exprEngineRef.current,
    })

    const visualNode = new TestVisualNode('test-visual-1')
    masterBuffer.addChild(visualNode)
    engine.addNode(masterBuffer)

    masterBufferRef.current = masterBuffer
    nodeMapRef.current.set('master-frame-buffer', masterBuffer)
    nodeMapRef.current.set('test-visual-1', visualNode)
    parentMapRef.current.set('test-visual-1', masterBuffer)

    engineRef.current = engine
    if (onEngineReadyRef.current) {
      onEngineReadyRef.current(engine)
    }

    // Initial resize
    const rect = container.getBoundingClientRect()
    engine.resize(rect.width || window.innerWidth, rect.height || window.innerHeight, window.devicePixelRatio)
    engine.start()

    // 150ms debounced resize observer
    const handleResize = () => {
      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        if (!containerRef.current || !engineRef.current) return
        const r = containerRef.current.getBoundingClientRect()
        engineRef.current.resize(r.width, r.height, window.devicePixelRatio)
      }, 150)
    }

    const nodeMap = nodeMapRef.current
    const parentMap = parentMapRef.current
    const observer = new ResizeObserver(handleResize)
    observer.observe(container)

    return () => {
      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current)
      }
      observer.disconnect()
      engine.dispose()
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
      engineRef.current = null
      nodeMap.clear()
      parentMap.clear()
    }
  }, [setCurrentFps])

  // Synchronize preset settings changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPresetSettings({
        target_fps: targetFps,
        resolution_scale: resolutionScale,
      })
    }
  }, [targetFps, resolutionScale])

  // Synchronize visual node graph pipeline changes into WebGL RenderEngine in real time
  useEffect(() => {
    const engine = engineRef.current
    const masterBuffer = masterBufferRef.current
    if (!engine || !masterBuffer) return

    const nodeMap = nodeMapRef.current
    const parentMap = parentMapRef.current
    const exprEngine = exprEngineRef.current

    // Synchronize each node in the store
    for (const gNode of graphNodes) {
      let vNode = nodeMap.get(gNode.id)

      // Instantiate new nodes dynamically if added to the graph
      if (!vNode) {
        if (gNode.type === 'testVisual') {
          vNode = new TestVisualNode(gNode.id)
          nodeMap.set(gNode.id, vNode)
        } else if (gNode.type === 'frameBuffer') {
          vNode = new FrameBufferNode({
            id: gNode.id,
            name: String(gNode.data.label || 'Frame Buffer'),
            blendMode: String(gNode.data.blendMode || 'replace'),
            inputBlendMode: gNode.data.inputBlendMode ? String(gNode.data.inputBlendMode) : undefined,
            outputBlendMode: gNode.data.outputBlendMode ? String(gNode.data.outputBlendMode) : undefined,
            feedback: Boolean(gNode.data.feedback),
            opacity: gNode.data.opacity as string | number,
            scale: gNode.data.scale as string | number,
            rotation: gNode.data.rotation as string | number,
            positionX: gNode.data.positionX as string | number,
            positionY: gNode.data.positionY as string | number,
            saveTo: (gNode.data.saveTo as string) || null,
            loadFrom: (gNode.data.loadFrom as string) || null,
            expressionEngine: exprEngine,
          })
          nodeMap.set(gNode.id, vNode)
        } else if (gNode.type === 'staticImage') {
          vNode = new StaticImageNode({
            id: gNode.id,
            url: String(gNode.data.imageUrl || ''),
            fit: (gNode.data.fitMode as ImageFitMode) || 'cover',
            opacity: gNode.data.opacity as string | number,
            saveTo: (gNode.data.saveTo as string) || null,
            expressionEngine: exprEngine,
          })
          nodeMap.set(gNode.id, vNode)
        }
      }

      if (!vNode) continue

      // Apply common properties
      vNode.bypassed = Boolean(gNode.data.bypassed)

      // Apply type-specific properties
      if (vNode instanceof TestVisualNode) {
        if (gNode.data.shape) {
          vNode.setShape(String(gNode.data.shape))
        }
        if (gNode.data.reactive !== undefined) {
          vNode.setAudioReactive(Boolean(gNode.data.reactive))
        }
        if (gNode.data.scale !== undefined) {
          vNode.setScaleExpression(gNode.data.scale as string | number, exprEngine)
        }
        const posX = gNode.data.offsetX !== undefined ? gNode.data.offsetX : gNode.data.positionX
        if (posX !== undefined) {
          vNode.setPositionXExpression(posX as string | number, exprEngine)
        }
        const posY = gNode.data.offsetY !== undefined ? gNode.data.offsetY : gNode.data.positionY
        if (posY !== undefined) {
          vNode.setPositionYExpression(posY as string | number, exprEngine)
        }
      } else if (vNode instanceof FrameBufferNode) {
        if (gNode.data.inputBlendMode !== undefined) {
          vNode.setInputBlendMode(String(gNode.data.inputBlendMode))
        }
        if (gNode.data.outputBlendMode !== undefined) {
          vNode.setOutputBlendMode(String(gNode.data.outputBlendMode))
        } else if (gNode.data.blendMode !== undefined) {
          vNode.setBlendMode(String(gNode.data.blendMode))
        }
        if (gNode.data.feedback !== undefined) {
          vNode.setFeedback(Boolean(gNode.data.feedback))
        }
        if (gNode.data.opacity !== undefined) {
          vNode.bindExpression('opacity', gNode.data.opacity as string | number, exprEngine)
        }
        if (gNode.data.scale !== undefined) {
          vNode.bindExpression('scale', gNode.data.scale as string | number, exprEngine)
        }
        if (gNode.data.rotation !== undefined) {
          vNode.bindExpression('rotation', gNode.data.rotation as string | number, exprEngine)
        }
        const posX = gNode.data.offsetX !== undefined ? gNode.data.offsetX : gNode.data.positionX
        if (posX !== undefined) {
          vNode.bindExpression('positionX', posX as string | number, exprEngine)
        }
        const posY = gNode.data.offsetY !== undefined ? gNode.data.offsetY : gNode.data.positionY
        if (posY !== undefined) {
          vNode.bindExpression('positionY', posY as string | number, exprEngine)
        }
        if (gNode.data.saveTo !== undefined) {
          vNode.setSaveTo((gNode.data.saveTo as string) || null)
        }
        if (gNode.data.loadFrom !== undefined) {
          vNode.setLoadFrom((gNode.data.loadFrom as string) || null)
        }
      } else if (vNode instanceof StaticImageNode) {
        if (gNode.data.imageUrl) {
          vNode.setUrl(String(gNode.data.imageUrl))
        }
        if (gNode.data.fitMode) {
          vNode.setFit(gNode.data.fitMode as ImageFitMode)
        }
        if (gNode.data.opacity !== undefined) {
          vNode.setOpacity(gNode.data.opacity as string | number, exprEngine)
        }
        if (gNode.data.saveTo !== undefined) {
          vNode.setSaveTo((gNode.data.saveTo as string) || null)
        }
      }
    }

    // Pass 3: Reconcile parent-child attachments based on gNode.parentId
    // Sort so container frame buffers attach to their parents before leaf visual nodes
    const sortedNodes = [...graphNodes].sort((a, b) => {
      if (a.type === 'frameBuffer' && b.type !== 'frameBuffer') return -1
      if (a.type !== 'frameBuffer' && b.type === 'frameBuffer') return 1
      return 0
    })

    for (const gNode of sortedNodes) {
      if (gNode.id === 'master-frame-buffer') continue
      const vNode = nodeMap.get(gNode.id)
      if (!vNode) continue

      let targetParent: FrameBufferNode = masterBuffer
      if (gNode.parentId) {
        const candidate = nodeMap.get(gNode.parentId)
        if (candidate instanceof FrameBufferNode) {
          targetParent = candidate
        }
      }

      const currentParent = parentMap.get(gNode.id)
      if (currentParent !== targetParent) {
        if (currentParent) {
          currentParent.detachChild(vNode)
        }
        targetParent.addChild(vNode)
        parentMap.set(gNode.id, targetParent)
      }
    }

    // Clean up removed nodes (excluding permanent master root)
    const activeIds = new Set(graphNodes.map((n) => n.id))
    for (const [id, node] of nodeMap.entries()) {
      if (id !== 'master-frame-buffer' && !activeIds.has(id)) {
        const parent = parentMap.get(id) || masterBuffer
        parent.removeChild(node, true)
        nodeMap.delete(id)
        parentMap.delete(id)
      }
    }
  }, [graphNodes])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen bg-cyber-void overflow-hidden select-none"
      data-testid="viewport-canvas-container"
    />
  )
}
