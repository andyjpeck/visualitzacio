import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  GripHorizontal,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import type { RenderEngine } from '../../engine/render-engine'
import { TestVisualNode } from '../../engine/visual-node'
import { getDefaultExpressionEngine } from '../../engine/expressions/expression-engine'
import { useAppStore } from '../store/app-store'

export interface FormulaTestbedProps {
  engine: RenderEngine | null
}

interface FormulaPreset {
  name: string
  formula: string
  description: string
}

const PRESET_FORMULAS: FormulaPreset[] = [
  {
    name: 'Bass Pulsar',
    formula: '1.0 + $BASS * 0.8',
    description: 'Expands crystal scale proportionally with low-frequency energy',
  },
  {
    name: 'Beat Shockwave',
    formula: '#BEAT(0.2) * 2.0',
    description: 'Instant transient punch on beats with exponential decay',
  },
  {
    name: 'Harmonic Sine',
    formula: 'sin($TIME * 2.0) * 0.5 + 1.0',
    description: 'Smooth periodic sine wave modulation over elapsed time',
  },
  {
    name: 'Triangle LFO',
    formula: '#TRI($TIME * 0.5) * 0.8 + 1.0',
    description: 'Linear ramp-up and ramp-down periodic oscillation',
  },
  {
    name: 'Sub-Bass Slice',
    formula: '#FFT(0.02, 0.04) * 2.5',
    description: 'Direct narrow FFT band sampling of sub-bass frequencies',
  },
  {
    name: 'Linear Beat Fade',
    formula: '#BEAT_FRAMES(16, "linear") * 1.5',
    description: 'Mechanical linear frame-counter decay over 16 frames',
  },
]

interface QuickRefItem {
  name: string
  insertText: string
  tooltip: string
}

const QUICK_REF_VARS: QuickRefItem[] = [
  {
    name: '$BASS',
    insertText: '$BASS',
    tooltip: '$BASS: Audio bass energy [0.0 - 1.0] with exponential decay smoothing',
  },
  {
    name: '$MID',
    insertText: '$MID',
    tooltip: '$MID: Audio midrange energy [0.0 - 1.0] for lead and vocal presence',
  },
  {
    name: '$TREBLE',
    insertText: '$TREBLE',
    tooltip: '$TREBLE: Audio treble energy [0.0 - 1.0] for high-frequency transients and percussion',
  },
  {
    name: '$RMS',
    insertText: '$RMS',
    tooltip: '$RMS: Root Mean Square overall audio amplitude energy [0.0 - 1.0]',
  },
  {
    name: '$BEAT',
    insertText: '$BEAT',
    tooltip: '$BEAT: Beat trigger pulse flag (1.0 on beat frame onset, 0.0 otherwise)',
  },
  {
    name: '$BPM',
    insertText: '$BPM',
    tooltip: '$BPM: Estimated musical tempo in beats per minute (e.g. 120.0)',
  },
  {
    name: '$TIME',
    insertText: '$TIME',
    tooltip: '$TIME: Total elapsed visualization playback time in seconds',
  },
  {
    name: '$DT',
    insertText: '$DT',
    tooltip: '$DT: Delta time between consecutive render frames in seconds (~0.016s at 60 FPS)',
  },
  {
    name: '$FRAME',
    insertText: '$FRAME',
    tooltip: '$FRAME: Monotonic frame counter index',
  },
  {
    name: '$FPS',
    insertText: '$FPS',
    tooltip: '$FPS: Current measured rendering framerate (e.g. 60.0)',
  },
  {
    name: '$WIDTH',
    insertText: '$WIDTH',
    tooltip: '$WIDTH: Viewport canvas width in pixels',
  },
  {
    name: '$HEIGHT',
    insertText: '$HEIGHT',
    tooltip: '$HEIGHT: Viewport canvas height in pixels',
  },
  {
    name: '$ASPECT',
    insertText: '$ASPECT',
    tooltip: '$ASPECT: Viewport aspect ratio ($WIDTH / $HEIGHT)',
  },
  {
    name: '$PIXEL_RATIO',
    insertText: '$PIXEL_RATIO',
    tooltip: '$PIXEL_RATIO: Device pixel ratio (DPR)',
  },
]

const QUICK_REF_FUNCS: QuickRefItem[] = [
  {
    name: '#BEAT(decay)',
    insertText: '#BEAT(0.2)',
    tooltip: '#BEAT([decay_seconds = 0.2]): Exponential decay pulse [1.0 -> 0.0] following beat onset',
  },
  {
    name: '#BEAT_FRAMES(f, curve)',
    insertText: '#BEAT_FRAMES(12, "exponential")',
    tooltip: '#BEAT_FRAMES([frames = 12], [curve = "exponential"|"linear"|"logarithmic"]): Frame-based decay envelope',
  },
  {
    name: '#FFT(band, width)',
    insertText: '#FFT(0.02, 0.04)',
    tooltip: '#FFT(lower_band, [band_width = 0.02]): Normalized frequency slice [0.0 - 1.0] from FFT spectrum',
  },
  {
    name: '#WAVEFORM(pos)',
    insertText: '#WAVEFORM(0.5)',
    tooltip: '#WAVEFORM(position): Oscilloscope audio waveform sample [-1.0 to 1.0] at normalized position [0.0 - 1.0]',
  },
  {
    name: '#TRI(t)',
    insertText: '#TRI($TIME)',
    tooltip: '#TRI(t): Normalized periodic triangle wave [-1.0 to 1.0] with period 1.0',
  },
  {
    name: '#SAW(t)',
    insertText: '#SAW($TIME)',
    tooltip: '#SAW(t): Normalized periodic sawtooth wave [-1.0 to 1.0] with period 1.0',
  },
  {
    name: '#SQR(t)',
    insertText: '#SQR($TIME)',
    tooltip: '#SQR(t): Normalized periodic square wave [-1.0 or 1.0] with period 1.0',
  },
  {
    name: 'clamp(x, min, max)',
    insertText: 'clamp($BASS, 0.2, 1.0)',
    tooltip: 'clamp(x, min, max): Restricts x to the range [min, max]',
  },
  {
    name: 'lerp(a, b, t)',
    insertText: 'lerp(1.0, 2.0, $BASS)',
    tooltip: 'lerp(a, b, t): Linear interpolation between a and b by factor t (a + (b - a) * t)',
  },
  {
    name: 'smoothstep(e0, e1, x)',
    insertText: 'smoothstep(0.2, 0.8, $RMS)',
    tooltip: 'smoothstep(edge0, edge1, x): Smooth Hermite interpolation between 0 and 1',
  },
]

export function FormulaTestbed({ engine }: FormulaTestbedProps): React.ReactElement | null {
  const isOpen = useAppStore((state) => state.isFormulaTestbedOpen)
  const setIsOpen = useAppStore((state) => state.setIsFormulaTestbedOpen)
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

  const dialogRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const defaultWidth = 576
    const defaultHeight = 600
    const x = typeof window !== 'undefined' ? Math.max(16, Math.floor((window.innerWidth - defaultWidth) / 2)) : 100
    const y = typeof window !== 'undefined' ? Math.max(70, Math.floor((window.innerHeight - defaultHeight) / 2)) : 100
    return { x, y }
  })

  const valueDisplayRef = useRef<HTMLDivElement>(null)
  const chartCanvasRef = useRef<HTMLCanvasElement>(null)
  const chartPeakRef = useRef<HTMLSpanElement>(null)
  const historyRef = useRef<number[]>(new Array(180).fill(0))

  const expressionEngine = useMemo(() => getDefaultExpressionEngine(), [])

  // Validation
  const validation = useMemo(() => {
    return expressionEngine.validate(activeFormula)
  }, [activeFormula, expressionEngine])

  // Sync formula with 3D scene node
  useEffect(() => {
    if (!engine) return
    const nodes = engine.getNodes()
    for (const node of nodes) {
      if (node instanceof TestVisualNode) {
        if (bindFormulaToScene && validation.isValid) {
          node.setScaleExpression(activeFormula, expressionEngine)
        } else {
          node.setScaleExpression(null)
        }
      }
    }
  }, [engine, activeFormula, bindFormulaToScene, validation.isValid, expressionEngine])

  // Cleanup scene binding when unmounting
  useEffect(() => {
    return () => {
      if (!engine) return
      const nodes = engine.getNodes()
      for (const node of nodes) {
        if (node instanceof TestVisualNode) {
          node.setScaleExpression(null)
        }
      }
    }
  }, [engine])

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen])

  // Keep position clamped within viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      const dialogWidth = dialogRef.current?.offsetWidth || 576
      const dialogHeight = dialogRef.current?.offsetHeight || 500
      const maxX = Math.max(0, window.innerWidth - dialogWidth)
      const maxY = Math.max(0, window.innerHeight - dialogHeight)
      setPosition((prev) => ({
        x: Math.min(maxX, Math.max(0, prev.x)),
        y: Math.min(maxY, Math.max(0, prev.y)),
      }))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Pointer drag event handlers for repositioning window
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) return

    if (typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    const deltaX = e.clientX - dragStartRef.current.mouseX
    const deltaY = e.clientY - dragStartRef.current.mouseY

    const dialogWidth = dialogRef.current?.offsetWidth || 576
    const dialogHeight = dialogRef.current?.offsetHeight || 500
    const maxX = Math.max(0, window.innerWidth - dialogWidth)
    const maxY = Math.max(0, window.innerHeight - dialogHeight)

    const newX = Math.min(maxX, Math.max(0, dragStartRef.current.startX + deltaX))
    const newY = Math.min(maxY, Math.max(0, dragStartRef.current.startY + deltaY))

    setPosition({ x: newX, y: newY })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current) {
      if (typeof e.currentTarget.releasePointerCapture === 'function') {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          // ignore
        }
      }
      dragStartRef.current = null
      setIsDragging(false)
    }
  }

  // 60 FPS live readout loop updating DOM and Canvas chart directly without React re-renders
  useEffect(() => {
    if (!isOpen || !engine) return

    let rafId: number
    const tick = () => {
      const ctx = engine.getFrameContext()
      let evaluated = 0.0

      if (valueDisplayRef.current) {
        if (validation.isValid) {
          evaluated = expressionEngine.evaluate(activeFormula, ctx, 0.0)
          valueDisplayRef.current.textContent = evaluated.toFixed(3)
        } else {
          valueDisplayRef.current.textContent = '---'
        }
      }

      const history = historyRef.current
      history.push(evaluated)
      if (history.length > 180) {
        history.shift()
      }

      const canvas = chartCanvasRef.current
      if (canvas && typeof canvas.getContext === 'function') {
        const ctx2d = canvas.getContext('2d')
        if (ctx2d) {
          const w = canvas.width
          const h = canvas.height

          ctx2d.clearRect(0, 0, w, h)

          // Calculate dynamic min/max over the sliding window
          let maxVal = -Infinity
          let minVal = Infinity
          for (let i = 0; i < history.length; i++) {
            const v = history[i]
            if (v > maxVal) maxVal = v
            if (v < minVal) minVal = v
          }

          if (maxVal === -Infinity || minVal === Infinity) {
            maxVal = 1.0
            minVal = 0.0
          }
          if (maxVal <= minVal) {
            maxVal = minVal + 1.0
          }

          if (chartPeakRef.current) {
            chartPeakRef.current.textContent = `max: ${maxVal.toFixed(2)}`
          }

          const span = maxVal - minVal
          const paddedMax = maxVal + span * 0.1
          const paddedMin = minVal - span * 0.1
          const paddedRange = paddedMax - paddedMin || 1.0

          // Subtle horizontal center grid line
          ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.08)'
          ctx2d.lineWidth = 1
          ctx2d.beginPath()
          ctx2d.moveTo(0, h / 2)
          ctx2d.lineTo(w, h / 2)
          ctx2d.stroke()

          // Plot line
          ctx2d.beginPath()
          const len = history.length
          for (let i = 0; i < len; i++) {
            const x = (i / (len - 1)) * w
            const norm = (history[i] - paddedMin) / paddedRange
            const y = Math.max(1, Math.min(h - 1, h - norm * h))
            if (i === 0) {
              ctx2d.moveTo(x, y)
            } else {
              ctx2d.lineTo(x, y)
            }
          }

          ctx2d.strokeStyle = '#00f0ff'
          ctx2d.lineWidth = 1.5
          ctx2d.stroke()

          // Gradient fill under curve
          ctx2d.lineTo(w, h)
          ctx2d.lineTo(0, h)
          ctx2d.closePath()
          const grad = ctx2d.createLinearGradient(0, 0, 0, h)
          grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)')
          grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)')
          ctx2d.fillStyle = grad
          ctx2d.fill()
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isOpen, engine, activeFormula, validation.isValid, expressionEngine])

  if (!isOpen) return null

  return (
    <div
      ref={dialogRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="fixed z-50 w-[92vw] max-w-xl max-h-[85vh] flex flex-col p-6 rounded-xl border border-cyber-cyan/40 bg-cyber-panel/95 backdrop-blur-md text-slate-100 shadow-2xl shadow-cyber-cyan/20 animate-in fade-in"
      role="dialog"
      aria-modal="false"
      aria-labelledby="formula-testbed-title"
    >
      {/* Header (Draggable Handle) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Drag to move dialog around screen"
        className={`flex items-center justify-between pb-4 border-b border-white/10 shrink-0 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        data-testid="formula-dialog-header"
      >
        <div className="flex items-center gap-2 text-cyber-cyan pointer-events-none">
          <GripHorizontal className="w-5 h-5 text-slate-400" />
          <Code2 className="w-5 h-5" />
          <h2 id="formula-testbed-title" className="text-base font-bold tracking-wide">
            Dynamic Expression Testbed <span className="font-mono text-xs opacity-75">f(x)</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
          aria-label="Close formula testbed"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Scrollable Body */}
        <div className="mt-5 space-y-5 overflow-y-auto pr-1">
          {/* Formula Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="formula-input" className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                Formula Expression
              </label>
              {validation.isValid ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Syntax Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-mono text-cyber-crimson">
                  <XCircle className="w-3.5 h-3.5" />
                  Syntax Error
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="formula-input"
                type="text"
                value={activeFormula}
                onChange={(e) => setActiveFormula(e.target.value)}
                placeholder="e.g. 1.0 + $BASS * 0.8 + #BEAT(0.2) * 0.5"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-black/60 border font-mono text-sm text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                  validation.isValid
                    ? 'border-white/15 focus:border-cyber-cyan focus:ring-cyber-cyan'
                    : 'border-cyber-crimson/60 focus:border-cyber-crimson focus:ring-cyber-crimson'
                }`}
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            {!validation.isValid && validation.error && (
              <p className="mt-1.5 text-xs font-mono text-cyber-crimson leading-tight">
                {validation.error}
              </p>
            )}
          </div>

          {/* 60 FPS Real-time Evaluation Meter */}
          <div className="p-4 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Real-Time Value (60 FPS)
              </span>
              <div
                ref={valueDisplayRef}
                className="font-mono text-2xl font-bold text-cyber-cyan tracking-wider mt-0.5"
                data-testid="formula-evaluated-value"
              >
                0.000
              </div>
            </div>

            {/* Real-time Line Chart Canvas */}
            <div className="flex flex-col items-end">
              <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400 mb-1">
                <span className="text-slate-500 uppercase tracking-wider text-[8px]">Real-Time Plot</span>
                <span
                  ref={chartPeakRef}
                  data-testid="formula-chart-peak"
                  className="text-cyber-cyan font-semibold tabular-nums text-[9px]"
                >
                  max: 0.00
                </span>
              </div>
              <canvas
                ref={chartCanvasRef}
                data-testid="formula-line-chart"
                width={220}
                height={48}
                className="w-44 sm:w-52 h-11 sm:h-12 rounded bg-black/60 border border-white/10 shadow-inner"
              />
            </div>
          </div>

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

          {/* Quick Reference (Collapsible with Tooltips) - Moved above Example Formulas */}
          <div className="border border-white/10 rounded-lg bg-white/5 overflow-hidden">
            <button
              type="button"
              onClick={toggleFormulaReference}
              className="w-full flex items-center justify-between p-2.5 text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer select-none"
              aria-expanded={isFormulaReferenceOpen}
              aria-controls="formula-reference-panel"
              data-testid="toggle-formula-reference"
            >
              <div className="flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                <BookOpen className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Quick Reference</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[10px] text-slate-500 font-mono">
                  {isFormulaReferenceOpen ? 'Hide' : 'Vars & Funcs'}
                </span>
                {isFormulaReferenceOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {isFormulaReferenceOpen && (
              <div
                id="formula-reference-panel"
                className="p-3 pt-1 border-t border-white/5 text-[11px] font-mono space-y-2.5 text-slate-400"
                data-testid="formula-reference-panel"
              >
                <div>
                  <div className="text-[10px] font-bold text-cyber-cyan uppercase tracking-wider mb-1.5">
                    System Variables ($VARS) — Hover for details
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REF_VARS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        title={item.tooltip}
                        onClick={() => handleInsertToken(item.insertText)}
                        className="px-2 py-0.5 rounded bg-black/40 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 hover:border-cyber-cyan cursor-help transition-all text-[11px] font-mono"
                        data-testid={`var-item-${item.name.replace('$', '')}`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-cyber-magenta uppercase tracking-wider mb-1.5">
                    System & Math Functions (#FUNCS) — Hover for details
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REF_FUNCS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        title={item.tooltip}
                        onClick={() => handleInsertToken(item.insertText)}
                        className="px-2 py-0.5 rounded bg-black/40 border border-cyber-magenta/30 text-cyber-magenta hover:bg-cyber-magenta/20 hover:border-cyber-magenta cursor-help transition-all text-[11px] font-mono"
                        data-testid={`func-item-${item.name.replace(/[^a-zA-Z0-9]/g, '')}`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

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
      </div>
  )
}
