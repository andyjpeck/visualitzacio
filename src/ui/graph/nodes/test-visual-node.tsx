import React from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Activity, Eye, EyeOff, Sparkles } from 'lucide-react'
import type { TestVisualNodeData } from './node-data'
import { useAppStore } from '../../store/app-store'

/**
 * Procedural Audio-Reactive Test Visual Node.
 * Generates an audio-reactive 3D wireframe mesh with real-time spectrum modulation.
 */
export function TestVisualNodeComponent({
  id,
  data,
  selected,
}: NodeProps & { data: TestVisualNodeData }): React.ReactElement {
  const isBypassed = data.bypassed ?? false
  const shape = data.shape || 'Crystal'
  const isReactive = data.reactive ?? true

  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
  const setFocusedParamKey = useAppStore((state) => state.setFocusedParamKey)
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)

  const handleSelectParam = (paramKey: string) => {
    setSelectedNodeId(id)
    setFocusedParamKey(paramKey)
  }

  const handleToggleBypass = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateGraphNodeData(id, { bypassed: !isBypassed })
  }

  const handleToggleReactivity = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNodeId(id)
    updateGraphNodeData(id, { reactive: !isReactive })
    setFocusedParamKey('reactive')
  }

  return (
    <div
      data-testid="test-visual-node"
      className={`relative rounded-xl border px-4 py-3 min-w-[220px] bg-gradient-to-b from-[#091724] to-[#0c0d14] shadow-2xl transition-all select-none ${
        selected
          ? 'border-cyber-cyan ring-2 ring-cyber-cyan/50 shadow-cyber-cyan/20'
          : 'border-cyan-500/40 hover:border-cyan-400/80 shadow-black/80'
      } ${isBypassed ? 'opacity-50 grayscale' : ''}`}
    >
      {/* Execution Handles (Top / Bottom) */}
      <Handle
        type="target"
        position={Position.Top}
        id="exec-in"
        className="!w-3 !h-3 !bg-cyber-cyan !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="exec-out"
        className="!w-3 !h-3 !bg-cyber-cyan !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-cyan-500/20 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyber-cyan">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
              {data.label || 'Test Visual'}
            </div>
            <div className="text-[10px] text-cyan-400/70 font-mono">
              Generative Synth
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

      {/* Body / Parameter Chips */}
      <div className="flex flex-col gap-1.5 text-[11px] font-mono">
        <button
          type="button"
          title="Click to inspect Shape in Parameter Inspector"
          onClick={(e) => {
            e.stopPropagation()
            handleSelectParam('shape')
          }}
          className="flex items-center justify-between text-slate-300 bg-white/5 hover:bg-white/10 hover:border-cyan-400/40 border border-transparent px-2 py-1 rounded cursor-pointer transition-all active:scale-[0.98]"
        >
          <span className="text-slate-400 text-[10px]">Shape</span>
          <span className="text-cyan-300 font-semibold uppercase text-[10px]">
            {shape}
          </span>
        </button>

        <button
          type="button"
          title="Click to toggle Audio Reactivity"
          onClick={handleToggleReactivity}
          className="flex items-center justify-between text-slate-300 bg-white/5 hover:bg-white/10 hover:border-cyan-400/40 border border-transparent px-2 py-1 rounded cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-1 text-slate-400 text-[10px]">
            <Activity className="w-3 h-3 text-cyber-cyan" />
            <span>Reactivity</span>
          </div>
          <span
            className={`font-semibold text-[10px] ${
              isReactive ? 'text-cyber-cyan' : 'text-slate-500'
            }`}
          >
            {isReactive ? 'AUDIO-REACTIVE' : 'FIXED'}
          </span>
        </button>
      </div>
    </div>
  )
}
