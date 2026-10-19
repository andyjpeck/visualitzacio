import React, { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import type { AudioManager } from '../../audio/audio-manager'

/**
 * Formats a duration in seconds to standard MM:SS display format.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted time string, e.g. "2:05" or "0:00"
 */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export interface AudioProgressScrubberProps {
  audioManager: AudioManager | null
  sourceType: string
  audioFileName: string | null
  isPlaying: boolean
  isAudioLoading: boolean
  audioLoadingProgress: number
  audioLoadingStage: string | null
}

/**
 * Renders the audio file loading progress indicator or the interactive
 * seek progress bar with direct-DOM 60 FPS timestamp updates.
 */
export function AudioProgressScrubber({
  audioManager,
  sourceType,
  audioFileName,
  isPlaying,
  isAudioLoading,
  audioLoadingProgress,
  audioLoadingStage,
}: AudioProgressScrubberProps): React.ReactElement | null {
  const progressSliderRef = useRef<HTMLInputElement>(null)
  const currentTimeRef = useRef<HTMLSpanElement>(null)
  const durationTimeRef = useRef<HTMLSpanElement>(null)
  const isDraggingRef = useRef<boolean>(false)

  // Continuous 60 FPS track progress loop without React re-renders
  useEffect(() => {
    if (sourceType !== 'file' || !audioManager) return

    let rafId: number
    const updateProgress = () => {
      if (!isDraggingRef.current && audioManager.hasCustomFile()) {
        const cur = audioManager.getCurrentTime()
        const dur = audioManager.getDuration()

        if (progressSliderRef.current) {
          progressSliderRef.current.max = String(dur || 100)
          progressSliderRef.current.value = String(cur)
        }
        if (currentTimeRef.current) {
          currentTimeRef.current.textContent = formatTime(cur)
        }
        if (durationTimeRef.current) {
          durationTimeRef.current.textContent = formatTime(dur)
        }
      }
      rafId = requestAnimationFrame(updateProgress)
    }

    rafId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(rafId)
  }, [sourceType, audioManager, isPlaying, audioFileName])

  // Audio File Loading Indicator with Progress Bar
  if (isAudioLoading) {
    return (
      <div
        data-testid="audio-loading-indicator"
        role="progressbar"
        aria-valuenow={audioLoadingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex items-center gap-2 px-2.5 py-1 bg-black/60 rounded-lg border border-cyber-amber/40 text-xs font-mono shadow-md shadow-cyber-amber/10 animate-in fade-in"
      >
        <Loader2 className="w-3.5 h-3.5 text-cyber-amber animate-spin shrink-0" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2 text-[10px] leading-tight">
            <span className="text-slate-300 font-medium truncate max-w-[120px]">
              {audioLoadingStage || 'Loading audio...'}
            </span>
            <span className="text-cyber-amber font-bold tabular-nums">
              {audioLoadingProgress}%
            </span>
          </div>
          <div className="w-24 sm:w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyber-amber to-amber-300 transition-all duration-150 rounded-full"
              style={{ width: `${audioLoadingProgress}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Progress & Seek Bar (Visible when audio file is loaded/active and not currently loading)
  if (sourceType === 'file' && audioFileName) {
    return (
      <div
        data-testid="audio-progress-bar"
        className="flex items-center gap-2 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-xs font-mono"
      >
        <span
          ref={currentTimeRef}
          data-testid="audio-current-time"
          className="text-slate-400 min-w-[28px] text-right tabular-nums text-[11px]"
        >
          0:00
        </span>
        <input
          ref={progressSliderRef}
          type="range"
          min="0"
          max="100"
          step="0.1"
          defaultValue="0"
          aria-label="Track progress slider"
          onPointerDown={() => {
            isDraggingRef.current = true
          }}
          onPointerUp={(e) => {
            isDraggingRef.current = false
            const targetVal = parseFloat((e.target as HTMLInputElement).value)
            audioManager?.seek(targetVal)
          }}
          onChange={(e) => {
            const targetVal = parseFloat(e.target.value)
            if (currentTimeRef.current) {
              currentTimeRef.current.textContent = formatTime(targetVal)
            }
            audioManager?.seek(targetVal)
          }}
          onInput={(e) => {
            const targetVal = parseFloat((e.target as HTMLInputElement).value)
            if (currentTimeRef.current) {
              currentTimeRef.current.textContent = formatTime(targetVal)
            }
          }}
          className="w-24 sm:w-36 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyber-amber"
        />
        <span
          ref={durationTimeRef}
          data-testid="audio-duration-time"
          className="text-slate-400 min-w-[28px] tabular-nums text-[11px]"
        >
          0:00
        </span>
      </div>
    )
  }

  return null
}
