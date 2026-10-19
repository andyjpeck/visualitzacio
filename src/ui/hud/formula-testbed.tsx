import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Code2, GripHorizontal, Sparkles, X, XCircle } from 'lucide-react'
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

export function FormulaTestbed({ engine }: FormulaTestbedProps): React.ReactElement | null {
  const isOpen = useAppStore((state) => state.isFormulaTestbedOpen)
  const setIsOpen = useAppStore((state) => state.setIsFormulaTestbedOpen)
  const activeFormula = useAppStore((state) => state.activeFormula)
  const setActiveFormula = useAppStore((state) => state.setActiveFormula)
  const bindFormulaToScene = useAppStore((state) => state.bindFormulaToScene)
  const setBindFormulaToScene = useAppStore((state) => state.setBindFormulaToScene)

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
  const bassValRef = useRef<HTMLSpanElement>(null)
  const beatValRef = useRef<HTMLSpanElement>(null)
  const timeValRef = useRef<HTMLSpanElement>(null)

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

  // 60 FPS live readout loop updating DOM directly without React re-renders
  useEffect(() => {
    if (!isOpen || !engine) return

    let rafId: number
    const tick = () => {
      const ctx = engine.getFrameContext()

      if (valueDisplayRef.current) {
        if (validation.isValid) {
          const evaluated = expressionEngine.evaluate(activeFormula, ctx, 0.0)
          valueDisplayRef.current.textContent = evaluated.toFixed(3)
        } else {
          valueDisplayRef.current.textContent = '---'
        }
      }

      if (bassValRef.current) {
        bassValRef.current.textContent = ctx.$BASS.toFixed(2)
      }
      if (beatValRef.current) {
        beatValRef.current.textContent = ctx.$BEAT > 0 ? 'BEAT' : '0'
        beatValRef.current.className =
          ctx.$BEAT > 0
            ? 'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-amber text-black'
            : 'px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-400'
      }
      if (timeValRef.current) {
        timeValRef.current.textContent = ctx.$TIME.toFixed(1) + 's'
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

            {/* Telemetry Snapshot Ticker */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="block text-[9px] font-mono text-slate-500 uppercase">$BASS</span>
                <span ref={bassValRef} className="font-mono text-xs text-cyber-cyan font-bold">
                  0.00
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-mono text-slate-500 uppercase">$BEAT</span>
                <span ref={beatValRef} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-400">
                  0
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-mono text-slate-500 uppercase">$TIME</span>
                <span ref={timeValRef} className="font-mono text-xs text-slate-300">
                  0.0s
                </span>
              </div>
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

          {/* Preset Formulas */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyber-amber" />
              <span>Example Formula Presets</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_FORMULAS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setActiveFormula(preset.formula)}
                  className="p-2.5 rounded-lg text-left bg-white/5 border border-white/10 hover:bg-cyber-cyan/10 hover:border-cyber-cyan/40 hover:text-cyber-cyan transition-all group"
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
          </div>

          {/* Reference Cheat Sheet */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono space-y-1 text-slate-400">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
              Quick Reference
            </div>
            <div>
              <span className="text-cyber-cyan">$VARS:</span> $BASS, $MID, $TREBLE, $RMS, $BEAT, $BPM, $TIME, $FRAME, $WIDTH, $HEIGHT, $ASPECT
            </div>
            <div>
              <span className="text-cyber-magenta">#FUNCS:</span> #BEAT(decay), #BEAT_FRAMES(frames, curve), #FFT(band, width), #WAVEFORM(pos), #TRI(t), #SAW(t), #SQR(t), clamp(), lerp(), smoothstep()
            </div>
          </div>
        </div>
      </div>
  )
}
