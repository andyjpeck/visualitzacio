import React, { useMemo } from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import type { TestVisualNodeData } from './node-data'
import { useAppStore } from '../../store/app-store'
import { computeExecutionOrder } from '../execution-order'

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
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)
  const graphNodes = useAppStore((state) => state.graphNodes)
  const executionOrder = useMemo(() => computeExecutionOrder(graphNodes).get(id), [graphNodes, id])

  const handleToggleBypass = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateGraphNodeData(id, { bypassed: !isBypassed })
  }

  return (
    <div
      data-testid="test-visual-node"
      className={`relative rounded-xl border px-3.5 py-2.5 w-[240px] bg-gradient-to-b from-[#091724] to-[#0c0d14] shadow-xl transition-all select-none ${
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyber-cyan">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            {/* Line 1: User Customizable Display Name */}
            <div className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
              {executionOrder !== undefined && (
                <span
                  data-testid="execution-order-badge"
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/25 text-cyber-cyan font-bold border border-cyan-500/40"
                  title={`Execution Order: Pass #${executionOrder}`}
                >
                  #{executionOrder}
                </span>
              )}
              <span>{data.label || 'Crystal Synth'}</span>
            </div>
            {/* Line 2: Component Type */}
            <div className="text-[10px] text-cyan-400/70 font-mono">
              Test Visual Synth
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
