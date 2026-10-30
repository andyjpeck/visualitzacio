import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_INSPECTOR_VERTICAL_RATIO,
  DEFAULT_STUDIO_SPLIT_RATIO,
  type StudioMode,
  useAppStore,
} from '../store/app-store'

export { DEFAULT_INSPECTOR_VERTICAL_RATIO, DEFAULT_STUDIO_SPLIT_RATIO }

export const MIN_PREVIEW_WIDTH = 320
export const MIN_GRAPH_WIDTH = 400
export const MIN_INSPECTOR_HEIGHT = 180
export const MIN_GRAPH_HEIGHT = 200

export interface StudioSplitViewProps {
  preview: React.ReactNode
  graph?: React.ReactNode
  inspector?: React.ReactNode
  mode?: StudioMode
  className?: string
}

/**
 * Split-View Studio Workspace with Vertically Stacked Parameter Inspector and Node Graph.
 *
 * In Editor Mode:
 * - Left Pane: Live Viewport Canvas & Performance HUD (min 320px)
 * - Vertical Divider: Resizes horizontal split between Viewport and Right Column
 * - Right Column:
 *   - Top Pane: Parameter Inspector (min height 180px, default 45%)
 *   - Horizontal Divider: Resizes vertical split between Inspector and Node Graph
 *   - Bottom Pane: Interactive Visual Node Graph Workspace (min height 200px, default 55%)
 *
 * In Live Mode:
 * - Fullscreen borderless viewport canvas with right column collapsed.
 */
export function StudioSplitView({
  preview,
  graph,
  inspector,
  mode,
  className = '',
}: StudioSplitViewProps): React.ReactElement {
  const storeMode = useAppStore((state) => state.studioMode)
  const storeSplitRatio = useAppStore((state) => state.studioSplitRatio)
  const setStudioSplitRatio = useAppStore((state) => state.setStudioSplitRatio)
  const resetStudioSplitRatio = useAppStore((state) => state.resetStudioSplitRatio)

  const storeInspectorRatio = useAppStore((state) => state.inspectorVerticalRatio)
  const setInspectorVerticalRatio = useAppStore(
    (state) => state.setInspectorVerticalRatio,
  )
  const resetInspectorVerticalRatio = useAppStore(
    (state) => state.resetInspectorVerticalRatio,
  )

  const activeMode = mode ?? storeMode
  const containerRef = useRef<HTMLDivElement>(null)
  const rightColumnRef = useRef<HTMLDivElement>(null)

  // Ephemeral ratios during active dragging for 60 FPS fluidity
  const [dragSplitRatio, setDragSplitRatio] = useState<number | null>(null)
  const [dragInspectorRatio, setDragInspectorRatio] = useState<number | null>(null)

  const splitRatioRef = useRef<number>(storeSplitRatio)
  const inspectorRatioRef = useRef<number>(storeInspectorRatio)

  const [activeDrag, setActiveDrag] = useState<'vertical' | 'horizontal' | null>(null)
  const dragCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current()
      }
    }
  }, [])

  // Drag handler for vertical divider (Preview <-> Right Column)
  const handleVerticalPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setActiveDrag('vertical')
      splitRatioRef.current = storeSplitRatio
      setDragSplitRatio(storeSplitRatio)

      const handlePointerMove = (ev: PointerEvent) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const totalWidth = rect.width
        if (totalWidth <= 0) return

        const clientX = ev.clientX - rect.left

        // Min width clamping: Preview >= 320px, Right Column >= 400px
        const minPreview = MIN_PREVIEW_WIDTH
        const maxPreview = Math.max(minPreview, totalWidth - MIN_GRAPH_WIDTH)
        const clampedWidth = Math.min(Math.max(clientX, minPreview), maxPreview)
        const newRatio = clampedWidth / totalWidth

        splitRatioRef.current = newRatio
        setDragSplitRatio(newRatio)
      }

      const cleanup = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
        dragCleanupRef.current = null
      }
      dragCleanupRef.current = cleanup

      const handlePointerUp = () => {
        setActiveDrag(null)
        setDragSplitRatio(null)
        setStudioSplitRatio(splitRatioRef.current)
        cleanup()
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [setStudioSplitRatio, storeSplitRatio],
  )

  // Drag handler for horizontal divider (Inspector Top <-> Graph Bottom)
  const handleHorizontalPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setActiveDrag('horizontal')
      inspectorRatioRef.current = storeInspectorRatio
      setDragInspectorRatio(storeInspectorRatio)

      const handlePointerMove = (ev: PointerEvent) => {
        const column = rightColumnRef.current
        if (!column) return

        const rect = column.getBoundingClientRect()
        const totalHeight = rect.height
        if (totalHeight <= 0) return

        const clientY = ev.clientY - rect.top

        // Min height clamping: Inspector >= 180px, Graph >= 200px
        const minInspector = MIN_INSPECTOR_HEIGHT
        const maxInspector = Math.max(minInspector, totalHeight - MIN_GRAPH_HEIGHT)
        const clampedHeight = Math.min(Math.max(clientY, minInspector), maxInspector)
        const newRatio = clampedHeight / totalHeight

        inspectorRatioRef.current = newRatio
        setDragInspectorRatio(newRatio)
      }

      const cleanup = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
        dragCleanupRef.current = null
      }
      dragCleanupRef.current = cleanup

      const handlePointerUp = () => {
        setActiveDrag(null)
        setDragInspectorRatio(null)
        setInspectorVerticalRatio(inspectorRatioRef.current)
        cleanup()
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [setInspectorVerticalRatio, storeInspectorRatio],
  )

  const handleResetSplit = useCallback(() => {
    resetStudioSplitRatio()
    setDragSplitRatio(null)
  }, [resetStudioSplitRatio])

  const handleResetInspector = useCallback(() => {
    resetInspectorVerticalRatio()
    setDragInspectorRatio(null)
  }, [resetInspectorVerticalRatio])

  const activeSplitRatio = dragSplitRatio ?? storeSplitRatio
  const activeInspectorRatio = dragInspectorRatio ?? storeInspectorRatio
  const isLive = activeMode === 'live'

  return (
    <div
      ref={containerRef}
      data-testid="studio-split-view"
      className={`relative w-full h-full flex overflow-hidden select-none bg-cyber-void ${
        activeDrag === 'vertical'
          ? 'cursor-col-resize'
          : activeDrag === 'horizontal'
            ? 'cursor-row-resize'
            : ''
      } ${className}`}
    >
      {/* Pane 1: Viewport Preview Canvas */}
      <div
        data-testid="studio-pane-preview"
        style={{
          width: isLive
            ? '100%'
            : `${parseFloat((activeSplitRatio * 100).toFixed(4))}%`,
          minWidth: isLive ? '100%' : `${MIN_PREVIEW_WIDTH}px`,
        }}
        className="relative h-full overflow-hidden flex-shrink-0 flex flex-col z-0"
      >
        {preview}
      </div>

      {!isLive && (
        <>
          {/* Vertical Divider: Preview <-> Right Column */}
          <div
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
            data-testid="studio-divider-vertical"
            title="Drag to resize workspace, double-click to reset"
            onPointerDown={handleVerticalPointerDown}
            onDoubleClick={handleResetSplit}
            className="group relative w-1 h-full bg-slate-800/80 hover:bg-cyber-cyan/70 active:bg-cyber-cyan cursor-col-resize flex-shrink-0 transition-colors z-20"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-slate-600 group-hover:bg-cyber-cyan transition-colors" />
          </div>

          {/* Right Column: Stacked Parameter Inspector (Top) and Node Graph (Bottom) */}
          <div
            ref={rightColumnRef}
            data-testid="studio-pane-right-column"
            style={{
              width: `${parseFloat(((1 - activeSplitRatio) * 100).toFixed(4))}%`,
              minWidth: `${MIN_GRAPH_WIDTH}px`,
            }}
            className="relative h-full overflow-hidden flex-1 flex flex-col bg-[#080811] z-10"
          >
            {/* Top Pane: Parameter Inspector */}
            <div
              data-testid="studio-pane-inspector"
              style={{
                height: `${parseFloat((activeInspectorRatio * 100).toFixed(4))}%`,
                minHeight: `${MIN_INSPECTOR_HEIGHT}px`,
              }}
              className="relative w-full overflow-hidden flex-shrink-0 flex flex-col bg-cyber-dark/95 border-b border-white/10 shadow-lg shadow-black/40 z-10"
            >
              {inspector}
            </div>

            {/* Horizontal Divider: Inspector (Top) <-> Node Graph (Bottom) */}
            <div
              role="separator"
              aria-orientation="horizontal"
              tabIndex={0}
              data-testid="studio-divider-horizontal"
              title="Drag to resize inspector and node graph, double-click to reset"
              onPointerDown={handleHorizontalPointerDown}
              onDoubleClick={handleResetInspector}
              className="group relative h-1 w-full bg-slate-800/80 hover:bg-cyber-cyan/70 active:bg-cyber-cyan cursor-row-resize flex-shrink-0 transition-colors z-20"
            >
              <div className="absolute inset-x-0 -top-1 -bottom-1" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-6 rounded-full bg-slate-600 group-hover:bg-cyber-cyan transition-colors" />
            </div>

            {/* Bottom Pane: Visual Node Graph */}
            <div
              data-testid="studio-pane-graph"
              style={{
                height: `${parseFloat(((1 - activeInspectorRatio) * 100).toFixed(4))}%`,
                minHeight: `${MIN_GRAPH_HEIGHT}px`,
              }}
              className="relative w-full overflow-hidden flex-1 flex flex-col bg-[#06060c] z-10"
            >
              {graph}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
