import React, { useCallback, useRef, useState } from 'react'
import {
  AlertTriangle,
  Crown,
  Eye,
  EyeOff,
  ImageIcon,
  Layers,
  Settings,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { ParameterRow } from './parameter-row'
import { useAppStore } from '../store/app-store'
import type { RenderEngine } from '../../engine/render-engine'
import { FRAME_BUFFER_TEMPLATES } from '../../engine/frame-buffer/frame-buffer-templates'
import type { ResolutionScale } from '../../contracts/preset-settings'
import { BaseModalDialog } from '../dialogs/base-modal-dialog'
import { isNodeDirty } from './component-preset-utils'

import type { ParameterOption } from './parameter-row'

export interface ParameterInspectorProps {
  engine?: RenderEngine | null
  className?: string
}

const INPUT_BLEND_MODE_OPTIONS: ParameterOption[] = [
  { label: 'None (Blank Canvas)', value: 'none', tooltip: 'Child layers draw onto a clean, empty canvas before processing.' },
  { label: 'Replace (Standard)', value: 'replace', tooltip: 'Standard direct rendering; incoming pixels overwrite the buffer.' },
  { label: 'Add (Additive Glow)', value: 'add', tooltip: 'Additive blend; pixel colors sum together creating an intense neon glow.' },
  { label: 'Screen (Luminance Soft)', value: 'screen', tooltip: 'Screen blend; inverts, multiplies, and inverts for soft optical luminosity.' },
  { label: 'Multiply (Darken)', value: 'multiply', tooltip: 'Multiplies colors together, darkening light areas and creating depth.' },
  { label: 'Subtract', value: 'subtract', tooltip: 'Subtracts incoming colors from the existing buffer canvas.' },
  { label: 'Lighten', value: 'lighten', tooltip: 'Compares RGB channels and retains the brightest pixels.' },
  { label: 'Darken', value: 'darken', tooltip: 'Compares RGB channels and retains the darkest pixels.' },
  { label: 'Difference', value: 'difference', tooltip: 'Calculates absolute color difference, inverting overlapping forms.' },
  { label: 'Color Dodge', value: 'color-dodge', tooltip: 'Brightens background pixels to reflect the blend color.' },
  { label: 'Linear Burn', value: 'linear-burn', tooltip: 'Darkens background pixels to reflect the blend color.' },
]

const OUTPUT_BLEND_MODE_OPTIONS: ParameterOption[] = [
  { label: 'None (Offscreen Only)', value: 'none', tooltip: 'Does not composite onto the parent buffer; keeps texture offscreen for named bus routing only.' },
  { label: 'Replace (Standard)', value: 'replace', tooltip: 'Overwrites the parent buffer or master screen with this buffer contents.' },
  { label: 'Add (Additive Glow)', value: 'add', tooltip: 'Sums pixel values onto the parent buffer for vibrant additive lighting.' },
  { label: 'Screen (Luminance Soft)', value: 'screen', tooltip: 'Blends onto parent using inverted multiplication for soft photographic luminosity.' },
  { label: 'Multiply (Darken)', value: 'multiply', tooltip: 'Multiplies onto parent buffer, creating shadows and depth.' },
  { label: 'Subtract', value: 'subtract', tooltip: 'Subtracts this buffer colors from the parent buffer.' },
  { label: 'Lighten', value: 'lighten', tooltip: 'Retains whichever pixels are brighter between this buffer and parent.' },
  { label: 'Darken', value: 'darken', tooltip: 'Retains whichever pixels are darker between this buffer and parent.' },
  { label: 'Difference', value: 'difference', tooltip: 'Inverts colors where this buffer overlaps parent content.' },
  { label: 'Color Dodge', value: 'color-dodge', tooltip: 'Brightens parent buffer based on this buffer luminosity.' },
  { label: 'Linear Burn', value: 'linear-burn', tooltip: 'Darkens parent buffer based on this buffer luminosity.' },
]

const FIT_MODE_OPTIONS: ParameterOption[] = [
  { label: 'Cover (Aspect Fill)', value: 'cover', tooltip: 'Scales image to fill the canvas completely, cropping excess margins.' },
  { label: 'Contain (Aspect Fit)', value: 'contain', tooltip: 'Scales entire image to fit inside canvas without cropping, preserving aspect ratio.' },
  { label: 'Stretch', value: 'stretch', tooltip: 'Stretches image to fill entire canvas width and height disregarding aspect ratio.' },
]

const SHAPE_OPTIONS: ParameterOption[] = [
  { label: 'Crystal Wireframe', value: 'Crystal', tooltip: 'Complex facet-refracting crystalline polyhedron geometry.' },
  { label: 'Cube Wireframe', value: 'Cube', tooltip: 'Classic geometric 3D cube mesh with rotating axes.' },
  { label: 'Torus Wireframe', value: 'Torus', tooltip: 'Donut ring geometry with radial harmonic ripple waves.' },
  { label: 'Sphere Wireframe', value: 'Sphere', tooltip: 'Geodesic spherical mesh undulating with audio frequency bands.' },
]

const RESOLUTION_OPTIONS: ParameterOption[] = [
  { label: '100% (Native 1.0x)', value: '1.0', tooltip: 'Native 1:1 pixel rendering matching device display resolution.' },
  { label: '75% (Performance 0.75x)', value: '0.75', tooltip: 'Renders at 75% resolution; balances crisp visuals with high frame rates.' },
  { label: '50% (Eco 0.5x)', value: '0.5', tooltip: 'Renders at half resolution; maximizes performance and GPU battery efficiency.' },
  { label: '25% (Ultra-Low 0.25x)', value: '0.25', tooltip: 'Quarter resolution rendering; ultra-fast fallback for low-end hardware.' },
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
        if (paramKey === 'saveTo') {
          const str = String(value).trim()
          patch[paramKey] = str === '' ? '' : str.startsWith('@') ? str : `@${str}`
        }
        if (paramKey === 'loadFrom') {
          const str = String(value).trim()
          const formatted = str === '' ? '' : str.startsWith('@') ? str : `@${str}`
          patch[paramKey] = formatted
          const currentNode = graphNodes.find((n) => n.id === selectedNodeId)
          if (
            formatted &&
            (!currentNode?.data.inputBlendMode || currentNode?.data.inputBlendMode === 'none')
          ) {
            patch.inputBlendMode = 'replace'
          }
        }
        if (paramKey === 'outputBlendMode') {
          patch.outputBlendMode = value
          patch.blendMode = value
          if (value !== 'replace' && value !== 'none') {
            patch.feedback = true
            const currentNode = graphNodes.find((n) => n.id === selectedNodeId)
            if (
              currentNode &&
              (currentNode.data.opacity === undefined || currentNode.data.opacity === 1.0)
            ) {
              patch.opacity = 0.92
            }
          } else if (value === 'replace') {
            patch.feedback = false
          }
        }
        if (paramKey === 'blendMode') {
          patch.outputBlendMode = value
          if (value !== 'replace' && value !== 'none') {
            patch.feedback = true
            const currentNode = graphNodes.find((n) => n.id === selectedNodeId)
            if (
              currentNode &&
              (currentNode.data.opacity === undefined || currentNode.data.opacity === 1.0)
            ) {
              patch.opacity = 0.92
            }
          } else if (value === 'replace') {
            patch.feedback = false
          }
        }
        updateGraphNodeData(selectedNodeId, patch)
      }
    },
    [selectedNodeId, graphNodes, updateGraphNodeData],
  )

  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)

  const appliedTemplateId = typeof selectedNode?.data?.appliedTemplateId === 'string'
    ? selectedNode.data.appliedTemplateId
    : ''
  const dropdownValue = pendingTemplateId ?? appliedTemplateId

  const applyTemplateConfig = useCallback(
    (templateId: string) => {
      const template = FRAME_BUFFER_TEMPLATES.find((t) => t.id === templateId)
      if (!template || !selectedNodeId) return

      updateGraphNodeData(selectedNodeId, {
        appliedTemplateId: template.id,
        feedback: template.config.feedback,
        blendMode: template.config.blendMode,
        opacity: template.config.opacity,
        scale: template.config.scale,
        rotation: template.config.rotation,
        positionX: template.config.positionX,
        positionY: template.config.positionY,
      })
      setPendingTemplateId(null)
    },
    [selectedNodeId, updateGraphNodeData],
  )

  const handleTemplateDropdownChange = useCallback(
    (templateId: string) => {
      if (!templateId || !selectedNode) return

      // If the node has customized parameters or already applied template, warn before overwriting
      if (isNodeDirty(selectedNode)) {
        setPendingTemplateId(templateId)
      } else {
        applyTemplateConfig(templateId)
      }
    },
    [selectedNode, applyTemplateConfig],
  )

  const handleCancelApplyTemplate = useCallback(() => {
    setPendingTemplateId(null)
  }, [])

  const handleConfirmApplyTemplate = useCallback(() => {
    if (pendingTemplateId) {
      applyTemplateConfig(pendingTemplateId)
    }
  }, [pendingTemplateId, applyTemplateConfig])

  const pendingTemplate = pendingTemplateId
    ? FRAME_BUFFER_TEMPLATES.find((t) => t.id === pendingTemplateId)
    : null

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragOverImage, setIsDragOverImage] = useState(false)

  const handleImageFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !selectedNodeId) return

      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result
        if (typeof result === 'string') {
          updateGraphNodeData(selectedNodeId, {
            imageUrl: result,
            imageFileName: file.name,
          })
        }
      }
      reader.readAsDataURL(file)

      // Reset file input value so re-uploading the same file works
      e.target.value = ''
    },
    [selectedNodeId, updateGraphNodeData],
  )

  const handleImageDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOverImage(false)
      const file = e.dataTransfer.files?.[0]
      if (!file || !selectedNodeId) return
      if (!file.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result
        if (typeof result === 'string') {
          updateGraphNodeData(selectedNodeId, {
            imageUrl: result,
            imageFileName: file.name,
          })
        }
      }
      reader.readAsDataURL(file)
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
              value={dropdownValue}
              onChange={(e) => handleTemplateDropdownChange(e.target.value)}
              aria-label="Component Preset Selector"
              title="Apply a built-in frame buffer template preset"
              className="px-2 py-1 rounded bg-black/50 border border-purple-500/30 text-[11px] font-mono text-purple-300 focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="" disabled title="Select a template preset to load">
                Load Template...
              </option>
              {FRAME_BUFFER_TEMPLATES.map((tmpl) => (
                <option
                  key={tmpl.id}
                  value={tmpl.id}
                  title={tmpl.description}
                  className="bg-cyber-dark text-slate-200"
                >
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
          tooltip="User-friendly name of the layer in the pipeline and tree view"
          type="text"
          allowExpression={false}
          isFocused={focusedParamKey === 'label'}
          onChange={(val) => handleUpdate('label', String(val))}
        />

        {!isMaster && (
          <ParameterRow
            label="Parent Container"
            value={selectedNode.parentId || 'master-frame-buffer'}
            tooltip="Parent container buffer that encloses and groups this layer"
            type="dropdown"
            options={containerNodes.map((c) => ({
              value: c.id,
              label: `${String(c.data.label || c.id)}${c.id === 'master-frame-buffer' ? ' (Root)' : ''}`,
              tooltip: `Nest layer inside ${String(c.data.label || c.id)}`,
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
              label="Input Blend Mode"
              value={String(data.inputBlendMode || (data.loadFrom ? 'replace' : 'none'))}
              tooltip="How child layers composite into this buffer canvas before processing"
              type="dropdown"
              options={INPUT_BLEND_MODE_OPTIONS}
              allowExpression={false}
              isFocused={focusedParamKey === 'inputBlendMode'}
              onChange={(val) => handleUpdate('inputBlendMode', val)}
            />

            <ParameterRow
              label="Output Blend Mode"
              value={String(data.outputBlendMode || data.blendMode || 'replace')}
              tooltip="How this buffer's output composites onto its parent container or screen"
              type="dropdown"
              options={OUTPUT_BLEND_MODE_OPTIONS}
              allowExpression={false}
              isFocused={focusedParamKey === 'outputBlendMode' || focusedParamKey === 'blendMode'}
              onChange={(val) => handleUpdate('outputBlendMode', val)}
            />

            <ParameterRow
              label="Opacity"
              value={data.opacity !== undefined ? (data.opacity as number | string) : 1.0}
              savedFormula={typeof data.opacity_formula === 'string' ? data.opacity_formula : undefined}
              tooltip="Layer opacity / transparency or feedback decay persistence (0.0 to 1.0)"
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
              tooltip="Scale multiplier for geometry, image, or feedback zoom"
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
              tooltip="Horizontal displacement from center (-1.0 left to +1.0 right)"
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
              tooltip="Vertical displacement from center (-1.0 bottom to +1.0 top)"
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
              tooltip="Enables dual-FBO ping-pong feedback loop to create recursive motion trails"
              type="toggle"
              allowExpression={false}
              isFocused={focusedParamKey === 'feedback'}
              onChange={(val) => handleUpdate('feedback', val)}
            />

            <ParameterRow
              label="Rotation"
              value={data.rotation !== undefined ? (data.rotation as number | string) : 0.0}
              savedFormula={typeof data.rotation_formula === 'string' ? data.rotation_formula : undefined}
              tooltip="Angular rotation in degrees applied each frame pass (-180° to +180°)"
              min={-180}
              max={180}
              step={1}
              type="slider"
              isFocused={focusedParamKey === 'rotation'}
              onChange={(val) => handleUpdate('rotation', val)}
              engine={engine}
            />

            <ParameterRow
              label="Publish Output (@NAME)"
              value={String(data.saveTo || '')}
              tooltip="Publish this buffer's rendered texture to a named virtual bus (e.g. @IMAGE) for other nodes to sample"
              type="text"
              allowExpression={false}
              isFocused={focusedParamKey === 'saveTo'}
              onChange={(val) => handleUpdate('saveTo', val)}
            />

            <ParameterRow
              label="Sample Input (@NAME)"
              value={String(data.loadFrom || '')}
              tooltip="Sample a texture from a named virtual bus (e.g. @IMAGE) into this buffer"
              type="text"
              allowExpression={false}
              isFocused={focusedParamKey === 'loadFrom'}
              onChange={(val) => handleUpdate('loadFrom', val)}
            />
          </>
        )}

        {/* Master Output Specific Parameters */}
        {isMaster && (
          <ParameterRow
            label="Sample Input (@NAME)"
            value={String(data.loadFrom || '')}
            tooltip="Sample a texture from a named virtual bus (e.g. @IMAGE) into this buffer"
            type="text"
            allowExpression={false}
            isFocused={focusedParamKey === 'loadFrom'}
            onChange={(val) => handleUpdate('loadFrom', val)}
          />
        )}

        {/* Static Image Parameters */}
        {isImage && (
          <>
            <ParameterRow
              label="Publish Output (@NAME)"
              value={String(data.saveTo || '')}
              tooltip="Publish this image texture to a named virtual bus (e.g. @IMAGE) for other nodes to sample"
              type="text"
              allowExpression={false}
              isFocused={focusedParamKey === 'saveTo'}
              onChange={(val) => handleUpdate('saveTo', val)}
            />

            {/* Image Texture File Upload & Preview Section */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/10 my-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Image Texture File
                </span>
                {Boolean(data.imageUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdate('imageUrl', '')
                      handleUpdate('imageFileName', '')
                    }}
                    className="text-[10px] font-mono text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    title="Remove current image texture"
                    data-testid="static-image-clear-button"
                  >
                    <X className="w-3 h-3" /> Clear Image
                  </button>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                data-testid="static-image-file-input"
                className="hidden"
                onChange={handleImageFileUpload}
              />

              {/* Upload Dropzone / Button */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOverImage(true)
                }}
                onDragLeave={() => setIsDragOverImage(false)}
                onDrop={handleImageDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="static-image-upload-dropzone"
                className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed transition-all cursor-pointer select-none ${
                  isDragOverImage
                    ? 'border-emerald-400 bg-emerald-500/20 scale-[1.01]'
                    : 'border-white/20 hover:border-emerald-400/60 bg-black/30 hover:bg-black/50'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-medium">
                  <Upload className="w-4 h-4" />
                  <span>{data.imageUrl ? 'Replace Image (Drop or Browse)...' : 'Upload Image (Drop or Browse)...'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1 text-center">
                  PNG, JPG, SVG, WebP, GIF • Encoded into JSON
                </span>
              </div>

              {/* Image Preview & Details (if image is present) */}
              {Boolean(data.imageUrl) && (
                <div
                  data-testid="static-image-preview-container"
                  className="flex flex-col items-center justify-center p-2 rounded bg-black/50 border border-white/10 gap-2"
                >
                  <div className="relative max-h-32 w-full flex items-center justify-center overflow-hidden rounded bg-[#080811]">
                    <img
                      src={String(data.imageUrl)}
                      alt={String(data.imageFileName || 'Image preview')}
                      data-testid="static-image-preview"
                      className="max-h-32 max-w-full object-contain rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between w-full px-1 text-[10px] font-mono text-slate-400">
                    <span
                      className="truncate max-w-[160px]"
                      title={String(data.imageFileName || (String(data.imageUrl).startsWith('data:') ? 'Base64 Encoded Image' : data.imageUrl))}
                    >
                      {String(data.imageFileName || (String(data.imageUrl).startsWith('data:') ? 'Embedded Base64' : 'External Asset'))}
                    </span>
                    <span className="text-emerald-400/90 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {String(data.imageUrl).startsWith('data:') ? 'JSON Encoded' : 'URL Link'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <ParameterRow
              label="Image URL / Base64"
              value={String(data.imageUrl || '')}
              tooltip="Web URL or asset path of the image texture (or Base64 data URL encoded into preset JSON)"
              type="text"
              allowExpression={false}
              isFocused={focusedParamKey === 'imageUrl'}
              onChange={(val) => {
                handleUpdate('imageUrl', val)
                if (!val) {
                  handleUpdate('imageFileName', '')
                }
              }}
            />

            <ParameterRow
              label="Fit Mode"
              value={String(data.fitMode || 'cover')}
              tooltip="How the image texture is mapped and scaled onto the buffer canvas"
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
              tooltip="Layer opacity / transparency (0.0 to 1.0)"
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
              tooltip="Geometric 3D wireframe mesh shape to synthesize and render"
              type="dropdown"
              options={SHAPE_OPTIONS}
              allowExpression={false}
              isFocused={focusedParamKey === 'shape'}
              onChange={(val) => handleUpdate('shape', val)}
            />

            <ParameterRow
              label="Scale"
              value={data.scale !== undefined ? (data.scale as number | string) : 1.0}
              savedFormula={typeof data.scale_formula === 'string' ? data.scale_formula : undefined}
              tooltip="Scale multiplier of the 3D synth geometry"
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
              tooltip="Horizontal displacement from center (-2.0 left to +2.0 right)"
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
              tooltip="Vertical displacement from center (-2.0 bottom to +2.0 top)"
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

      {/* Dirty-State Confirmation Modal */}
      {pendingTemplate && selectedNode && (
        <BaseModalDialog
          isOpen={Boolean(pendingTemplate)}
          onClose={handleCancelApplyTemplate}
          title="Overwrite Component Parameters?"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          maxWidthClass="max-w-md"
          className="border-amber-500/40 shadow-amber-500/20"
          headerTestId="overwrite-template-modal-header"
        >
          <div className="flex flex-col gap-4 text-xs font-mono select-none">
            <p className="text-slate-300 leading-relaxed">
              This layer <span className="font-bold text-white">&quot;{String(selectedNode.data?.label || selectedNode.id)}&quot;</span> has customized parameters. Applying the <span className="font-bold text-purple-300">&quot;{pendingTemplate.name}&quot;</span> template will overwrite your current settings.
            </p>

            <div className="p-3 rounded-lg bg-black/40 border border-purple-500/30 flex flex-col gap-1.5">
              <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">
                Template Preview: {pendingTemplate.name}
              </span>
              <p className="text-[11px] text-slate-400">
                {pendingTemplate.description}
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-300">
                <div>Blend Mode: <span className="text-white font-semibold">{pendingTemplate.config.blendMode}</span></div>
                <div>Feedback: <span className="text-white font-semibold">{pendingTemplate.config.feedback ? 'Enabled' : 'Disabled'}</span></div>
                <div>Opacity: <span className="text-white font-semibold">{pendingTemplate.config.opacity}</span></div>
                <div>Scale: <span className="text-white font-semibold">{pendingTemplate.config.scale}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                data-testid="cancel-overwrite-template-btn"
                onClick={handleCancelApplyTemplate}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Keep Current
              </button>
              <button
                type="button"
                data-testid="confirm-overwrite-template-btn"
                onClick={handleConfirmApplyTemplate}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                Overwrite & Apply
              </button>
            </div>
          </div>
        </BaseModalDialog>
      )}
    </div>
  )
}
