import React, { useEffect, useRef } from 'react'
import type { RenderEngine } from '../../engine/render-engine'
import type { ExpressionEngine } from '../../engine/expressions/expression-engine'

export interface ExpressionSparklineProps {
  engine: RenderEngine | null
  expressionEngine: ExpressionEngine
  formula: string
  isValid: boolean
  isActive: boolean
  /** Optional ref to inspect active history buffer length for testing/memory auditing */
  historyLengthRef?: React.MutableRefObject<number>
}

/**
 * 60 FPS numeric readout + sliding-window sparkline canvas component.
 * Direct DOM updates avoid React re-rendering, and history memory is automatically
 * freed when isActive becomes false or the formula changes.
 */
export function ExpressionSparkline({
  engine,
  expressionEngine,
  formula,
  isValid,
  isActive,
  historyLengthRef,
}: ExpressionSparklineProps): React.ReactElement {
  const valueDisplayRef = useRef<HTMLDivElement>(null)
  const chartCanvasRef = useRef<HTMLCanvasElement>(null)
  const chartMinRef = useRef<HTMLSpanElement>(null)
  const chartPeakRef = useRef<HTMLSpanElement>(null)
  const historyRef = useRef<number[]>([])

  useEffect(() => {
    if (!isActive || !engine) {
      historyRef.current = []
      if (historyLengthRef) historyLengthRef.current = 0
      return
    }

    historyRef.current = []
    if (historyLengthRef) historyLengthRef.current = 0

    let rafId: number
    const tick = () => {
      const ctx = engine.getFrameContext()
      let evaluated = 0.0

      if (valueDisplayRef.current) {
        if (isValid) {
          evaluated = expressionEngine.evaluate(formula, ctx, 0.0)
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
      if (historyLengthRef) {
        historyLengthRef.current = history.length
      }

      const canvas = chartCanvasRef.current
      if (canvas && typeof canvas.getContext === 'function') {
        let ctx2d: CanvasRenderingContext2D | null = null
        try {
          ctx2d = canvas.getContext('2d')
        } catch {
          ctx2d = null
        }
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

          if (chartMinRef.current) {
            chartMinRef.current.textContent = `min: ${minVal.toFixed(2)}`
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
          if (len === 1) {
            const norm = (history[0] - paddedMin) / paddedRange
            const y = Math.max(1, Math.min(h - 1, h - norm * h))
            ctx2d.moveTo(0, y)
            ctx2d.lineTo(w, y)
          } else {
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
    return () => {
      cancelAnimationFrame(rafId)
      historyRef.current = []
      if (historyLengthRef) historyLengthRef.current = 0
    }
  }, [isActive, engine, formula, isValid, expressionEngine, historyLengthRef])

  return (
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
          <div className="flex items-center gap-2">
            <span
              ref={chartMinRef}
              data-testid="formula-chart-min"
              className="text-slate-400 tabular-nums text-[9px]"
            >
              min: 0.00
            </span>
            <span
              ref={chartPeakRef}
              data-testid="formula-chart-peak"
              className="text-cyber-cyan font-semibold tabular-nums text-[9px]"
            >
              max: 0.00
            </span>
          </div>
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
  )
}
