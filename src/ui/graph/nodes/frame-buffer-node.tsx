import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Eye, EyeOff, ImageIcon, Layers, Plus, Repeat, Sparkles } from 'lucide-react'
import type { FrameBufferNodeData } from './node-data'
import { useAppStore } from '../../store/app-store'
import { getNextChildPosition } from '../layout/container-bounds'
import { computeExecutionOrder } from '../execution-order'

/**
 * Offscreen Frame Buffer Node.
 * Supports dual-FBO ping-pong feedback, texture sampling from BufferPool,
 * GLSL compositing blend modes, and visual group container nesting.
 */
export function FrameBufferNodeComponent({
  id,
  data,
  selected,
}: NodeProps & { data: FrameBufferNodeData }): React.ReactElement {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const isFeedback = data.feedback ?? false
  const isBypassed = data.bypassed ?? false

  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
  const setFocusedParamKey = useAppStore((state) => state.setFocusedParamKey)
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)
  const addGraphNode = useAppStore((state) => state.addGraphNode)
  const graphNodes = useAppStore((state) => state.graphNodes)
  const executionOrder = useMemo(() => computeExecutionOrder(graphNodes).get(id), [graphNodes, id])
  const childCount = useAppStore(
    (state) => state.graphNodes.filter((n) => n.parentId === id).length,
  )
  const hasChildren = childCount > 0 || Boolean(data.isContainer)

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAddMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({
        top: (rect.bottom || 0) + 4,
        left: Math.max(10, (rect.right || 180) - 180),
      })
    }
    setIsAddMenuOpen((open) => !open)
  }

  useEffect(() => {
    if (!isAddMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as globalThis.Node | null
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsAddMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddMenuOpen(false)
      }
    }
    const handleScrollOrResize = () => {
      setIsAddMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleScrollOrResize, { passive: true })
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleScrollOrResize)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isAddMenuOpen])

  const handleToggleFeedback = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNodeId(id)
    setFocusedParamKey('feedback')
    updateGraphNodeData(id, { feedback: !isFeedback })
  }

  const handleToggleBypass = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateGraphNodeData(id, { bypassed: !isBypassed })
  }

  const handleAddChild = (type: 'testVisual' | 'staticImage' | 'frameBuffer') => {
    setIsAddMenuOpen(false)
    const newId = `${type}-${Date.now().toString(36)}`
    const childPos = getNextChildPosition(id, graphNodes)
    let childNode: Node

    if (type === 'testVisual') {
      childNode = {
        id: newId,
        type: 'testVisual',
        parentId: id,
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
        parentId: id,
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
        parentId: id,
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

  const menuDropdown = isAddMenuOpen && (
    <div
      ref={menuRef}
      data-testid="fb-add-child-menu"
      style={{
        position: 'fixed',
        top: coords?.top ?? 100,
        left: coords?.left ?? 100,
        zIndex: 99999,
      }}
      className="nodrag nopan w-44 rounded-xl bg-[#140e24]/98 border border-purple-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-1 flex flex-col gap-0.5 text-xs font-mono select-none"
    >
      <button
        type="button"
        data-testid="fb-add-child-synth"
        onClick={(e) => {
          e.stopPropagation()
          handleAddChild('testVisual')
        }}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/60 text-slate-300 hover:text-cyber-cyan transition-colors text-left cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
        <span>Crystal Synth</span>
      </button>
      <button
        type="button"
        data-testid="fb-add-child-image"
        onClick={(e) => {
          e.stopPropagation()
          handleAddChild('staticImage')
        }}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 transition-colors text-left cursor-pointer"
      >
        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
        <span>Static Image</span>
      </button>
      <button
        type="button"
        data-testid="fb-add-child-frame-buffer"
        onClick={(e) => {
          e.stopPropagation()
          handleAddChild('frameBuffer')
        }}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 transition-colors text-left cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 text-purple-400" />
        <span>Frame Buffer</span>
      </button>
    </div>
  )

  return (
    <div
      data-testid="frame-buffer-node"
      className={`relative rounded-2xl border px-3.5 py-2.5 transition-all select-none w-full h-full min-w-[240px] min-h-[56px] ${
        hasChildren
          ? 'bg-gradient-to-b from-[#1b1033]/90 to-[#0a0714]/95 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
          : 'bg-gradient-to-b from-[#160e29] to-[#0c0d14] shadow-xl'
      } ${
        selected
          ? 'border-purple-400 ring-2 ring-purple-400/50 shadow-purple-500/20'
          : 'border-purple-500/40 hover:border-purple-400/80 shadow-black/80'
      } ${isBypassed ? 'opacity-50 grayscale' : ''}`}
    >
      {/* Execution Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        id="exec-in"
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Execution Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="exec-out"
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Texture Buffer Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="buffer-in"
        className="!w-3 !h-3 !bg-cyber-cyan !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Texture Buffer Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="buffer-out"
        className="!w-3 !h-3 !bg-cyber-cyan !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            {/* Line 1: User Customizable Display Name */}
            <div className="text-xs font-mono font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
              {executionOrder !== undefined && (
                <span
                  data-testid="execution-order-badge"
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/25 text-purple-300 font-bold border border-purple-500/40"
                  title={`Execution Order: Pass #${executionOrder}`}
                >
                  #{executionOrder}
                </span>
              )}
              <span>{data.label || 'Frame Buffer'}</span>
              {hasChildren && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  {childCount} NESTED
                </span>
              )}
            </div>
            {/* Line 2: Component Type */}
            <div className="text-[10px] text-purple-400/70 font-mono">
              Frame Buffer
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Add Child Node Button */}
          <button
            ref={buttonRef}
            type="button"
            data-testid="fb-add-child-button"
            title="Add Child Node inside this Frame Buffer"
            aria-label="Add Child Node inside this Frame Buffer"
            onClick={handleToggleMenu}
            className="p-1 rounded text-purple-400/80 hover:text-purple-200 hover:bg-purple-400/10 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title={isFeedback ? 'Click to disable feedback loop' : 'Click to enable feedback loop'}
            onClick={handleToggleFeedback}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isFeedback
                ? 'p-1 rounded text-cyber-cyan/90 bg-cyber-cyan/10 ring-1 ring-cyber-cyan/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <Repeat className="w-3 h-3" />
          </button>
          <button
            type="button"
            title={isBypassed ? 'Unbypass Node (Enable)' : 'Bypass Node (Disable)'}
            onClick={handleToggleBypass}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isBypassed ? (
              <EyeOff className="w-3.5 h-3.5 text-cyber-crimson" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Dropdown Portal */}
      {typeof document !== 'undefined' && menuDropdown
        ? createPortal(menuDropdown, document.body)
        : null}
    </div>
  )
}
