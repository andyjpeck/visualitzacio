import React, { useCallback, useRef, useState } from 'react'
import {
  DEFAULT_STUDIO_SPLIT_RATIOS,
  type StudioMode,
  useAppStore,
} from '../store/app-store'

export { DEFAULT_STUDIO_SPLIT_RATIOS }

export const MIN_PREVIEW_WIDTH = 320
export const MIN_GRAPH_WIDTH = 400
export const MIN_INSPECTOR_WIDTH = 300

export interface StudioSplitViewProps {
  preview: React.ReactNode
  graph?: React.ReactNode
  inspector?: React.ReactNode
  mode?: StudioMode
  className?: string
}

/**
 * Resizable 3-pane split-view container for Visualització Studio.
 *
 * In Editor mode:
 * - Left pane: Viewport Canvas & Performance HUD (min 320px)
 * - Center pane: Interactive Visual Node Graph Workspace (min 400px)
 * - Right pane: Docked Parameter Inspector (min 300px)
 *
 * In Live mode:
 * - Fullscreen borderless viewport with node graph and inspector panes collapsed.
 */
export function StudioSplitView({
  preview,
  graph,
  inspector,
  mode,
  className = '',
}: StudioSplitViewProps): React.ReactElement {
  const storeMode = useAppStore((state) => state.studioMode)
  const storeRatios = useAppStore((state) => state.studioSplitRatios)
  const setStudioSplitRatios = useAppStore((state) => state.setStudioSplitRatios)
  const resetStudioSplitRatios = useAppStore((state) => state.resetStudioSplitRatios)

  const activeMode = mode ?? storeMode
  const containerRef = useRef<HTMLDivElement>(null)

  // Ephemeral ratios during active dragging for 60 FPS fluidity
  const [dragRatios, setDragRatios] = useState<[number, number, number] | null>(null)
  const ratiosRef = useRef<[number, number, number]>(storeRatios)
  const [isDragging, setIsDragging] = useState<1 | 2 | null>(null)

  // Drag handler for dividers
  const handlePointerDown = useCallback(
    (dividerIndex: 1 | 2, e: React.PointerEvent) => {
      e.preventDefault()
      setIsDragging(dividerIndex)
      ratiosRef.current = [...storeRatios]
      setDragRatios([...storeRatios])

      const handlePointerMove = (ev: PointerEvent) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const totalWidth = rect.width
        if (totalWidth <= 0) return

        const clientX = ev.clientX - rect.left
        const [r0, , r2] = ratiosRef.current
        let next: [number, number, number]

        if (dividerIndex === 1) {
          // Dragging Divider 1: between Preview (0) and Graph (1)
          const minP0 = MIN_PREVIEW_WIDTH
          const maxP0 = Math.max(minP0, totalWidth - r2 * totalWidth - MIN_GRAPH_WIDTH)
          const clampedWidth = Math.min(Math.max(clientX, minP0), maxP0)
          const newR0 = clampedWidth / totalWidth
          const newR1 = Math.max(0, 1 - newR0 - r2)
          next = [newR0, newR1, r2]
        } else {
          // Dragging Divider 2: between Graph (1) and Inspector (2)
          const inspectorWidth = totalWidth - clientX
          const minP2 = MIN_INSPECTOR_WIDTH
          const maxP2 = Math.max(minP2, totalWidth - r0 * totalWidth - MIN_GRAPH_WIDTH)
          const clampedWidth = Math.min(Math.max(inspectorWidth, minP2), maxP2)
          const newR2 = clampedWidth / totalWidth
          const newR1 = Math.max(0, 1 - r0 - newR2)
          next = [r0, newR1, newR2]
        }

        ratiosRef.current = next
        setDragRatios(next)
      }

      const handlePointerUp = () => {
        setIsDragging(null)
        setDragRatios(null)
        setStudioSplitRatios(ratiosRef.current)
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [setStudioSplitRatios, storeRatios],
  )

  const handleReset = useCallback(() => {
    resetStudioSplitRatios()
    setDragRatios(null)
  }, [resetStudioSplitRatios])

  const activeRatios = dragRatios ?? storeRatios
  const isLive = activeMode === 'live'

  return (
    <div
      ref={containerRef}
      data-testid="studio-split-view"
      className={`relative w-full h-full flex overflow-hidden select-none bg-cyber-void ${
        isDragging ? 'cursor-col-resize' : ''
      } ${className}`}
    >
      {/* Pane 1: Preview Canvas & Viewport */}
      <div
        data-testid="studio-pane-preview"
        style={{
          width: isLive ? '100%' : `${activeRatios[0] * 100}%`,
          minWidth: isLive ? '100%' : `${MIN_PREVIEW_WIDTH}px`,
        }}
        className="relative h-full overflow-hidden flex-shrink-0 flex flex-col z-0"
      >
        {preview}
      </div>

      {!isLive && (
        <>
          {/* Divider 1: Preview <-> Graph */}
          <div
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
            data-testid="studio-divider-1"
            title="Drag to resize pane, double-click to reset"
            onPointerDown={(e) => handlePointerDown(1, e)}
            onDoubleClick={handleReset}
            className="group relative w-1 h-full bg-slate-800/80 hover:bg-cyber-cyan/70 active:bg-cyber-cyan cursor-col-resize flex-shrink-0 transition-colors z-20"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-slate-600 group-hover:bg-cyber-cyan transition-colors" />
          </div>

          {/* Pane 2: Node Graph */}
          <div
            data-testid="studio-pane-graph"
            style={{
              width: `${activeRatios[1] * 100}%`,
              minWidth: `${MIN_GRAPH_WIDTH}px`,
            }}
            className="relative h-full overflow-hidden flex-1 flex flex-col border-r border-white/5 bg-[#080811] z-10"
          >
            {graph}
          </div>

          {/* Divider 2: Graph <-> Inspector */}
          <div
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
            data-testid="studio-divider-2"
            title="Drag to resize pane, double-click to reset"
            onPointerDown={(e) => handlePointerDown(2, e)}
            onDoubleClick={handleReset}
            className="group relative w-1 h-full bg-slate-800/80 hover:bg-cyber-cyan/70 active:bg-cyber-cyan cursor-col-resize flex-shrink-0 transition-colors z-20"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-slate-600 group-hover:bg-cyber-cyan transition-colors" />
          </div>

          {/* Pane 3: Inspector */}
          <div
            data-testid="studio-pane-inspector"
            style={{
              width: `${activeRatios[2] * 100}%`,
              minWidth: `${MIN_INSPECTOR_WIDTH}px`,
            }}
            className="relative h-full overflow-hidden flex-shrink-0 flex flex-col bg-cyber-dark/95 border-l border-white/10 z-10"
          >
            {inspector}
          </div>
        </>
      )}
    </div>
  )
}
