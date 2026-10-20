import React from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Eye, EyeOff, Layers, Repeat } from 'lucide-react'
import type { FrameBufferNodeData } from './node-data'
import { useAppStore } from '../../store/app-store'

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
  const isFeedback = data.feedback ?? false
  const isBypassed = data.bypassed ?? false

  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
  const setFocusedParamKey = useAppStore((state) => state.setFocusedParamKey)
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)

  const childCount = useAppStore(
    (state) => state.graphNodes.filter((n) => n.parentId === id).length,
  )
  const hasChildren = childCount > 0 || Boolean(data.isContainer)

  const handleToggleFeedback = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNodeId(id)
    updateGraphNodeData(id, { feedback: !isFeedback })
    setFocusedParamKey('feedback')
  }

  const handleToggleBypass = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateGraphNodeData(id, { bypassed: !isBypassed })
  }

  return (
    <div
      data-testid="frame-buffer-node"
      className={`relative rounded-2xl border px-3.5 py-2.5 transition-all select-none ${
        hasChildren ? 'min-w-[280px] min-h-[170px]' : 'min-w-[200px]'
      } ${
        hasChildren
          ? 'bg-gradient-to-b from-[#1b1033]/90 to-[#0a0714]/95 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
          : 'bg-gradient-to-b from-[#160e29] to-[#0c0d16] shadow-xl'
      } ${
        selected
          ? 'border-purple-400 ring-2 ring-purple-400/50 shadow-purple-500/20'
          : 'border-purple-500/40 hover:border-purple-400/80 shadow-black/80'
      } ${isBypassed ? 'opacity-50 grayscale' : ''}`}
    >
      {/* Hierarchy Execution Handles (Top / Bottom) */}
      <Handle
        type="target"
        position={Position.Top}
        id="exec-in"
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="exec-out"
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Texture Buffer Handles (Left / Right) */}
      <Handle
        type="target"
        position={Position.Left}
        id="buffer-in"
        className="!w-3 !h-3 !bg-cyber-cyan !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
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
    </div>
  )
}
