import React, { useEffect, useRef } from 'react'
import { RenderEngine } from '../../engine/render-engine'
import { TestVisualNode } from '../../engine/visual-node'
import { FrameBufferNode } from '../../engine/frame-buffer/frame-buffer-node'
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
 * Manages RenderEngine lifecycle, ResizeObserver with debouncing, and master frame buffer bindings.
 */
export function ViewportCanvas({
  onEngineReady,
}: ViewportCanvasProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<RenderEngine | null>(null)
  const masterBufferRef = useRef<FrameBufferNode | null>(null)
  const exprEngineRef = useRef<ExpressionEngine>(getDefaultExpressionEngine())
  const resizeTimeoutRef = useRef<number | null>(null)

  const targetFps = useAppStore((state) => state.targetFps)
  const resolutionScale = useAppStore((state) => state.resolutionScale)
  const setCurrentFps = useAppStore((state) => state.setCurrentFps)

  const feedbackEnabled = useAppStore((state) => state.feedbackEnabled)
  const feedbackBlendMode = useAppStore((state) => state.feedbackBlendMode)
  const feedbackOpacity = useAppStore((state) => state.feedbackOpacity)
  const feedbackScale = useAppStore((state) => state.feedbackScale)
  const feedbackRotation = useAppStore((state) => state.feedbackRotation)
  const feedbackPositionX = useAppStore((state) => state.feedbackPositionX)
  const feedbackPositionY = useAppStore((state) => state.feedbackPositionY)

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

    const visualNode = new TestVisualNode()
    masterBuffer.addChild(visualNode)
    engine.addNode(masterBuffer)

    masterBufferRef.current = masterBuffer
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

  // Synchronize dynamic frame buffer & feedback changes
  useEffect(() => {
    if (masterBufferRef.current) {
      masterBufferRef.current.setFeedback(feedbackEnabled)
      masterBufferRef.current.blendMode = feedbackBlendMode
      masterBufferRef.current.bindExpression('opacity', feedbackOpacity, exprEngineRef.current)
      masterBufferRef.current.bindExpression('scale', feedbackScale, exprEngineRef.current)
      masterBufferRef.current.bindExpression('rotation', feedbackRotation, exprEngineRef.current)
      masterBufferRef.current.bindExpression('positionX', feedbackPositionX, exprEngineRef.current)
      masterBufferRef.current.bindExpression('positionY', feedbackPositionY, exprEngineRef.current)
    }
  }, [
    feedbackEnabled,
    feedbackBlendMode,
    feedbackOpacity,
    feedbackScale,
    feedbackRotation,
    feedbackPositionX,
    feedbackPositionY,
  ])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen bg-cyber-void overflow-hidden select-none"
      data-testid="viewport-canvas-container"
    />
  )
}
