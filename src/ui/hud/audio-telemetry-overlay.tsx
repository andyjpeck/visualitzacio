import React, { useEffect, useRef } from 'react'
import type { RenderEngine } from '../../engine/render-engine'
import { useAppStore } from '../store/app-store'

export interface AudioTelemetryOverlayProps {
  engine: RenderEngine | null
}

/**
 * 60 FPS floating heads-up display showing real-time audio DSP frequency bands
 * ($BASS, $MID, $TREBLE, $RMS, $BEAT, $BPM, $TIME, $FRAME) without React re-renders.
 */
export function AudioTelemetryOverlay({
  engine,
}: AudioTelemetryOverlayProps): React.ReactElement | null {
  const showDebugData = useAppStore(
    (state) => state.showDebugData ?? state.showFpsOverlay,
  )
  const bassBarRef = useRef<HTMLDivElement>(null)
  const midBarRef = useRef<HTMLDivElement>(null)
  const trebleBarRef = useRef<HTMLDivElement>(null)
  const rmsBarRef = useRef<HTMLDivElement>(null)
  const beatPillRef = useRef<HTMLSpanElement>(null)
  const bpmRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!engine || !showDebugData) return

    let rafId: number
    const updateDOM = () => {
      const ctx = engine.getFrameContext()

      if (bassBarRef.current) {
        bassBarRef.current.style.width = `${Math.min(100, Math.max(0, ctx.$BASS * 100))}%`
      }
      if (midBarRef.current) {
        midBarRef.current.style.width = `${Math.min(100, Math.max(0, ctx.$MID * 100))}%`
      }
      if (trebleBarRef.current) {
        trebleBarRef.current.style.width = `${Math.min(100, Math.max(0, ctx.$TREBLE * 100))}%`
      }
      if (rmsBarRef.current) {
        rmsBarRef.current.style.width = `${Math.min(100, Math.max(0, ctx.$RMS * 100))}%`
      }
      if (beatPillRef.current) {
        if (ctx.$BEAT > 0) {
          beatPillRef.current.className =
            'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-amber text-black shadow-lg shadow-cyber-amber/50 animate-pulse'
        } else {
          beatPillRef.current.className =
            'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-400'
        }
      }
      if (bpmRef.current) {
        bpmRef.current.textContent = `${ctx.$BPM.toFixed(1)} BPM`
      }
      if (timeRef.current) {
        timeRef.current.textContent = `${ctx.$TIME.toFixed(1)}s`
      }
      if (frameRef.current) {
        frameRef.current.textContent = String(ctx.$FRAME)
      }
    }

    const loop = () => {
      updateDOM()
      rafId = requestAnimationFrame(loop)
    }

    // Initial sync and start 60 FPS animation loop
    loop()

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [engine, showDebugData])

  if (!showDebugData) return null

  return (
    <div
      data-testid="audio-telemetry-overlay"
      className="absolute bottom-4 left-4 z-40 p-3 rounded-lg backdrop-blur-md bg-cyber-void/85 border border-white/10 shadow-xl space-y-2 select-none w-64 pointer-events-none"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className="font-mono text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Audio DSP Telemetry
        </span>
        <div className="flex items-center gap-2">
          <span
            ref={bpmRef}
            data-testid="telemetry-bpm"
            className="font-mono text-[10px] text-cyber-cyan font-bold"
          >
            120.0 BPM
          </span>
          <span
            ref={beatPillRef}
            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-400"
          >
            BEAT
          </span>
        </div>
      </div>

      {/* Meter Bars */}
      <div className="space-y-1 font-mono text-[10px]">
        {/* BASS */}
        <div className="flex items-center gap-2">
          <span className="w-8 text-slate-400 font-bold">BASS</span>
          <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
            <div
              ref={bassBarRef}
              className="h-full bg-cyber-cyan shadow-sm shadow-cyber-cyan/50"
              style={{ width: '0%' }}
            />
          </div>
        </div>

        {/* MID */}
        <div className="flex items-center gap-2">
          <span className="w-8 text-slate-400 font-bold">MID</span>
          <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
            <div
              ref={midBarRef}
              className="h-full bg-cyber-magenta shadow-sm shadow-cyber-magenta/50"
              style={{ width: '0%' }}
            />
          </div>
        </div>

        {/* TREBLE */}
        <div className="flex items-center gap-2">
          <span className="w-8 text-slate-400 font-bold">TREB</span>
          <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
            <div
              ref={trebleBarRef}
              className="h-full bg-cyber-amber shadow-sm shadow-cyber-amber/50"
              style={{ width: '0%' }}
            />
          </div>
        </div>

        {/* RMS */}
        <div className="flex items-center gap-2">
          <span className="w-8 text-slate-400 font-bold">RMS</span>
          <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
            <div
              ref={rmsBarRef}
              className="h-full bg-emerald-400 shadow-sm shadow-emerald-400/50"
              style={{ width: '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Telemetry Ticker: $TIME & $FRAME */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/10 font-mono text-[9px]">
        <div className="flex items-center gap-1">
          <span className="text-slate-500 uppercase font-semibold">$TIME:</span>
          <span
            ref={timeRef}
            data-testid="telemetry-time"
            className="text-slate-200 font-bold tabular-nums"
          >
            0.0s
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500 uppercase font-semibold">$FRAME:</span>
          <span
            ref={frameRef}
            data-testid="telemetry-frame"
            className="text-slate-200 font-bold tabular-nums"
          >
            0
          </span>
        </div>
      </div>
    </div>
  )
}
