import React, { useCallback, useRef, useState } from 'react'
import { PanelRightClose, PanelRightOpen, Sliders } from 'lucide-react'
import {
  DEFAULT_STUDIO_SPLIT_RATIO,
  type StudioMode,
  useAppStore,
} from '../store/app-store'

export { DEFAULT_STUDIO_SPLIT_RATIO }

export const MIN_PREVIEW_WIDTH = 320
export const MIN_GRAPH_WIDTH = 400
export const DEFAULT_INSPECTOR_WIDTH = 340

export interface StudioSplitViewProps {
  preview: React.ReactNode
  graph?: React.ReactNode
  inspector?: React.ReactNode
  mode?: StudioMode
  className?: string
}

/**
 * 2-Pane Resizable Split-View Container with Collapsible Inspector Drawer for Visualització Studio.
 *
 * In Editor Mode:
 * - Left Pane: Live Viewport Canvas & Performance HUD (min 320px)
 * - Divider: 60 FPS pointer-drag divider with min-width clamping and double-click reset
 * - Right Pane: Interactive Visual Node Graph Workspace (min 400px)
 * - Collapsible Slide-Out Drawer: Parameter Inspector on right edge of Node Graph
 *
 * In Live Mode:
 * - Fullscreen borderless viewport canvas with node graph and inspector drawer collapsed.
 */
export function StudioSplitView({
  preview,
  graph,
  inspector,
  mode,
  className = '',
}: StudioSplitViewProps): React.ReactElement {
  const storeMode = useAppStore((state) => state.studioMode)
  const storeRatio = useAppStore((state) => state.studioSplitRatio)
  const setStudioSplitRatio = useAppStore((state) => state.setStudioSplitRatio)
  const resetStudioSplitRatio = useAppStore((state) => state.resetStudioSplitRatio)
  const isInspectorOpen = useAppStore((state) => state.isInspectorOpen)
  const toggleInspector = useAppStore((state) => state.toggleInspector)

  const activeMode = mode ?? storeMode
  const containerRef = useRef<HTMLDivElement>(null)

  // Ephemeral ratio during active dragging for 60 FPS fluidity
  const [dragRatio, setDragRatio] = useState<number | null>(null)
  const ratioRef = useRef<number>(storeRatio)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setIsDragging(true)
      ratioRef.current = storeRatio
      setDragRatio(storeRatio)

      const handlePointerMove = (ev: PointerEvent) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const totalWidth = rect.width
        if (totalWidth <= 0) return

        const clientX = ev.clientX - rect.left

        // Min width clamping: Preview >= 320px, Graph >= 400px
        const minPreview = MIN_PREVIEW_WIDTH
        const maxPreview = Math.max(minPreview, totalWidth - MIN_GRAPH_WIDTH)
        const clampedWidth = Math.min(Math.max(clientX, minPreview), maxPreview)
        const newRatio = clampedWidth / totalWidth

        ratioRef.current = newRatio
        setDragRatio(newRatio)
      }

      const handlePointerUp = () => {
        setIsDragging(false)
        setDragRatio(null)
        setStudioSplitRatio(ratioRef.current)
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [setStudioSplitRatio, storeRatio],
  )

  const handleReset = useCallback(() => {
    resetStudioSplitRatio()
    setDragRatio(null)
  }, [resetStudioSplitRatio])

  const activeRatio = dragRatio ?? storeRatio
  const isLive = activeMode === 'live'

  return (
    <div
      ref={containerRef}
      data-testid="studio-split-view"
      className={`relative w-full h-full flex overflow-hidden select-none bg-cyber-void ${
        isDragging ? 'cursor-col-resize' : ''
      } ${className}`}
    >
      {/* Pane 1: Viewport Preview Canvas */}
      <div
        data-testid="studio-pane-preview"
        style={{
          width: isLive ? '100%' : `${activeRatio * 100}%`,
          minWidth: isLive ? '100%' : `${MIN_PREVIEW_WIDTH}px`,
        }}
        className="relative h-full overflow-hidden flex-shrink-0 flex flex-col z-0"
      >
        {preview}
      </div>

      {!isLive && (
        <>
          {/* Resizable Divider: Preview <-> Node Graph */}
          <div
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
            data-testid="studio-divider"
            title="Drag to resize workspace, double-click to reset"
            onPointerDown={handlePointerDown}
            onDoubleClick={handleReset}
            className="group relative w-1 h-full bg-slate-800/80 hover:bg-cyber-cyan/70 active:bg-cyber-cyan cursor-col-resize flex-shrink-0 transition-colors z-20"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-slate-600 group-hover:bg-cyber-cyan transition-colors" />
          </div>

          {/* Pane 2: Node Graph Workspace with Collapsible Slide-Out Inspector Drawer */}
          <div
            data-testid="studio-pane-graph"
            style={{
              width: `${(1 - activeRatio) * 100}%`,
              minWidth: `${MIN_GRAPH_WIDTH}px`,
            }}
            className="relative h-full overflow-hidden flex-1 flex flex-col bg-[#080811] z-10"
          >
            {/* Visual Node Graph Content */}
            <div className="relative w-full h-full overflow-hidden">{graph}</div>

            {/* Floating Slide-Out Toggle Pill (Visible when drawer is closed) */}
            {!isInspectorOpen && (
              <button
                type="button"
                data-testid="studio-inspector-open-button"
                onClick={toggleInspector}
                title="Open Parameter Inspector"
                aria-label="Open Parameter Inspector"
                className="absolute top-4 right-4 z-30 p-2.5 rounded-xl bg-cyber-dark/90 hover:bg-cyber-dark border border-white/10 hover:border-cyber-cyan/40 text-slate-300 hover:text-cyber-cyan shadow-lg shadow-black/50 backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 group text-xs font-mono"
              >
                <Sliders className="w-4 h-4 text-cyber-cyan group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-semibold">Inspector</span>
                <PanelRightOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyber-cyan" />
              </button>
            )}

            {/* Collapsible Slide-Out Inspector Drawer */}
            <aside
              data-testid="studio-inspector-drawer"
              style={{ width: `${DEFAULT_INSPECTOR_WIDTH}px` }}
              className={`absolute top-0 right-0 h-full bg-cyber-dark/95 border-l border-white/10 shadow-2xl shadow-black/80 backdrop-blur-xl z-30 flex flex-col transition-transform duration-300 ease-out ${
                isInspectorOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
              }`}
            >
              {/* Drawer Header with Close Button */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-white/5 select-none">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  <Sliders className="w-3.5 h-3.5 text-cyber-cyan" />
                  <span>Parameter Inspector</span>
                </div>
                <button
                  type="button"
                  data-testid="studio-inspector-close-button"
                  onClick={toggleInspector}
                  title="Close Inspector Drawer"
                  aria-label="Close Inspector Drawer"
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Body */}
              <div className="flex-1 overflow-y-auto">{inspector}</div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
