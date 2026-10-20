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
  const blendMode = data.blendMode || 'replace'
  const opacity = data.opacity ?? 1.0

  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
  const setFocusedParamKey = useAppStore((state) => state.setFocusedParamKey)

  const handleSelectParam = (paramKey: string) => {
    setSelectedNodeId(id)
    setFocusedParamKey(paramKey)
  }

  return (
    <div
      data-testid="master-frame-buffer-node"
      className={`relative rounded-xl border px-4 py-3 min-w-[220px] bg-gradient-to-b from-[#1b1509] to-[#0c0d14] shadow-2xl transition-all select-none ${
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
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-400/10 text-amber-400">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>{data.label || 'Master Output'}</span>
            </div>
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

      {/* Body / Parameter Chips */}
      <div className="flex flex-col gap-1.5 text-[11px] font-mono">
        <button
          type="button"
          title="Click to inspect Blend Mode in Parameter Inspector"
          onClick={(e) => {
            e.stopPropagation()
            handleSelectParam('blendMode')
          }}
          className="flex items-center justify-between text-slate-300 bg-white/5 hover:bg-white/10 hover:border-amber-400/40 border border-transparent px-2 py-1 rounded cursor-pointer transition-all active:scale-[0.98]"
        >
          <span className="text-slate-400 text-[10px]">Blend Mode</span>
          <span className="text-amber-300 font-semibold uppercase text-[10px]">
            {blendMode}
          </span>
        </button>

        <button
          type="button"
          title="Click to inspect Opacity in Parameter Inspector"
          onClick={(e) => {
            e.stopPropagation()
            handleSelectParam('opacity')
          }}
          className="flex items-center justify-between text-slate-300 bg-white/5 hover:bg-white/10 hover:border-amber-400/40 border border-transparent px-2 py-1 rounded cursor-pointer transition-all active:scale-[0.98]"
        >
          <span className="text-slate-400 text-[10px]">Opacity</span>
          <span className="text-slate-200 text-[10px]">{String(opacity)}</span>
        </button>
      </div>
    </div>
  )
}
