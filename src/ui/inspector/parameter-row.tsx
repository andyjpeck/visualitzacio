import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronUp, Info, RotateCcw, Sparkles } from 'lucide-react'
import { ExpressionInput } from '../expressions/expression-input'
import { ExpressionSparkline } from '../expressions/expression-sparkline'
import { ExpressionQuickReference } from '../expressions/expression-quick-reference'
import { PRESET_FORMULAS } from '../expressions/expression-catalog'
import { ExpressionAutocomplete } from './expression-autocomplete'
import { getDefaultExpressionEngine } from '../../engine/expressions/expression-engine'
import type { RenderEngine } from '../../engine/render-engine'

export interface ParameterOption {
  label: string
  value: string
  tooltip?: string
}

export interface ParameterRowProps {
  label: string
  value: number | string | boolean
  tooltip?: string
  mode?: 'fixed' | 'expression'
  min?: number
  max?: number
  step?: number
  type?: 'slider' | 'dropdown' | 'toggle' | 'text'
  options?: ParameterOption[]
  allowExpression?: boolean
  isFocused?: boolean
  onChange: (value: number | string | boolean, mode: 'fixed' | 'expression') => void
  engine?: RenderEngine | null
  savedFormula?: string
}

/**
 * Universal Parameter Row component supporting tactile fixed controls
 * (range sliders, rotary knobs, dropdowns, toggles) and seamless morphing
 * into dynamic mathematical expressions with inline autocomplete and 60 FPS sparkline.
 */
export function ParameterRow({
  label,
  value,
  tooltip,
  mode: explicitMode,
  min = 0,
  max = 1,
  step = 0.01,
  type = 'slider',
  options = [],
  allowExpression = true,
  isFocused = false,
  onChange,
  engine = null,
  savedFormula: propSavedFormula,
}: ParameterRowProps): React.ReactElement {
  const rowRef = useRef<HTMLDivElement>(null)
  const hasExpressionSyntax =
    typeof value === 'string' &&
    (value.includes('$') || value.includes('#') || (value.trim() !== '' && Number.isNaN(Number(value))))
  const [isExpressionMode, setIsExpressionMode] = useState<boolean>(
    explicitMode === 'expression' || hasExpressionSyntax,
  )

  const isExpression =
    allowExpression &&
    (explicitMode === 'expression' ||
      (explicitMode !== 'fixed' && (isExpressionMode || hasExpressionSyntax)))

  // Track if the full f(x) editor window is open/expanded
  const [isExpanded, setIsExpanded] = useState<boolean>(
    explicitMode === 'expression' || isExpressionMode,
  )

  // Track formula in local state to ensure closing f(x) or toggling modes never loses the formula
  const [localFormula, setLocalFormula] = useState<string>(
    propSavedFormula ||
      (typeof value === 'string' &&
      (value.includes('$') || value.includes('#') || Number.isNaN(Number(value)))
        ? value
        : ''),
  )

  const [typedFormula, setTypedFormula] = useState<string | null>(null)
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setTypedFormula(null)
    if (
      typeof value === 'string' &&
      (value.includes('$') || value.includes('#') || Number.isNaN(Number(value)))
    ) {
      setIsExpressionMode(true)
      setLocalFormula(value)
    }
  }

  const effectiveSavedFormula =
    localFormula ||
    propSavedFormula ||
    (typeof value === 'string' &&
    (value.includes('$') || value.includes('#') || Number.isNaN(Number(value)))
      ? value
      : '')

  const activeFormula = typedFormula !== null ? typedFormula : String(value)

  useEffect(() => {
    if (isFocused && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isFocused])
  const inputRef = useRef<HTMLInputElement>(null)
  const exprEngine = getDefaultExpressionEngine()

  // Toggles f(x) editor window open/closed without clearing or wiping the formula
  const handleToggleMode = () => {
    if (!isExpression) {
      // Switch from fixed slider to expression mode and expand window
      setIsExpressionMode(true)
      setIsExpanded(true)
      const formulaToUse =
        effectiveSavedFormula.trim() ||
        (typeof value === 'number' ? String(value) : '1.0')
      setLocalFormula(formulaToUse)
      onChange(formulaToUse, 'expression')
    } else {
      // Toggle f(x) editor window open or closed: NEVER CLEARS THE FORMULA
      setIsExpanded((prev) => !prev)
    }
  }

  // Explicitly resets parameter back to fixed slider mode
  const handleResetToFixed = () => {
    if (activeFormula) {
      setLocalFormula(activeFormula)
    }
    setTypedFormula(null)
    setIsExpressionMode(false)
    setIsExpanded(false)
    const num = Number(value)
    const fallbackVal = !Number.isNaN(num) ? num : (min + max) / 2 || min
    onChange(fallbackVal, 'fixed')
  }

  const handleFormulaChange = (newFormula: string) => {
    setTypedFormula(newFormula)
    setLocalFormula(newFormula)
    onChange(newFormula, 'expression')
  }

  const [isPresetsOpen, setIsPresetsOpen] = useState(false)
  const [isRefOpen, setIsRefOpen] = useState(false)

  const handleInsertToken = (token: string) => {
    const trimmed = activeFormula.trim()
    const newFormula =
      trimmed && trimmed !== '0' && trimmed !== '1' ? `${trimmed} + ${token}` : token
    handleFormulaChange(newFormula)
  }

  const validation = isExpression
    ? exprEngine.validate(activeFormula)
    : { isValid: true, error: undefined }

  return (
    <div
      ref={rowRef}
      data-testid={`parameter-row-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`p-2.5 rounded-xl bg-white/[0.02] border transition-all flex flex-col gap-2 select-none ${
        isFocused
          ? 'border-cyber-cyan ring-2 ring-cyber-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.3)] animate-pulse'
          : 'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <label
          title={tooltip}
          className={`text-xs font-mono text-slate-300 font-semibold tracking-wide flex items-center gap-1.5 ${
            tooltip ? 'cursor-help' : ''
          }`}
        >
          <span>{label}</span>
          {tooltip && (
            <span
              data-testid={`parameter-tooltip-${label.toLowerCase().replace(/\s+/g, '-')}`}
              title={tooltip}
              className="text-slate-500 hover:text-cyber-cyan cursor-help transition-colors"
            >
              <Info className="w-3 h-3" />
            </span>
          )}
        </label>

        <div className="flex items-center gap-1.5">
          {allowExpression && (
            <button
              type="button"
              data-testid={`fx-toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={handleToggleMode}
              title={
                !isExpression
                  ? 'Switch to Dynamic Mathematical Formula f(x)'
                  : isExpanded
                    ? 'Close f(x) Window (Preserves Formula)'
                    : 'Open f(x) Window'
              }
              aria-label={`Toggle f(x) for ${label}`}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isExpression
                  ? 'bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan shadow-sm shadow-cyber-cyan/30'
                  : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>f(x)</span>
              {isExpression &&
                (isExpanded ? (
                  <ChevronUp className="w-3 h-3 text-cyber-cyan" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-cyber-cyan" />
                ))}
            </button>
          )}

          {isExpression && (
            <button
              type="button"
              title="Reset to Fixed Value Slider"
              aria-label={`Reset ${label} to Fixed Slider`}
              onClick={handleResetToFixed}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Control Body */}
      {isExpression ? (
        isExpanded ? (
          <div className="flex flex-col gap-2 relative">
            <div className="relative">
              <ExpressionInput
                id={`formula-input-${label.toLowerCase().replace(/\s+/g, '-')}`}
                label=""
                value={activeFormula}
                onChange={handleFormulaChange}
                isValid={validation.isValid}
                error={validation.error}
                placeholder="e.g. 1.0 + $BASS * 0.8"
              />
              <ExpressionAutocomplete
                value={activeFormula}
                onChange={handleFormulaChange}
                inputRef={inputRef}
              />
            </div>

            {/* 60 FPS Sparkline Telemetry & Live Value Readout */}
            <ExpressionSparkline
              engine={engine}
              expressionEngine={exprEngine}
              formula={activeFormula}
              isValid={validation.isValid}
              isActive={true}
            />

            {/* Example Formula Presets Collapsible Accordion (Closed by default) */}
            <div className="border border-white/10 rounded-lg bg-black/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsPresetsOpen((prev) => !prev)}
                aria-expanded={isPresetsOpen}
                className="w-full flex items-center justify-between p-2 text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-cyber-amber" />
                  <span>Formula Presets</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {isPresetsOpen ? 'Hide' : `${PRESET_FORMULAS.length} presets`}
                  </span>
                  {isPresetsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {isPresetsOpen && (
                <div
                  className="p-2 pt-1 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto"
                  data-testid="formula-presets-list"
                >
                  {PRESET_FORMULAS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleFormulaChange(preset.formula)}
                      className="p-1.5 rounded text-left bg-black/40 border border-white/10 hover:bg-cyber-cyan/10 hover:border-cyber-cyan/40 hover:text-cyber-cyan transition-all group cursor-pointer"
                    >
                      <div className="text-[11px] font-semibold text-slate-200 group-hover:text-cyber-cyan">
                        {preset.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">
                        {preset.formula}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Reference Collapsible Accordion (Closed by default) */}
            <ExpressionQuickReference
              isOpen={isRefOpen}
              onToggle={() => setIsRefOpen((prev) => !prev)}
              onInsertToken={handleInsertToken}
            />

            {/* Close f(x) Editor Window button */}
            <button
              type="button"
              data-testid={`fx-close-button-${label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setIsExpanded(false)}
              className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
            >
              <ChevronUp className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>Close f(x) Window</span>
            </button>
          </div>
        ) : (
          <div
            data-testid={`fx-collapsed-${label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-between p-2 rounded-lg bg-cyber-dark/80 border border-cyber-cyan/30 hover:border-cyber-cyan transition-colors cursor-pointer select-none group"
            title="Click to open f(x) window"
          >
            <div className="flex items-center gap-2 overflow-hidden mr-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan font-bold shrink-0">
                f(x)
              </span>
              <span className="text-xs font-mono text-slate-200 truncate group-hover:text-cyber-cyan transition-colors">
                {activeFormula}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-slate-400 group-hover:text-white transition-colors">
                Edit
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center gap-3">
          {type === 'slider' && (
            <>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={Number(value) || 0}
                onChange={(e) => onChange(parseFloat(e.target.value), 'fixed')}
                aria-label={label}
                title={tooltip || label}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
              />
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={Number(value) || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!Number.isNaN(val)) onChange(val, 'fixed')
                }}
                title={tooltip || label}
                className="w-16 px-2 py-1 rounded bg-black/50 border border-white/10 text-xs font-mono text-cyan-300 text-right focus:outline-none focus:border-cyber-cyan"
              />
            </>
          )}

          {type === 'dropdown' && (
            <select
              value={String(value)}
              onChange={(e) => onChange(e.target.value, 'fixed')}
              aria-label={label}
              title={tooltip || label}
              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyber-cyan cursor-pointer"
            >
              {options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  title={opt.tooltip || opt.label}
                  className="bg-cyber-dark"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {type === 'toggle' && (
            <button
              type="button"
              onClick={() => onChange(!value, 'fixed')}
              aria-label={label}
              title={tooltip || label}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                value
                  ? 'bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {value ? 'ENABLED' : 'DISABLED'}
            </button>
          )}

          {type === 'text' && (
            <input
              type="text"
              value={String(value)}
              onChange={(e) => onChange(e.target.value, 'fixed')}
              aria-label={label}
              title={tooltip || label}
              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyber-cyan"
            />
          )}
        </div>
      )}
    </div>
  )
}
