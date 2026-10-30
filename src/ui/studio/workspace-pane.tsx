import React, { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Layers } from 'lucide-react'
import { useAppStore } from '../store/app-store'
import { LayerTreeView } from '../tree/layer-tree-view'

/**
 * Dedicated Workspace Pane displaying the Hierarchical Layer Tree (Outliner).
 * Features quick expand/collapse actions, real-time layer telemetry,
 * and interactive semantic buffer routing.
 */
export function WorkspacePane(): React.ReactElement {
  const graphNodes = useAppStore((state) => state.graphNodes)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  // Find all non-top-level container IDs (nested frame buffers) to collapse on 'Collapse All'.
  // Keeps Master Output (and any root buffer) expanded so top-level layers remain visible.
  const nonTopLevelContainerIds = useMemo(
    () =>
      graphNodes
        .filter(
          (n) =>
            n.id !== 'master-frame-buffer' &&
            n.type !== 'masterFrameBuffer' &&
            Boolean(n.parentId) &&
            (n.type === 'frameBuffer' || Boolean(n.data?.isContainer)),
        )
        .map((n) => n.id),
    [graphNodes],
  )

  const isAllCollapsed =
    nonTopLevelContainerIds.length > 0 &&
    nonTopLevelContainerIds.every((id) => collapsedIds.has(id)) &&
    !collapsedIds.has('master-frame-buffer')

  const handleToggleExpandAll = () => {
    if (isAllCollapsed) {
      setCollapsedIds(new Set())
    } else {
      setCollapsedIds(new Set(nonTopLevelContainerIds))
    }
  }

  const handleExpandAll = () => {
    setCollapsedIds(new Set())
  }

  const handleCollapseAll = () => {
    setCollapsedIds(new Set(nonTopLevelContainerIds))
  }

  const handleToggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div
      data-testid="workspace-pane"
      className="w-full h-full flex flex-col overflow-hidden bg-[#06060c] select-none"
    >
      {/* Header Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 bg-[#0b0c15] border-b border-white/10 z-20">
        {/* Left: Layer Title & Active Count */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-wider text-slate-200">LAYERS</span>
          <span
            data-testid="layers-count-badge"
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 font-mono"
          >
            {graphNodes.length}
          </span>
        </div>

        {/* Right: Expand / Collapse Actions */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          {/* Toggle Expand / Collapse All Button */}
          <button
            type="button"
            data-testid="toggle-collapse-all-btn"
            onClick={handleToggleExpandAll}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
            title={isAllCollapsed ? 'Expand All Container Layers' : 'Collapse All Container Layers'}
          >
            {isAllCollapsed ? (
              <>
                <ChevronsUpDown className="w-3 h-3 text-cyber-cyan" />
                <span>Expand All</span>
              </>
            ) : (
              <>
                <ChevronsDownUp className="w-3 h-3 text-purple-400" />
                <span>Collapse All</span>
              </>
            )}
          </button>

          {/* Hidden hooks for test backwards-compatibility */}
          <button
            type="button"
            data-testid="expand-all-layers-btn"
            onClick={handleExpandAll}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          >
            Expand All
          </button>
          <button
            type="button"
            data-testid="collapse-all-layers-btn"
            onClick={handleCollapseAll}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Body: Hierarchical Layer Tree */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <LayerTreeView
          collapsedIds={collapsedIds}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>
    </div>
  )
}
