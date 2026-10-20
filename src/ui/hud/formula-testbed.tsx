import React, { useEffect, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Sparkles,
} from 'lucide-react'
import type { RenderEngine } from '../../engine/render-engine'
import { TestVisualNode } from '../../engine/visual-node'
import { getDefaultExpressionEngine } from '../../engine/expressions/expression-engine'
import { useAppStore } from '../store/app-store'
import { BaseModalDialog } from '../dialogs/base-modal-dialog'
import { PRESET_FORMULAS } from '../expressions/expression-catalog'
import { ExpressionInput } from '../expressions/expression-input'
import { ExpressionSparkline } from '../expressions/expression-sparkline'
import { ExpressionQuickReference } from '../expressions/expression-quick-reference'

export interface FormulaTestbedProps {
  engine: RenderEngine | null
  /** Optional ref to inspect active history buffer length for testing/memory auditing */
  historyLengthRef?: React.MutableRefObject<number>
}

/**
 * Interactive Formula Testbed HUD Dialog.
 * Provides a floating, draggable window for testing mathematical expressions against
 * real-time audio and frame telemetry with live 60 FPS plotting.
 */
export function FormulaTestbed({ engine, historyLengthRef }: FormulaTestbedProps): React.ReactElement | null {
  const isOpen = useAppStore((state) => state.isFormulaTestbedOpen)
  const activeFormula = useAppStore((state) => state.activeFormula)
  const setActiveFormula = useAppStore((state) => state.setActiveFormula)
  const bindFormulaToScene = useAppStore((state) => state.bindFormulaToScene)
  const setBindFormulaToScene = useAppStore((state) => state.setBindFormulaToScene)
  const isFormulaPresetsOpen = useAppStore((state) => state.isFormulaPresetsOpen)
  const toggleFormulaPresets = useAppStore((state) => state.toggleFormulaPresets)
  const isFormulaReferenceOpen = useAppStore((state) => state.isFormulaReferenceOpen)
  const toggleFormulaReference = useAppStore((state) => state.toggleFormulaReference)

  const handleInsertToken = (token: string) => {
    setActiveFormula(activeFormula ? `${activeFormula} + ${token}` : token)
  }



  const expressionEngine = useMemo(() => getDefaultExpressionEngine(), [])

  // Validation
  const validation = useMemo(() => {
    return expressionEngine.validate(activeFormula)
  }, [activeFormula, expressionEngine])

  // Sync formula with 3D scene node
  useEffect(() => {
    if (!engine) return
    const nodes = typeof engine.getAllNodes === 'function' ? engine.getAllNodes() : engine.getNodes()
    for (const node of nodes) {
      if (node instanceof TestVisualNode) {
        if (isOpen && bindFormulaToScene && validation.isValid) {
          node.setScaleExpression(activeFormula, expressionEngine)
        } else if (!isOpen) {
          const graphNodes = useAppStore.getState().graphNodes
          const gNode = graphNodes.find((n) => n.id === node.id)
          const scaleVal =
            gNode?.data.scale !== undefined ? (gNode.data.scale as string | number) : 1.0
          node.setScaleExpression(scaleVal, expressionEngine)
        } else {
          node.setScaleExpression(null)
        }
      }
    }
  }, [engine, isOpen, activeFormula, bindFormulaToScene, validation.isValid, expressionEngine])

  // Cleanup scene binding when unmounting
  useEffect(() => {
    return () => {
      if (!engine) return
      const nodes = typeof engine.getAllNodes === 'function' ? engine.getAllNodes() : engine.getNodes()
      for (const node of nodes) {
        if (node instanceof TestVisualNode) {
          node.setScaleExpression(null)
        }
      }
    }
  }, [engine])

  return (
    <BaseModalDialog
      dialogId="formula-testbed"
      title={
        <>
          Dynamic Expression Testbed <span className="font-mono text-xs opacity-75">f(x)</span>
        </>
      }
      icon={<Code2 className="w-5 h-5 text-cyber-cyan" />}
      headerTestId="formula-dialog-header"
      closeAriaLabel="Close formula testbed"
      maxWidthClass="max-w-xl"
      maxHeightClass="max-h-[85vh]"
    >

      {/* Scrollable Body */}
      <div className="mt-5 space-y-5 overflow-y-auto pr-1">
        {/* Formula Input */}
        <ExpressionInput
          value={activeFormula}
          onChange={setActiveFormula}
          isValid={validation.isValid}
          error={validation.error}
        />

        {/* 60 FPS Real-time Evaluation Meter & Sparkline Chart */}
        <ExpressionSparkline
          engine={engine}
          expressionEngine={expressionEngine}
          formula={activeFormula}
          isValid={validation.isValid}
          isActive={isOpen}
          historyLengthRef={historyLengthRef}
        />

        {/* Bind to Scene Crystal Option */}
        <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
          <input
            type="checkbox"
            checked={bindFormulaToScene}
            onChange={(e) => setBindFormulaToScene(e.target.checked)}
            className="w-4 h-4 rounded text-cyber-cyan bg-black/60 border-white/20 focus:ring-cyber-cyan focus:ring-offset-0 cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">
              Drive 3D Scene Crystal Scale
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Directly modulates the 3D crystal testbed mesh with this formula
            </span>
          </div>
        </label>

        {/* Quick Reference (Collapsible with Tooltips) */}
        <ExpressionQuickReference
          isOpen={isFormulaReferenceOpen}
          onToggle={toggleFormulaReference}
          onInsertToken={handleInsertToken}
        />

        {/* Preset Formulas (Collapsible) */}
        <div className="border border-white/10 rounded-lg bg-white/5 overflow-hidden">
          <button
            type="button"
            onClick={toggleFormulaPresets}
            className="w-full flex items-center justify-between p-2.5 text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer select-none"
            aria-expanded={isFormulaPresetsOpen}
            aria-controls="formula-presets-panel"
            data-testid="toggle-formula-presets"
          >
            <div className="flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyber-amber" />
              <span>Example Formula Presets</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[10px] text-slate-500 font-mono">
                {isFormulaPresetsOpen ? 'Hide' : `${PRESET_FORMULAS.length} presets`}
              </span>
              {isFormulaPresetsOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {isFormulaPresetsOpen && (
            <div
              id="formula-presets-panel"
              className="p-3 pt-1 border-t border-white/5 grid grid-cols-2 gap-2"
              data-testid="formula-presets-panel"
            >
              {PRESET_FORMULAS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setActiveFormula(preset.formula)}
                  className="p-2.5 rounded-lg text-left bg-black/40 border border-white/10 hover:bg-cyber-cyan/10 hover:border-cyber-cyan/40 hover:text-cyber-cyan transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold group-hover:text-cyber-cyan">
                      {preset.name}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 truncate mt-1">
                    {preset.formula}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModalDialog>
  )
}
