import React from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Eye, EyeOff, Layers, Repeat } from 'lucide-react'
import type { FrameBufferNodeData } from './node-data'

/**
 * Offscreen Frame Buffer Node.
 * Supports dual-FBO ping-pong feedback, texture sampling from BufferPool,
 * and GLSL compositing blend modes.
 */
export function FrameBufferNodeComponent({
  data,
  selected,
}: NodeProps & { data: FrameBufferNodeData }): React.ReactElement {
  const blendMode = data.blendMode || 'replace'
  const isFeedback = data.feedback ?? false
  const isBypassed = data.bypassed ?? false

  return (
    <div
      data-testid="frame-buffer-node"
      className={`relative rounded-xl border px-4 py-3 min-w-[220px] bg-gradient-to-b from-[#160e29] to-[#0c0d16] shadow-2xl transition-all select-none ${
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
            <div className="text-xs font-mono font-bold text-purple-200 uppercase tracking-wider">
              {data.label || 'Frame Buffer'}
            </div>
            <div className="text-[10px] text-purple-400/70 font-mono">
              {data.saveTo ? `@${data.saveTo}` : 'Offscreen FBO'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isFeedback && (
            <span
              title="Ping-pong feedback loop active"
              className="p-1 rounded text-cyber-cyan/90 bg-cyber-cyan/10"
            >
              <Repeat className="w-3 h-3" />
            </span>
          )}
          <span
            title={isBypassed ? 'Node bypassed' : 'Node active'}
            className="p-1 rounded text-slate-400"
          >
            {isBypassed ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </span>
        </div>
      </div>

      {/* Body / Parameter Chips */}
      <div className="flex flex-col gap-1.5 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-300 bg-white/5 px-2 py-1 rounded">
          <span className="text-slate-400 text-[10px]">Blend</span>
          <span className="text-purple-300 font-semibold uppercase text-[10px]">
            {blendMode}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300 bg-white/5 px-2 py-1 rounded">
          <span className="text-slate-400 text-[10px]">Feedback</span>
          <span
            className={`font-semibold text-[10px] ${
              isFeedback ? 'text-cyber-cyan' : 'text-slate-500'
            }`}
          >
            {isFeedback ? `ON (${String(data.opacity ?? 1.0)})` : 'OFF'}
          </span>
        </div>

        {data.loadFrom && (
          <div className="flex items-center justify-between text-slate-300 bg-cyan-950/20 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px]">
            <span className="text-slate-400">Sample</span>
            <span className="text-cyber-cyan font-bold">@{data.loadFrom}</span>
          </div>
        )}
      </div>
    </div>
  )
}
