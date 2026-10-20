import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Crown, ImageIcon, Layers, Lock, Plus, Sparkles } from 'lucide-react'
import type { MasterFrameBufferNodeData } from './node-data'
import { useAppStore } from '../../store/app-store'

/**
 * Permanent Root Master Frame Buffer Node.
 * Anchors the rendering pipeline to the screen canvas.
 * Cannot be deleted or disconnected from screen output.
 */
export function MasterFrameBufferNodeComponent({
  id,
  data,
  selected,
}: NodeProps & { data: MasterFrameBufferNodeData }): React.ReactElement {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const childCount = useAppStore(
    (state) => state.graphNodes.filter((n) => n.parentId === id).length,
  )
  const addGraphNode = useAppStore((state) => state.addGraphNode)
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
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

  const handleAddChild = (type: 'testVisual' | 'staticImage' | 'frameBuffer') => {
    setIsAddMenuOpen(false)
    const newId = `${type}-${Date.now().toString(36)}`
    const yPos = 65 + childCount * 65
    let childNode: Node

    if (type === 'testVisual') {
      childNode = {
        id: newId,
        type: 'testVisual',
        parentId: id,
        extent: 'parent',
        position: { x: 20, y: yPos },
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
        position: { x: 20, y: yPos },
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
        position: { x: 20, y: yPos },
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
      data-testid="master-add-child-menu"
      style={{
        position: 'fixed',
        top: coords?.top ?? 100,
        left: coords?.left ?? 100,
        zIndex: 99999,
      }}
      className="nodrag nopan w-44 rounded-xl bg-[#140e06]/98 border border-amber-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-1 flex flex-col gap-0.5 text-xs font-mono select-none"
    >
      <button
        type="button"
        data-testid="master-add-child-synth"
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
        data-testid="master-add-child-image"
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
        data-testid="master-add-child-frame-buffer"
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
      data-testid="master-frame-buffer-node"
      className={`relative rounded-2xl border px-3.5 py-2.5 transition-all select-none ${
        hasChildren ? 'min-w-[280px] min-h-[170px]' : 'min-w-[200px]'
      } ${
        hasChildren
          ? 'bg-gradient-to-b from-[#1b1407]/90 via-[#100d07]/90 to-[#07070c]/95 shadow-[0_0_30px_rgba(245,158,11,0.12)]'
          : 'bg-gradient-to-b from-[#1b1509] to-[#0c0d14] shadow-xl'
      } ${
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20'
          : 'border-amber-500/40 hover:border-amber-400/80 shadow-black/80'
      }`}
    >
      {/* Execution Input Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        id="exec-in"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Texture Buffer Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="buffer-in"
        className="!w-3 !h-3 !bg-cyber-cyan !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-1.5 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-400/10 text-amber-400">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            {/* Line 1: User Customizable Display Name */}
            <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>{data.label || 'Master Output'}</span>
              {hasChildren && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  {childCount} NESTED
                </span>
              )}
            </div>
            {/* Line 2: Component Type */}
            <div className="text-[10px] text-amber-500/80 font-mono">
              Root Frame Buffer
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Add Child Node Button */}
          <button
            ref={buttonRef}
            type="button"
            data-testid="master-add-child-button"
            title="Add Child Node inside Root Frame Buffer"
            aria-label="Add Child Node inside Root Frame Buffer"
            onClick={handleToggleMenu}
            className="p-1 rounded text-amber-400/80 hover:text-amber-200 hover:bg-amber-400/10 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div
            title="Permanent root container (locked)"
            className="p-1 rounded text-amber-400/60 hover:text-amber-300 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Dropdown Portal */}
      {typeof document !== 'undefined' && menuDropdown
        ? createPortal(menuDropdown, document.body)
        : null}
    </div>
  )
}
