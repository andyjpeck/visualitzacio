import React from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Eye, EyeOff, ImageIcon } from 'lucide-react'
import type { StaticImageNodeData } from './node-data'

/**
 * Static Image Layer Node.
 * Loads external image or uploaded graphic asset, provides texture routing to BufferPool,
 * and renders with configurable aspect fit modes.
 */
export function StaticImageNodeComponent({
  data,
  selected,
}: NodeProps & { data: StaticImageNodeData }): React.ReactElement {
  const isBypassed = data.bypassed ?? false
  const fitMode = data.fitMode || 'cover'

  return (
    <div
      data-testid="static-image-node"
      className={`relative rounded-xl border px-4 py-3 min-w-[220px] bg-gradient-to-b from-[#0e1f18] to-[#0c0d14] shadow-2xl transition-all select-none ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-500/20'
          : 'border-emerald-500/40 hover:border-emerald-400/80 shadow-black/80'
      } ${isBypassed ? 'opacity-50 grayscale' : ''}`}
    >
      {/* Execution Handles (Top / Bottom) */}
      <Handle
        type="target"
        position={Position.Top}
        id="exec-in"
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="exec-out"
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Texture Buffer Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="buffer-out"
        className="!w-3 !h-3 !bg-cyber-cyan !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-emerald-200 uppercase tracking-wider">
              {data.label || 'Static Image'}
            </div>
            <div className="text-[10px] text-emerald-400/70 font-mono">
              {data.saveTo ? `@${data.saveTo}` : 'Image Layer'}
            </div>
          </div>
        </div>

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

      {/* Body / Thumbnail & Parameter Chips */}
      <div className="flex flex-col gap-1.5 text-[11px] font-mono">
        {data.imageUrl ? (
          <div className="w-full h-12 rounded overflow-hidden bg-black/40 border border-white/5 relative">
            <img
              src={data.imageUrl}
              alt={data.label}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-10 rounded bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 text-[10px]">
            No Image Selected
          </div>
        )}

        <div className="flex items-center justify-between text-slate-300 bg-white/5 px-2 py-1 rounded">
          <span className="text-slate-400 text-[10px]">Fit Mode</span>
          <span className="text-emerald-300 font-semibold uppercase text-[10px]">
            {fitMode}
          </span>
        </div>
      </div>
    </div>
  )
}
