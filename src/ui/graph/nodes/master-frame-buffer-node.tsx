import React from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Crown, Lock } from 'lucide-react'
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
  const childCount = useAppStore(
    (state) => state.graphNodes.filter((n) => n.parentId === id).length,
  )
  const hasChildren = childCount > 0 || Boolean(data.isContainer)

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

        <div
          title="Permanent root container (locked)"
          className="p-1 rounded text-amber-400/60 hover:text-amber-300 transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}
