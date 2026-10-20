import React from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Eye, EyeOff, ImageIcon } from 'lucide-react'
import type { StaticImageNodeData } from './node-data'
import { useAppStore } from '../../store/app-store'

/**
 * Static Image Layer Node.
 * Loads external image or uploaded graphic asset, provides texture routing to BufferPool,
 * and renders with configurable aspect fit modes.
 */
export function StaticImageNodeComponent({
  id,
  data,
  selected,
}: NodeProps & { data: StaticImageNodeData }): React.ReactElement {
  const isBypassed = data.bypassed ?? false
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)

  const handleToggleBypass = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateGraphNodeData(id, { bypassed: !isBypassed })
  }

  return (
    <div
      data-testid="static-image-node"
      className={`relative rounded-xl border px-3.5 py-2.5 min-w-[200px] bg-gradient-to-b from-[#0e1f18] to-[#0c0d14] shadow-xl transition-all select-none ${
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            {/* Line 1: User Customizable Display Name */}
            <div className="text-xs font-mono font-bold text-emerald-200 uppercase tracking-wider">
              {data.label || 'Static Image'}
            </div>
            {/* Line 2: Component Type */}
            <div className="text-[10px] text-emerald-400/70 font-mono">
              Static Image
            </div>
          </div>
        </div>

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
  )
}
