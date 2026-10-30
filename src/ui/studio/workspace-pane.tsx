import React from 'react'
import { Layers, Network } from 'lucide-react'
import { useAppStore } from '../store/app-store'
import { LayerTreeView } from '../tree/layer-tree-view'
import { VisualNodeGraph } from '../graph/visual-node-graph'

/**
 * Composite Workspace Pane managing the toggle between the compact
 * Hierarchical Layer Tree View (Outliner) and the 2D Spatial Visual Node Graph.
 */
export function WorkspacePane(): React.ReactElement {
  const bottomViewMode = useAppStore((state) => state.bottomViewMode)
  const setBottomViewMode = useAppStore((state) => state.setBottomViewMode)
  const graphNodes = useAppStore((state) => state.graphNodes)

  return (
    <div
      data-testid="workspace-pane"
      className="w-full h-full flex flex-col overflow-hidden bg-[#06060c] select-none"
    >
      {/* View Switcher Header Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 bg-[#0b0c15] border-b border-white/10 z-20">
        {/* Left: View Mode Segmented Switch */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/50 border border-white/10 font-mono text-xs">
          <button
            type="button"
            data-testid="toggle-view-tree-btn"
            onClick={() => setBottomViewMode('tree')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              bottomViewMode === 'tree'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Layer Tree</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300">
              {graphNodes.length}
            </span>
          </button>

          <button
            type="button"
            data-testid="toggle-view-graph-btn"
            onClick={() => setBottomViewMode('graph')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              bottomViewMode === 'graph'
                ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>Node Graph</span>
          </button>
        </div>

        {/* Right: Telemetry / Status indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PIPELINE ACTIVE</span>
          </span>
        </div>
      </div>

      {/* Workspace Body Pane */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {bottomViewMode === 'tree' ? (
          <LayerTreeView />
        ) : (
          <VisualNodeGraph />
        )}
      </div>
    </div>
  )
}
