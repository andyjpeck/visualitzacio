import React, { useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crown,
  Eye,
  EyeOff,
  ImageIcon,
  Layers,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { Node } from '@xyflow/react'
import { useAppStore } from '../store/app-store'
import { computeExecutionOrder } from '../graph/execution-order'
import {
  calculateNodeDimensions,
  CONTAINER_HEADER_HEIGHT,
  CONTAINER_PADDING,
  CHILD_GAP,
  getNextChildPosition,
  reflowGraphStacks,
} from '../graph/layout/container-bounds'

export interface LayerTreeViewProps {
  collapsedIds?: Set<string>
  onToggleCollapse?: (id: string) => void
}

/**
 * Collapsible Hierarchical Layer Tree View (Outliner).
 * Provides compact layer inspection, execution sequence telemetry,
 * interactive semantic buffer tag highlighting, and one-click re-ordering.
 */
export function LayerTreeView({
  collapsedIds: controlledCollapsedIds,
  onToggleCollapse: controlledToggleCollapse,
}: LayerTreeViewProps = {}): React.ReactElement {
  const graphNodes = useAppStore((state) => state.graphNodes)
  const setGraphNodes = useAppStore((state) => state.setGraphNodes)
  const selectedNodeId = useAppStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)
  const removeGraphNode = useAppStore((state) => state.removeGraphNode)
  const addGraphNode = useAppStore((state) => state.addGraphNode)
  const hoveredBufferTag = useAppStore((state) => state.hoveredBufferTag)
  const setHoveredBufferTag = useAppStore((state) => state.setHoveredBufferTag)

  // Internal collapsed state if uncontrolled
  const [internalCollapsedIds, setInternalCollapsedIds] = useState<Set<string>>(new Set())
  const collapsedIds = controlledCollapsedIds ?? internalCollapsedIds

  // Add child menu dropdown state: nodeId -> boolean
  const [openAddMenuId, setOpenAddMenuId] = useState<string | null>(null)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // Compute execution pass index for each node in real-time
  const executionOrderMap = useMemo(() => {
    return computeExecutionOrder(graphNodes)
  }, [graphNodes])

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (controlledToggleCollapse) {
      controlledToggleCollapse(id)
    } else {
      setInternalCollapsedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    }
  }

  // Handle re-ordering siblings up or down in the vertical stack
  const handleMoveSibling = (nodeId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation()
    const target = graphNodes.find((n) => n.id === nodeId)
    if (!target || !target.parentId) return

    // Find all siblings in same container sorted by current Y
    const siblings = graphNodes
      .filter((n) => n.parentId === target.parentId)
      .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))

    const currentIndex = siblings.findIndex((n) => n.id === nodeId)
    if (currentIndex === -1) return

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (swapIndex < 0 || swapIndex >= siblings.length) return

    const swapTarget = siblings[swapIndex]

    // Swap their array positions and reflow vertical coordinates
    const newSiblings = [...siblings]
    newSiblings[currentIndex] = swapTarget
    newSiblings[swapIndex] = target

    // Re-assign vertical slots
    let currentY = CONTAINER_HEADER_HEIGHT
    const posMap = new Map<string, { x: number; y: number }>()
    for (const child of newSiblings) {
      posMap.set(child.id, {
        x: CONTAINER_PADDING,
        y: currentY,
      })
      const dims = calculateNodeDimensions(child, graphNodes)
      currentY += dims.height + CHILD_GAP
    }

    setGraphNodes((prev) => {
      const updated = prev.map((n) => {
        const newPos = posMap.get(n.id)
        return newPos ? { ...n, position: newPos } : n
      })
      return reflowGraphStacks(updated)
    })
  }

  const handleAddChild = (
    parentId: string,
    type: 'testVisual' | 'staticImage' | 'frameBuffer',
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    setOpenAddMenuId(null)

    const childCount = graphNodes.filter((n) => n.parentId === parentId).length
    const newId = `${type}-${Date.now().toString(36)}`
    const childPos = getNextChildPosition(parentId, graphNodes)

    let childNode: Node
    if (type === 'testVisual') {
      childNode = {
        id: newId,
        type: 'testVisual',
        parentId,
        extent: 'parent',
        position: childPos,
        data: {
          label: `Synth ${childCount + 1}`,
          shape: 'Crystal',
          scale: 1.0,
        },
      }
    } else if (type === 'staticImage') {
      childNode = {
        id: newId,
        type: 'staticImage',
        parentId,
        extent: 'parent',
        position: childPos,
        data: {
          label: `Image Layer ${childCount + 1}`,
          fitMode: 'contain',
        },
      }
    } else {
      childNode = {
        id: newId,
        type: 'frameBuffer',
        parentId,
        extent: 'parent',
        position: childPos,
        data: {
          label: `Buffer ${childCount + 1}`,
          blendMode: 'screen',
          feedback: true,
          opacity: 0.9,
        },
      }
    }

    addGraphNode(childNode)
    setSelectedNodeId(newId)
  }

  // Recursive tree renderer for nodes
  const renderNodeRow = (node: Node, depth = 0): React.ReactNode => {
    const isSelected = node.id === selectedNodeId
    const isBypassed = Boolean(node.data?.bypassed)
    const execOrder = executionOrderMap.get(node.id)

    const isMaster = node.id === 'master-frame-buffer' || node.type === 'masterFrameBuffer'
    const isFrameBuffer = node.type === 'frameBuffer'
    const isContainer = isMaster || isFrameBuffer || Boolean(node.data?.isContainer)

    const directChildren = graphNodes
      .filter((n) => n.parentId === node.id)
      .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))

    const hasChildren = directChildren.length > 0
    const isCollapsed = collapsedIds.has(node.id)

    // Semantic Buffer Tags
    const saveToTag = typeof node.data?.saveTo === 'string' && node.data.saveTo.trim()
      ? node.data.saveTo.trim()
      : null
    const loadFromTag = typeof node.data?.loadFrom === 'string' && node.data.loadFrom.trim()
      ? node.data.loadFrom.trim()
      : null

    // Tag matching active hover
    const isSaveToHovered = saveToTag && hoveredBufferTag === saveToTag
    const isLoadFromHovered = loadFromTag && hoveredBufferTag === loadFromTag
    const isRowHighlighted = isSaveToHovered || isLoadFromHovered

    // Sibling position for up/down disabled states
    const siblings = targetParentSiblings(node.parentId)
    const siblingIndex = siblings.findIndex((s) => s.id === node.id)
    const canMoveUp = siblingIndex > 0
    const canMoveDown = siblingIndex !== -1 && siblingIndex < siblings.length - 1

    return (
      <div key={node.id} className="flex flex-col select-none">
        {/* Node Line Item */}
        <div
          data-testid={`layer-tree-item-${node.id}`}
          onClick={() => setSelectedNodeId(node.id)}
          style={{ paddingLeft: `${depth * 18 + 10}px` }}
          className={`group flex items-center justify-between gap-2 px-3 py-1.5 transition-all cursor-pointer border-l-2 text-xs font-mono ${
            isSelected
              ? 'bg-purple-950/40 border-purple-400 text-purple-100 shadow-[inset_0_0_15px_rgba(168,85,247,0.15)]'
              : isRowHighlighted
                ? 'bg-cyan-950/30 border-cyber-cyan text-cyan-100 shadow-[inset_0_0_12px_rgba(0,240,255,0.2)]'
                : 'border-transparent hover:bg-white/[0.04] text-slate-300'
          } ${isBypassed ? 'opacity-40 grayscale' : ''}`}
        >
          {/* Left: Expand chevron + Exec Badge + Icon + Label */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Collapse / Expand Chevron */}
            {hasChildren ? (
              <button
                type="button"
                data-testid={`tree-collapse-btn-${node.id}`}
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                title={isCollapsed ? 'Expand Children' : 'Collapse Children'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}

            {/* Execution Order Badge */}
            {execOrder !== undefined && (
              <span
                data-testid={`tree-exec-badge-${node.id}`}
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${
                  isMaster
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : isFrameBuffer
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-cyan-500/20 text-cyber-cyan border-cyan-500/40'
                }`}
                title={`Execution Pass #${execOrder}`}
              >
                #{execOrder}
              </span>
            )}

            {/* Node Type Icon */}
            <div className="flex-shrink-0">
              {isMaster && <Crown className="w-3.5 h-3.5 text-amber-400" />}
              {!isMaster && isFrameBuffer && <Layers className="w-3.5 h-3.5 text-purple-400" />}
              {node.type === 'testVisual' && <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />}
              {node.type === 'staticImage' && <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
            </div>

            {/* Label and Container Counter */}
            <span className="truncate font-semibold text-slate-200">
              {String(node.data?.label || node.id)}
            </span>

            {hasChildren && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-300/80 border border-purple-500/20">
                {directChildren.length}
              </span>
            )}
          </div>

          {/* Right: Semantic Buffer Tags & Action Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Published Buffer Tag (saveTo) */}
            {saveToTag && (
              <button
                type="button"
                data-testid={`tree-tag-save-${node.id}`}
                onMouseEnter={() => setHoveredBufferTag(saveToTag)}
                onMouseLeave={() => setHoveredBufferTag(null)}
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer font-bold ${
                  isSaveToHovered
                    ? 'bg-purple-500 text-white border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.8)] scale-105 animate-pulse'
                    : 'bg-purple-950/60 text-purple-300 border-purple-500/40 hover:border-purple-300 hover:text-purple-100'
                }`}
                title={`Publishes Texture: ${saveToTag} (hover to trace)`}
              >
                PUB {saveToTag}
              </button>
            )}

            {/* Consumed Buffer Tag (loadFrom) */}
            {loadFromTag && (
              <button
                type="button"
                data-testid={`tree-tag-load-${node.id}`}
                onMouseEnter={() => setHoveredBufferTag(loadFromTag)}
                onMouseLeave={() => setHoveredBufferTag(null)}
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer font-bold ${
                  isLoadFromHovered
                    ? 'bg-cyber-cyan text-slate-950 border-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.8)] scale-105 animate-pulse'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:border-cyan-300 hover:text-cyan-100'
                }`}
                title={`Samples Texture: ${loadFromTag} (hover to trace)`}
              >
                IN {loadFromTag}
              </button>
            )}

            {/* Re-order Up / Down */}
            {!isMaster && (
              <div className="flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  data-testid={`tree-move-up-${node.id}`}
                  disabled={!canMoveUp}
                  onClick={(e) => handleMoveSibling(node.id, 'up', e)}
                  title="Move Layer Up in Execution Order"
                  aria-label="Move Layer Up"
                  className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-slate-300 hover:text-white"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  data-testid={`tree-move-down-${node.id}`}
                  disabled={!canMoveDown}
                  onClick={(e) => handleMoveSibling(node.id, 'down', e)}
                  title="Move Layer Down in Execution Order"
                  aria-label="Move Layer Down"
                  className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-slate-300 hover:text-white"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Container Add Child Button */}
            {isContainer && (
              <div className="relative">
                <button
                  type="button"
                  data-testid={`tree-add-child-btn-${node.id}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenAddMenuId(openAddMenuId === node.id ? null : node.id)
                  }}
                  title="Add Child Layer to this Buffer"
                  aria-label="Add Child Layer"
                  className="p-1 rounded hover:bg-white/10 text-purple-400 hover:text-purple-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Add Child Menu Dropdown */}
                {openAddMenuId === node.id && (
                  <div
                    ref={addMenuRef}
                    data-testid={`tree-add-child-menu-${node.id}`}
                    className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#140e24]/98 border border-purple-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-1 flex flex-col gap-0.5 text-xs font-mono z-50"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleAddChild(node.id, 'testVisual', e)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/60 text-slate-300 hover:text-cyber-cyan transition-colors text-left cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
                      <span>Crystal Synth</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleAddChild(node.id, 'staticImage', e)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 transition-colors text-left cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Static Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleAddChild(node.id, 'frameBuffer', e)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 transition-colors text-left cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Frame Buffer</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bypass Toggle Button */}
            <button
              type="button"
              data-testid={`tree-bypass-btn-${node.id}`}
              onClick={(e) => {
                e.stopPropagation()
                updateGraphNodeData(node.id, { bypassed: !isBypassed })
              }}
              title={isBypassed ? 'Click to unbypass layer' : 'Click to bypass layer'}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isBypassed ? (
                <EyeOff className="w-3.5 h-3.5 text-red-400/80" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Delete Button (non-master only) */}
            {!isMaster && (
              <button
                type="button"
                data-testid={`tree-delete-btn-${node.id}`}
                onClick={(e) => {
                  e.stopPropagation()
                  removeGraphNode(node.id)
                }}
                title="Delete Layer"
                aria-label="Delete Layer"
                className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Render direct children if not collapsed */}
        {!isCollapsed && hasChildren && (
          <div className="flex flex-col border-l border-white/[0.06] ml-4">
            {directChildren.map((child) => renderNodeRow(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // Helper to get siblings of a given parent
  const targetParentSiblings = (parentId?: string): Node[] => {
    return graphNodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))
  }

  // Top-level root nodes (Master Frame Buffer)
  const rootNodes = graphNodes
    .filter((n) => !n.parentId)
    .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))

  return (
    <div
      data-testid="layer-tree-view"
      className="w-full h-full overflow-y-auto bg-[#07070e] text-slate-200 p-2 flex flex-col gap-0.5"
    >
      {/* Root Layer Stack */}
      {rootNodes.map((rootNode) => renderNodeRow(rootNode, 0))}
    </div>
  )
}
