import React from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Eye, EyeOff, Layers, Repeat } from 'lucide-react'
import type { FrameBufferNodeData } from './node-data'
import { useAppStore } from '../../store/app-store'

/**
 * Offscreen Frame Buffer Node.
 * Supports dual-FBO ping-pong feedback, texture sampling from BufferPool,
 * GLSL compositing blend modes, and visual group container nesting (Option A).
 */
export function FrameBufferNodeComponent({
  id,
  data,
  selected,
}: NodeProps & { data: FrameBufferNodeData }): React.ReactElement {
  const blendMode = data.blendMode || 'replace'
  const isFeedback = data.feedback ?? false
  const isBypassed = data.bypassed ?? false

  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
  const setFocusedParamKey = useAppStore((state) => state.setFocusedParamKey)
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)

  const childCount = useAppStore(
    (state) => state.graphNodes.filter((n) => n.parentId === id).length,
  )
  const hasChildren = childCount > 0 || Boolean(data.isContainer)

  const handleSelectParam = (paramKey: string) => {
    setSelectedNodeId(id)
    setFocusedParamKey(paramKey)
  }

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
      className={`relative rounded-xl border px-4 py-3 transition-all select-none ${
        hasChildren ? 'min-w-[340px] min-h-[220px]' : 'min-w-[220px]'
      } ${
        hasChildren
          ? 'bg-gradient-to-b from-[#1b1033]/90 to-[#0a0714]/95 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
          : 'bg-gradient-to-b from-[#160e29] to-[#0c0d16] shadow-2xl'
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
      <div className="flex items-center justify-between gap-2 border-b border-purple-500/20 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>{data.label || 'Frame Buffer'}</span>
              {hasChildren && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  {childCount} NESTED
                </span>
              )}
            </div>
            <div className="text-[10px] text-purple-400/70 font-mono">
              {data.saveTo ? `@${data.saveTo}` : hasChildren ? 'Group Container' : 'Offscreen FBO'}
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

      {/* Body / Parameter Chips */}
      <div className="flex flex-col gap-1.5 text-[11px] font-mono">
        <button
          type="button"
          title="Click to inspect Blend Mode in Parameter Inspector"
          onClick={(e) => {
            e.stopPropagation()
            handleSelectParam('blendMode')
          }}
          className="flex items-center justify-between text-slate-300 bg-white/5 hover:bg-white/10 hover:border-purple-400/40 border border-transparent px-2 py-1 rounded cursor-pointer transition-all active:scale-[0.98]"
        >
          <span className="text-slate-400 text-[10px]">Blend</span>
          <span className="text-purple-300 font-semibold uppercase text-[10px]">
            {blendMode}
          </span>
        </button>

        <button
          type="button"
          title="Click to toggle Feedback Loop"
          onClick={handleToggleFeedback}
          className="flex items-center justify-between text-slate-300 bg-white/5 hover:bg-white/10 hover:border-purple-400/40 border border-transparent px-2 py-1 rounded cursor-pointer transition-all active:scale-[0.98]"
        >
          <span className="text-slate-400 text-[10px]">Feedback</span>
          <span
            className={`font-semibold text-[10px] ${
              isFeedback ? 'text-cyber-cyan' : 'text-slate-500'
            }`}
          >
            {isFeedback ? `ON (${String(data.opacity ?? 1.0)})` : 'OFF'}
          </span>
        </button>

        {data.loadFrom && (
          <button
            type="button"
            title="Click to inspect Sample Source in Parameter Inspector"
            onClick={(e) => {
              e.stopPropagation()
              handleSelectParam('loadFrom')
            }}
            className="flex items-center justify-between text-slate-300 bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-400/50 px-2 py-0.5 rounded text-[10px] cursor-pointer transition-all active:scale-[0.98]"
          >
            <span className="text-slate-400">Sample</span>
            <span className="text-cyber-cyan font-bold">@{data.loadFrom}</span>
          </button>
        )}
      </div>

      {/* Option A: Inner Visual Container Area for Nested Nodes */}
      {hasChildren && (
        <div className="mt-2.5 p-3 rounded-lg border border-dashed border-purple-500/30 bg-black/40 min-h-[90px] flex flex-col justify-end text-[10px] text-purple-400/50 font-mono select-none pointer-events-none">
          <div className="flex items-center gap-1.5 justify-center py-2 text-purple-300/60">
            <Layers className="w-3.5 h-3.5 opacity-60" />
            <span>Frame Buffer Container Canvas</span>
          </div>
        </div>
      )}
    </div>
  )
}
