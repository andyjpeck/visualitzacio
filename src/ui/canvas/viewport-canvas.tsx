import React, { useEffect, useRef } from 'react'
import { RenderEngine } from '../../engine/render-engine'
import { TestVisualNode } from '../../engine/visual-node'
import { useAppStore } from '../store/app-store'

export interface ViewportCanvasProps {
  onEngineReady?: (engine: RenderEngine) => void
}

export function ViewportCanvas({
  onEngineReady,
}: ViewportCanvasProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<RenderEngine | null>(null)
  const resizeTimeoutRef = useRef<number | null>(null)

  const targetFps = useAppStore((state) => state.targetFps)
  const resolutionScale = useAppStore((state) => state.resolutionScale)
  const setCurrentFps = useAppStore((state) => state.setCurrentFps)
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
      },
      onFpsUpdate: (fps) => {
        setCurrentFps(fps)
      },
    })

    const visualNode = new TestVisualNode()
    engine.addNode(visualNode)

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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen bg-cyber-void overflow-hidden select-none"
      data-testid="viewport-canvas-container"
    />
  )
}
