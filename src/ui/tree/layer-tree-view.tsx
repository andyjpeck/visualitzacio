import React, { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crown,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Layers,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { Node } from '@xyflow/react'
import { useAppStore } from '../store/app-store'
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

interface DropIndicator {
  targetId: string
  position: 'before' | 'after' | 'inside'
}

/**
 * Collapsible Hierarchical Layer Tree View (Outliner).
 * Provides compact layer inspection, execution sequence telemetry,
 * interactive semantic buffer tag highlighting, drag-and-drop hierarchy / reordering,
 * and one-click up/down reordering buttons.
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

  // Dismiss add child menu dialog on outside click or 'Escape' key
  useEffect(() => {
    if (!openAddMenuId) return

    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as globalThis.Node | null
      if (addMenuRef.current && target && !addMenuRef.current.contains(target)) {
        // If clicking on the trigger button itself, let the button's onClick handle toggle
        const triggerBtn = (e.target as Element)?.closest?.(
          `[data-testid="tree-add-child-btn-${openAddMenuId}"]`,
        )
        if (triggerBtn) return

        setOpenAddMenuId(null)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.stopPropagation()
        setOpenAddMenuId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openAddMenuId])

  // Drag and drop state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)

  // Inline rename state: nodeId -> editing string
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>('')

  const commitRename = (nodeId: string) => {
    const trimmed = editingName.trim()
    if (trimmed) {
      updateGraphNodeData(nodeId, { label: trimmed })
    }
    setEditingNodeId(null)
  }

  // Helper to determine if a target is a descendant of a candidate ancestor
  const isDescendantOf = (
    nodeId: string,
    ancestorId: string,
    allNodes: Node[],
  ): boolean => {
    let current = allNodes.find((n) => n.id === nodeId)
    const visited = new Set<string>()
    while (current && current.parentId) {
      if (visited.has(current.id)) break
      visited.add(current.id)
      const parentId = current.parentId
      if (parentId === ancestorId) return true
      current = allNodes.find((n) => n.id === parentId)
    }
    return false
  }

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

  // Handle drag start
  const handleDragStart = (nodeId: string, e: React.DragEvent) => {
    const node = graphNodes.find((n) => n.id === nodeId)
    if (!node || node.id === 'master-frame-buffer' || node.type === 'masterFrameBuffer') {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('text/plain', nodeId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedNodeId(nodeId)
  }

  // Handle drag over
  const handleDragOver = (targetNode: Node, e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedNodeId || draggedNodeId === targetNode.id) {
      e.dataTransfer.dropEffect = 'none'
      return
    }

    if (isDescendantOf(targetNode.id, draggedNodeId, graphNodes)) {
      e.dataTransfer.dropEffect = 'none'
      return
    }

    const isMaster = targetNode.id === 'master-frame-buffer' || targetNode.type === 'masterFrameBuffer'
    const isTargetContainer = isMaster || targetNode.type === 'frameBuffer' || Boolean(targetNode.data?.isContainer)

    const rect = e.currentTarget.getBoundingClientRect()
    const height = rect.height || 40
    const clientY = typeof e.clientY === 'number' ? e.clientY : rect.top + height / 2
    const offsetY = clientY - (rect.top || 0)

    let position: 'before' | 'after' | 'inside'

    if (isMaster) {
      position = 'inside'
    } else if (isTargetContainer) {
      if (offsetY < height * 0.25) {
        position = 'before'
      } else if (offsetY > height * 0.75) {
        position = 'after'
      } else {
        position = 'inside'
      }
    } else {
      if (offsetY < height * 0.5) {
        position = 'before'
      } else {
        position = 'after'
      }
    }

    e.dataTransfer.dropEffect = 'move'
    setDropIndicator({ targetId: targetNode.id, position })
  }

  // Handle drag leave
  const handleDragLeave = (targetId: string, e: React.DragEvent) => {
    if (dropIndicator?.targetId === targetId && !e.currentTarget.contains(e.relatedTarget as globalThis.Node)) {
      setDropIndicator(null)
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedNodeId(null)
    setDropIndicator(null)
  }

  // Handle drop
  const handleDrop = (targetNode: Node, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedId = draggedNodeId || e.dataTransfer.getData('text/plain')
    const currentIndicator = dropIndicator

    setDraggedNodeId(null)
    setDropIndicator(null)

    if (!droppedId || droppedId === targetNode.id) return
    if (isDescendantOf(targetNode.id, droppedId, graphNodes)) return

    const droppedNode = graphNodes.find((n) => n.id === droppedId)
    if (!droppedNode) return

    let newParentId: string | undefined
    const position = currentIndicator?.targetId === targetNode.id ? currentIndicator.position : 'inside'

    if (position === 'inside') {
      newParentId = targetNode.id
    } else {
      newParentId = targetNode.parentId
    }

    // Destination siblings excluding droppedNode
    const destSiblings = graphNodes
      .filter((n) => n.parentId === newParentId && n.id !== droppedId)
      .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))

    let reordered: Node[]
    if (position === 'inside') {
      reordered = [...destSiblings, droppedNode]
    } else if (position === 'before') {
      const targetIdx = destSiblings.findIndex((n) => n.id === targetNode.id)
      if (targetIdx === -1) {
        reordered = [...destSiblings, droppedNode]
      } else {
        reordered = [
          ...destSiblings.slice(0, targetIdx),
          droppedNode,
          ...destSiblings.slice(targetIdx),
        ]
      }
    } else {
      const targetIdx = destSiblings.findIndex((n) => n.id === targetNode.id)
      if (targetIdx === -1) {
        reordered = [...destSiblings, droppedNode]
      } else {
        reordered = [
          ...destSiblings.slice(0, targetIdx + 1),
          droppedNode,
          ...destSiblings.slice(targetIdx + 1),
        ]
      }
    }

    // Compute relative Y positions for the reordered destination siblings
    let currentY = CONTAINER_HEADER_HEIGHT
    const newPositions = new Map<string, { x: number; y: number }>()
    for (const child of reordered) {
      newPositions.set(child.id, {
        x: CONTAINER_PADDING,
        y: currentY,
      })
      const dims = calculateNodeDimensions(child, graphNodes)
      currentY += dims.height + CHILD_GAP
    }

    setGraphNodes((prev) => {
      const updated = prev.map((n) => {
        if (n.id === droppedId) {
          const pos = newPositions.get(n.id) ?? { x: CONTAINER_PADDING, y: currentY }
          return {
            ...n,
            parentId: newParentId,
            position: pos,
          }
        }
        const newPos = newPositions.get(n.id)
        if (newPos) {
          return { ...n, position: newPos }
        }
        return n
      })
      return reflowGraphStacks(updated)
    })

    // If dropped inside a collapsed container, expand it so the user sees the dropped item
    if (newParentId && collapsedIds.has(newParentId)) {
      if (controlledToggleCollapse) {
        controlledToggleCollapse(newParentId)
      } else {
        setInternalCollapsedIds((prev) => {
          const next = new Set(prev)
          next.delete(newParentId!)
          return next
        })
      }
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

    const isMaster = node.id === 'master-frame-buffer' || node.type === 'masterFrameBuffer'
    const isFrameBuffer = node.type === 'frameBuffer'
    const isContainer = isMaster || isFrameBuffer || Boolean(node.data?.isContainer)

    const directChildren = graphNodes
      .filter((n) => n.parentId === node.id)
      .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))

    const hasChildren = directChildren.length > 0
    const isCollapsed = collapsedIds.has(node.id)

    // Drag-and-drop indicator states
    const isDropTarget = dropIndicator?.targetId === node.id
    const dropPos = isDropTarget ? dropIndicator.position : null
    const isBeingDragged = draggedNodeId === node.id

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
          data-drop-position={dropPos ?? undefined}
          draggable={!isMaster && editingNodeId !== node.id}
          onDragStart={(e) => handleDragStart(node.id, e)}
          onDragOver={(e) => handleDragOver(node, e)}
          onDragLeave={(e) => handleDragLeave(node.id, e)}
          onDrop={(e) => handleDrop(node, e)}
          onDragEnd={handleDragEnd}
          onClick={() => setSelectedNodeId(node.id)}
          style={{ paddingLeft: `${depth * 18 + 8}px` }}
          className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 transition-all cursor-pointer border-l-2 text-xs font-mono relative ${
            isBeingDragged ? 'opacity-30 border-dashed border-purple-500/50' : ''
          } ${
            dropPos === 'before'
              ? 'border-t-2 border-t-cyber-cyan shadow-[0_-2px_10px_rgba(0,240,255,0.7)]'
              : ''
          } ${
            dropPos === 'after'
              ? 'border-b-2 border-b-cyber-cyan shadow-[0_2px_10px_rgba(0,240,255,0.7)]'
              : ''
          } ${
            dropPos === 'inside'
              ? 'bg-purple-900/40 ring-1 ring-purple-400 border-l-purple-400 shadow-[inset_0_0_15px_rgba(168,85,247,0.3)]'
              : isSelected
                ? 'bg-purple-950/40 border-purple-400 text-purple-100 shadow-[inset_0_0_15px_rgba(168,85,247,0.15)]'
                : isRowHighlighted
                  ? 'bg-cyan-950/30 border-cyber-cyan text-cyan-100 shadow-[inset_0_0_12px_rgba(0,240,255,0.2)]'
                  : 'border-transparent hover:bg-white/[0.04] text-slate-300'
          } ${isBypassed ? 'opacity-40 grayscale' : ''}`}
        >
          {/* Left: Drag Handle + Expand chevron + Exec Badge + Icon + Label */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Drag Handle (non-master) */}
            {!isMaster ? (
              <div
                data-testid={`tree-drag-handle-${node.id}`}
                className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors flex-shrink-0"
                title="Drag to reorder or move layer"
                aria-label="Drag to reorder"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}

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

            {/* Node Type Icon */}
            <div className="flex-shrink-0">
              {isMaster && <Crown className="w-3.5 h-3.5 text-amber-400" />}
              {!isMaster && isFrameBuffer && <Layers className="w-3.5 h-3.5 text-purple-400" />}
              {node.type === 'testVisual' && <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />}
              {node.type === 'staticImage' && <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
            </div>

            {/* Label (Double-click to Rename Inline) */}
            {editingNodeId === node.id ? (
              <input
                data-testid={`tree-rename-input-${node.id}`}
                type="text"
                value={editingName}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') {
                    commitRename(node.id)
                  } else if (e.key === 'Escape') {
                    setEditingNodeId(null)
                  }
                }}
                onBlur={() => commitRename(node.id)}
                className="bg-black/80 border border-cyber-cyan text-white text-xs font-semibold font-mono px-1.5 py-0.5 rounded outline-none shadow-[0_0_8px_rgba(0,240,255,0.4)] w-36 max-w-full"
              />
            ) : (
              <span
                data-testid={`tree-label-${node.id}`}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingNodeId(node.id)
                  setEditingName(String(node.data?.label || node.id))
                }}
                title="Double-click to rename layer"
                className="truncate font-semibold text-slate-200 hover:text-cyber-cyan cursor-text transition-colors select-none"
              >
                {String(node.data?.label || node.id)}
              </span>
            )}

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
                    role="dialog"
                    aria-label="Add Child Layer Menu"
                    className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#140e24]/98 border border-purple-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-1 flex flex-col gap-0.5 text-xs font-mono z-50"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleAddChild(node.id, 'testVisual', e)}
                      title="Add a 3D audio-reactive geometric synthesizer mesh"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/60 text-slate-300 hover:text-cyber-cyan transition-colors text-left cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
                      <span>Crystal Synth</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleAddChild(node.id, 'staticImage', e)}
                      title="Add a static texture or background graphic layer"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 transition-colors text-left cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Static Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleAddChild(node.id, 'frameBuffer', e)}
                      title="Add a nested frame buffer pass with blend modes and ping-pong feedback"
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
