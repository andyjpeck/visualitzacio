import React, { useState } from 'react'
import { GripHorizontal, X } from 'lucide-react'
import { useAppStore } from '../store/app-store'
import { useDraggableDialog } from '../hooks/use-draggable-dialog'
import { useEscapeKey } from '../hooks/use-escape-key'
import {
  FRAME_BUFFER_TEMPLATES,
  type FrameBufferTemplate,
} from '../../engine/frame-buffer/frame-buffer-templates'

/**
 * Cyberpunk modal dialog displaying the curated catalog of built-in Frame Buffer & Ping-Pong Feedback templates.
 * Features dirty-state confirmation guarding user-tuned parameters from accidental overwrite.
 */
export function FrameBufferTemplateSelector(): React.ReactElement | null {
  const isOpen = useAppStore((state) => state.isTemplateSelectorOpen)
  const setIsOpen = useAppStore((state) => state.setIsTemplateSelectorOpen)
  const selectedTemplateId = useAppStore((state) => state.selectedTemplateId)
  const isCustomConfig = useAppStore((state) => state.isCustomFeedbackConfig)
  const applyTemplate = useAppStore((state) => state.applyFrameBufferTemplate)

  const [pendingTemplate, setPendingTemplate] = useState<FrameBufferTemplate | null>(null)

  const {
    dialogRef,
    position,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDraggableDialog()

  // Escape key closes modal
  useEscapeKey(isOpen, () => setIsOpen(false))

  if (!isOpen) return null

  const handleSelectTemplate = (template: FrameBufferTemplate) => {
    if (template.id === selectedTemplateId && !isCustomConfig) {
      return
    }

    if (isCustomConfig) {
      setPendingTemplate(template)
    } else {
      applyTemplate(template.id)
    }
  }

  const handleConfirmOverwrite = () => {
    if (pendingTemplate) {
      applyTemplate(pendingTemplate.id)
      setPendingTemplate(null)
    }
  }

  const handleCancelOverwrite = () => {
    setPendingTemplate(null)
  }

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'audio-reactive':
        return 'bg-pink-950/60 text-pink-300 border-pink-500/40'
      case 'multi-pass':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40'
      case 'feedback':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-600/50'
    }
  }

  return (
    <div
      ref={dialogRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="fixed z-50 w-[92vw] max-w-2xl max-h-[85vh] bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="false"
      aria-labelledby="template-selector-title"
    >
      {/* Header (Draggable Handle) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Drag to move template dialog around screen"
        className={`flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/50 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        data-testid="template-selector-header"
      >
        <div className="flex items-center space-x-3 pointer-events-none">
          <GripHorizontal className="w-5 h-5 text-slate-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-glow" />
          <h2 id="template-selector-title" className="text-base font-semibold tracking-wide text-cyan-300 uppercase">
            Frame Buffer Templates
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close template selector"
          className="text-slate-400 hover:text-cyan-400 transition-colors p-1 rounded hover:bg-slate-800 pointer-events-auto cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {FRAME_BUFFER_TEMPLATES.map((template) => {
            const isSelected = template.id === selectedTemplateId && !isCustomConfig
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleSelectTemplate(template)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-150 flex flex-col space-y-2 ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-950/40 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-100 flex items-center space-x-2">
                    <span>{template.name}</span>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Active
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                      template.category,
                    )}`}
                  >
                    {template.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {template.description}
                </p>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono pt-1">
                  <span>blend: {template.config.blendMode}</span>
                  <span>•</span>
                  <span>decay: {template.config.opacity}</span>
                  <span>•</span>
                  <span>scale: {template.config.scale}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Dirty State Confirmation Overlay */}
        {pendingTemplate && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-10 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-amber-500/50 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Overwrite Custom Settings?
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have active custom modifications. Applying{' '}
                <span className="text-cyan-300 font-medium">{pendingTemplate.name}</span> will
                replace your current feedback transform and formula expressions.
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelOverwrite}
                  className="px-3 py-1.5 rounded text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Keep Custom
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOverwrite}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-glow"
                >
                  Overwrite
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}
