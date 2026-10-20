import React, { useCallback } from 'react'
import {
  Crown,
  Eye,
  EyeOff,
  ImageIcon,
  Layers,
  Settings,
  Sparkles,
} from 'lucide-react'
import { ParameterRow } from './parameter-row'
import { useAppStore } from '../store/app-store'
import type { RenderEngine } from '../../engine/render-engine'
import { FRAME_BUFFER_TEMPLATES } from '../../engine/frame-buffer/frame-buffer-templates'
import type { ResolutionScale } from '../../contracts/preset-settings'

export interface ParameterInspectorProps {
  engine?: RenderEngine | null
  className?: string
}

const BLEND_MODE_OPTIONS = [
  { label: 'Replace (Standard)', value: 'replace' },
  { label: 'Add (Additive Glow)', value: 'add' },
  { label: 'Screen (Luminance Soft)', value: 'screen' },
  { label: 'Multiply (Darken)', value: 'multiply' },
  { label: 'Subtract', value: 'subtract' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Darken', value: 'darken' },
  { label: 'Difference', value: 'difference' },
  { label: 'Color Dodge', value: 'color-dodge' },
  { label: 'Linear Burn', value: 'linear-burn' },
]

const FIT_MODE_OPTIONS = [
  { label: 'Cover (Aspect Fill)', value: 'cover' },
  { label: 'Contain (Aspect Fit)', value: 'contain' },
  { label: 'Stretch', value: 'stretch' },
]

const SHAPE_OPTIONS = [
  { label: 'Crystal Wireframe', value: 'Crystal' },
  { label: 'Cube Wireframe', value: 'Cube' },
  { label: 'Torus Wireframe', value: 'Torus' },
  { label: 'Sphere Wireframe', value: 'Sphere' },
]

const RESOLUTION_OPTIONS = [
  { label: '100% (Native 1.0x)', value: '1.0' },
  { label: '75% (Performance 0.75x)', value: '0.75' },
  { label: '50% (Eco 0.5x)', value: '0.5' },
  { label: '25% (Ultra-Low 0.25x)', value: '0.25' },
]

/**
 * Docked Parameter Inspector panel mounted in the top Studio split-view pane.
 * Reflects and mutates properties of the selected node in real time.
 */
export function ParameterInspector({
  engine = null,
  className = '',
}: ParameterInspectorProps): React.ReactElement {
  const selectedNodeId = useAppStore((state) => state.selectedNodeId)
  const focusedParamKey = useAppStore((state) => state.focusedParamKey)
  const graphNodes = useAppStore((state) => state.graphNodes)
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)
  const setNodeParent = useAppStore((state) => state.setNodeParent)
  const isPlaying = useAppStore((state) => state.isPlaying)

  // Preset-wide fallback settings
  const targetFps = useAppStore((state) => state.targetFps)
  const setTargetFps = useAppStore((state) => state.setTargetFps)
  const resolutionScale = useAppStore((state) => state.resolutionScale)
  const setResolutionScale = useAppStore((state) => state.setResolutionScale)

  const selectedNode = graphNodes.find((n) => n.id === selectedNodeId)

  const handleUpdate = useCallback(
    (paramKey: string, value: number | string | boolean) => {
      if (selectedNodeId) {
        const patch: Record<string, unknown> = { [paramKey]: value }
        if (
          typeof value === 'string' &&
          (value.includes('$') ||
            value.includes('#') ||
            (value.trim() !== '' && Number.isNaN(Number(value))))
        ) {
          patch[`${paramKey}_formula`] = value
          if (paramKey === 'offsetX') patch.positionX_formula = value
          if (paramKey === 'offsetY') patch.positionY_formula = value
          if (paramKey === 'positionX') patch.offsetX_formula = value
          if (paramKey === 'positionY') patch.offsetY_formula = value
        }
        if (paramKey === 'blendMode') {
          if (value !== 'replace') {
            patch.feedback = true
            const currentNode = graphNodes.find((n) => n.id === selectedNodeId)
            if (
              currentNode &&
              (currentNode.data.opacity === undefined || currentNode.data.opacity === 1.0)
            ) {
              patch.opacity = 0.92
            }
          } else {
            patch.feedback = false
          }
        }
        updateGraphNodeData(selectedNodeId, patch)
      }
    },
    [selectedNodeId, graphNodes, updateGraphNodeData],
  )

  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const template = FRAME_BUFFER_TEMPLATES.find((t) => t.id === templateId)
      if (!template || !selectedNodeId) return

      updateGraphNodeData(selectedNodeId, {
        feedback: template.config.feedback,
        blendMode: template.config.blendMode,
        opacity: template.config.opacity,
        scale: template.config.scale,
        rotation: template.config.rotation,
        positionX: template.config.positionX,
        positionY: template.config.positionY,
      })
    },
    [selectedNodeId, updateGraphNodeData],
  )

  // If no node selected, show Preset-Wide Performance Settings
  if (!selectedNode) {
    return (
      <div
        data-testid="parameter-inspector-global"
        className={`w-full h-full flex flex-col overflow-y-auto p-4 bg-cyber-dark/95 select-none ${className}`}
      >
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider">
            Preset-Wide Settings
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-auto">
            (No Node Selected)
          </span>
        </div>

        <div className="flex flex-col gap-2.5 mb-4">
          <ParameterRow
            label="Target FPS"
            value={targetFps}
            min={15}
            max={120}
            step={5}
            type="slider"
            allowExpression={false}
            onChange={(val) => setTargetFps(Number(val))}
          />

          <ParameterRow
            label="Resolution Scale"
            value={String(resolutionScale)}
            type="dropdown"
            options={RESOLUTION_OPTIONS}
            allowExpression={false}
            onChange={(val) => setResolutionScale(parseFloat(String(val)) as ResolutionScale)}
          />
        </div>

        <div className="mt-auto p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-mono text-slate-500 text-center">
          💡 Click any node in the graph below to inspect and modulate its parameters.
        </div>
      </div>
    )
  }

  const { data, type } = selectedNode
  const isMaster = type === 'masterFrameBuffer'
  const isFrameBuffer = type === 'frameBuffer'
  const isImage = type === 'staticImage'
  const isVisual = type === 'testVisual'
  const isBypassed = Boolean(data.bypassed)

  const containerNodes = graphNodes.filter(
    (n) =>
      (n.type === 'masterFrameBuffer' || n.type === 'frameBuffer') &&
      n.id !== selectedNodeId,
  )

  return (
    <div
      data-testid="parameter-inspector"
      className={`w-full h-full flex flex-col overflow-y-auto p-3 bg-cyber-dark/95 select-none ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          {isMaster && <Crown className="w-4 h-4 text-amber-400" />}
          {isFrameBuffer && <Layers className="w-4 h-4 text-purple-400" />}
          {isImage && <ImageIcon className="w-4 h-4 text-emerald-400" />}
          {isVisual && <Sparkles className="w-4 h-4 text-cyber-cyan" />}

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-100">
              {String(data.label || selectedNode.id)}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase">
              {type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Selector for Frame Buffers */}
          {isFrameBuffer && (
            <select
              data-testid="component-preset-dropdown"
              onChange={(e) => handleApplyTemplate(e.target.value)}
              defaultValue=""
              aria-label="Component Preset Selector"
              className="px-2 py-1 rounded bg-black/50 border border-purple-500/30 text-[11px] font-mono text-purple-300 focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="" disabled>
                Load Template...
              </option>
              {FRAME_BUFFER_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id} className="bg-cyber-dark text-slate-200">
                  {tmpl.name}
                </option>
              ))}
            </select>
          )}

          {/* Bypass Toggle */}
          {!isMaster && (
            <button
              type="button"
              onClick={() => handleUpdate('bypassed', !isBypassed)}
              title={isBypassed ? 'Enable Node' : 'Bypass Node'}
              aria-label={isBypassed ? 'Enable Node' : 'Bypass Node'}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isBypassed
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {isBypassed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Parameter Rows List */}
      <div className="flex flex-col gap-2.5">
        <ParameterRow
          label="Display Name"
          value={String(data.label || '')}
          type="text"
          allowExpression={false}
          isFocused={focusedParamKey === 'label'}
          onChange={(val) => handleUpdate('label', String(val))}
        />

        {!isMaster && (
          <ParameterRow
            label="Parent Container"
            value={selectedNode.parentId || 'master-frame-buffer'}
            type="dropdown"
            options={containerNodes.map((c) => ({
              value: c.id,
              label: `${String(c.data.label || c.id)}${c.id === 'master-frame-buffer' ? ' (Root)' : ''}`,
            }))}
            allowExpression={false}
            onChange={(val) => {
              setNodeParent(selectedNode.id, String(val))
            }}
          />
        )}

        {/* Master & FrameBuffer Parameters */}
        {(isMaster || isFrameBuffer) && (
          <>
            <ParameterRow
              label="Blend Mode"
              value={String(data.blendMode || 'replace')}
              type="dropdown"
              options={BLEND_MODE_OPTIONS}
              allowExpression={false}
              isFocused={focusedParamKey === 'blendMode'}
              onChange={(val) => handleUpdate('blendMode', val)}
            />

            <ParameterRow
              label="Opacity"
              value={data.opacity !== undefined ? (data.opacity as number | string) : 1.0}
              savedFormula={typeof data.opacity_formula === 'string' ? data.opacity_formula : undefined}
              min={0}
              max={1}
              step={0.01}
              type="slider"
              isFocused={focusedParamKey === 'opacity'}
              onChange={(val) => handleUpdate('opacity', val)}
              engine={engine}
            />

            <ParameterRow
              label="Scale"
              value={data.scale !== undefined ? (data.scale as number | string) : 1.0}
              savedFormula={typeof data.scale_formula === 'string' ? data.scale_formula : undefined}
              min={0.5}
              max={2.0}
              step={0.01}
              type="slider"
              isFocused={focusedParamKey === 'scale'}
              onChange={(val) => handleUpdate('scale', val)}
              engine={engine}
            />

            <ParameterRow
              label="Offset X"
              value={
                data.offsetX !== undefined
                  ? (data.offsetX as number | string)
                  : data.positionX !== undefined
                    ? (data.positionX as number | string)
                    : 0.0
              }
              savedFormula={
                typeof data.offsetX_formula === 'string'
                  ? data.offsetX_formula
                  : typeof data.positionX_formula === 'string'
                    ? data.positionX_formula
                    : undefined
              }
              min={-1.0}
              max={1.0}
              step={0.01}
              type="slider"
              isFocused={focusedParamKey === 'offsetX' || focusedParamKey === 'positionX'}
              onChange={(val) => {
                handleUpdate('offsetX', val)
                handleUpdate('positionX', val)
              }}
              engine={engine}
            />

            <ParameterRow
              label="Offset Y"
              value={
                data.offsetY !== undefined
                  ? (data.offsetY as number | string)
                  : data.positionY !== undefined
                    ? (data.positionY as number | string)
                    : 0.0
              }
              savedFormula={
                typeof data.offsetY_formula === 'string'
                  ? data.offsetY_formula
                  : typeof data.positionY_formula === 'string'
                    ? data.positionY_formula
                    : undefined
              }
              min={-1.0}
              max={1.0}
              step={0.01}
              type="slider"
              isFocused={focusedParamKey === 'offsetY' || focusedParamKey === 'positionY'}
              onChange={(val) => {
                handleUpdate('offsetY', val)
                handleUpdate('positionY', val)
              }}
              engine={engine}
            />
          </>
        )}

        {/* FrameBuffer Specific Parameters */}
        {isFrameBuffer && (
          <>
            <ParameterRow
              label="Feedback Loop"
              value={Boolean(data.feedback)}
              type="toggle"
              allowExpression={false}
              isFocused={focusedParamKey === 'feedback'}
              onChange={(val) => handleUpdate('feedback', val)}
            />

            <ParameterRow
              label="Rotation"
              value={data.rotation !== undefined ? (data.rotation as number | string) : 0.0}
              savedFormula={typeof data.rotation_formula === 'string' ? data.rotation_formula : undefined}
              min={-180}
              max={180}
              step={1}
              type="slider"
              isFocused={focusedParamKey === 'rotation'}
              onChange={(val) => handleUpdate('rotation', val)}
              engine={engine}
            />
          </>
        )}

        {/* Static Image Parameters */}
        {isImage && (
          <>
            <ParameterRow
              label="Image URL"
              value={String(data.imageUrl || '')}
              type="text"
              allowExpression={false}
              isFocused={focusedParamKey === 'imageUrl'}
              onChange={(val) => handleUpdate('imageUrl', val)}
            />

            <ParameterRow
              label="Fit Mode"
              value={String(data.fitMode || 'cover')}
              type="dropdown"
              options={FIT_MODE_OPTIONS}
              allowExpression={false}
              isFocused={focusedParamKey === 'fitMode'}
              onChange={(val) => handleUpdate('fitMode', val)}
            />

            <ParameterRow
              label="Opacity"
              value={data.opacity !== undefined ? (data.opacity as number | string) : 1.0}
              savedFormula={typeof data.opacity_formula === 'string' ? data.opacity_formula : undefined}
              min={0}
              max={1}
              step={0.01}
              type="slider"
              isFocused={focusedParamKey === 'opacity'}
              onChange={(val) => handleUpdate('opacity', val)}
              engine={engine}
            />
          </>
        )}

        {/* Test Visual Synth Parameters */}
        {isVisual && (
          <>
            <ParameterRow
              label="Shape"
              value={String(data.shape || 'Crystal')}
              type="dropdown"
              options={SHAPE_OPTIONS}
              allowExpression={false}
              isFocused={focusedParamKey === 'shape'}
              onChange={(val) => handleUpdate('shape', val)}
            />

            <div className="flex flex-col gap-1">
              <ParameterRow
                label="Audio Reactivity"
                value={data.reactive !== undefined ? Boolean(data.reactive) : true}
                type="toggle"
                allowExpression={false}
                isFocused={focusedParamKey === 'reactive'}
                onChange={(val) => handleUpdate('reactive', val)}
              />
              {!isPlaying && Boolean(data.reactive ?? true) && (
                <div className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                  ⚠️ Audio is paused. Press PLAY in top toolbar to start audio reactivity.
                </div>
              )}
            </div>

            <ParameterRow
              label="Scale"
              value={data.scale !== undefined ? (data.scale as number | string) : 1.0}
              savedFormula={typeof data.scale_formula === 'string' ? data.scale_formula : undefined}
              min={0.1}
              max={3.0}
              step={0.05}
              type="slider"
              isFocused={focusedParamKey === 'scale'}
              onChange={(val) => handleUpdate('scale', val)}
              engine={engine}
            />

            <ParameterRow
              label="Offset X"
              value={
                data.offsetX !== undefined
                  ? (data.offsetX as number | string)
                  : data.positionX !== undefined
                    ? (data.positionX as number | string)
                    : 0.0
              }
              savedFormula={
                typeof data.offsetX_formula === 'string'
                  ? data.offsetX_formula
                  : typeof data.positionX_formula === 'string'
                    ? data.positionX_formula
                    : undefined
              }
              min={-2.0}
              max={2.0}
              step={0.01}
              type="slider"
              isFocused={focusedParamKey === 'offsetX' || focusedParamKey === 'positionX'}
              onChange={(val) => {
                handleUpdate('offsetX', val)
                handleUpdate('positionX', val)
              }}
              engine={engine}
            />

            <ParameterRow
              label="Offset Y"
              value={
                data.offsetY !== undefined
                  ? (data.offsetY as number | string)
                  : data.positionY !== undefined
                    ? (data.positionY as number | string)
                    : 0.0
              }
              savedFormula={
                typeof data.offsetY_formula === 'string'
                  ? data.offsetY_formula
                  : typeof data.positionY_formula === 'string'
                    ? data.positionY_formula
                    : undefined
              }
              min={-2.0}
              max={2.0}
              step={0.01}
              type="slider"
              isFocused={focusedParamKey === 'offsetY' || focusedParamKey === 'positionY'}
              onChange={(val) => {
                handleUpdate('offsetY', val)
                handleUpdate('positionY', val)
              }}
              engine={engine}
            />
          </>
        )}
      </div>
    </div>
  )
}
