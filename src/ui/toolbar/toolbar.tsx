import React, { useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  Mic,
  Disc,
  FileAudio,
  Volume2,
  VolumeX,
  Activity,
  Settings,
  AlertCircle,
  X,
} from 'lucide-react'
import { useAppStore } from '../store/app-store'
import type { AudioManager } from '../../audio/audio-manager'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export interface ToolbarProps {
  audioManager: AudioManager | null
}

export function Toolbar({ audioManager }: ToolbarProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressSliderRef = useRef<HTMLInputElement>(null)
  const currentTimeRef = useRef<HTMLSpanElement>(null)
  const durationTimeRef = useRef<HTMLSpanElement>(null)
  const isDraggingRef = useRef<boolean>(false)

  const isPlaying = useAppStore((state) => state.isPlaying)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const sourceType = useAppStore((state) => state.sourceType)
  const setSourceType = useAppStore((state) => state.setSourceType)
  const audioFileName = useAppStore((state) => state.audioFileName)
  const setAudioFileName = useAppStore((state) => state.setAudioFileName)
  const volume = useAppStore((state) => state.volume)
  const setVolume = useAppStore((state) => state.setVolume)
  const audioError = useAppStore((state) => state.audioError)
  const setAudioError = useAppStore((state) => state.setAudioError)
  const showFpsOverlay = useAppStore((state) => state.showFpsOverlay)
  const toggleFpsOverlay = useAppStore((state) => state.toggleFpsOverlay)
  const togglePresetSettings = useAppStore(
    (state) => state.togglePresetSettings,
  )
  const isFormulaTestbedOpen = useAppStore((state) => state.isFormulaTestbedOpen)
  const toggleFormulaTestbed = useAppStore((state) => state.toggleFormulaTestbed)

  const isMicActive = sourceType === 'mic'

  const handlePlayPause = async () => {
    if (!audioManager || isMicActive) return

    if (isPlaying) {
      if (sourceType === 'file') {
        audioManager.pauseCustomFile()
      } else {
        audioManager.pauseSample()
      }
      setIsPlaying(false)
    } else {
      if (sourceType === 'file') {
        if (!audioManager.hasCustomFile()) {
          fileInputRef.current?.click()
          return
        }
        await audioManager.playCustomFile()
        setIsPlaying(true)
      } else {
        await audioManager.playSample()
        setIsPlaying(true)
      }
    }
  }

  const handleSelectSample = () => {
    if (!audioManager) return
    audioManager.disableMicrophone()
    if (sourceType === 'file') {
      audioManager.pauseCustomFile()
    }
    setIsPlaying(false)
    setSourceType('sample')
    setAudioError(null)
  }

  const handleSelectMic = async () => {
    if (!audioManager) return
    // Stop any playing audio immediately
    audioManager.pauseSample()
    audioManager.pauseCustomFile()
    setIsPlaying(false)
    setSourceType('mic')
    setAudioError(null)

    const ok = await audioManager.enableMicrophone()
    if (ok) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
      setAudioError(
        audioManager.getLastError() || 'Microphone permission denied',
      )
    }
  }

  const handleSelectFile = () => {
    if (!audioManager) return
    audioManager.disableMicrophone()
    audioManager.pauseSample()
    setIsPlaying(false)

    // If clicking File again or if no file is loaded, open file picker
    if (sourceType === 'file' || !audioManager.hasCustomFile()) {
      fileInputRef.current?.click()
    }

    setSourceType('file')
    setAudioError(null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !audioManager) return

    try {
      setSourceType('file')
      audioManager.disableMicrophone()
      audioManager.pauseSample()
      audioManager.pauseCustomFile()
      setIsPlaying(false)

      const name = await audioManager.loadAudioFile(file)
      setAudioFileName(name)
      setAudioError(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setAudioError(`Failed to decode audio file: ${msg}`)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (audioManager) {
      audioManager.setVolume(val)
    }
  }

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

  return (
    <>
      {/* Hidden Audio File Input */}
      <input
        ref={fileInputRef}
        type="file"
        data-testid="audio-file-input"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Floating Glassmorphic Toolbar */}
      <header className="fixed top-4 right-4 z-40 flex items-center gap-2 p-1.5 rounded-xl backdrop-blur-md bg-cyber-void/85 border border-white/10 shadow-2xl select-none">
        {/* Play / Pause (Controls Sample/File playback; disabled when Mic is active) */}
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={isMicActive}
          aria-label={isPlaying && !isMicActive ? 'Pause' : 'Play'}
          title={
            isMicActive
              ? 'Playback disabled while Microphone is active'
              : isPlaying
                ? 'Pause audio'
                : sourceType === 'file'
                  ? 'Play custom audio file'
                  : 'Play procedural drum beat'
          }
          className={`p-2 rounded-lg font-bold shadow-md transition-all ${
            isMicActive
              ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-40'
              : 'bg-cyber-cyan text-black hover:bg-cyber-cyan/90 shadow-cyber-cyan/20 cursor-pointer'
          }`}
        >
          {isPlaying && !isMicActive ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Source Toggle: Sample -> File -> Mic */}
        <div className="flex items-center rounded-lg bg-white/5 p-0.5 border border-white/5">
          <button
            type="button"
            onClick={handleSelectSample}
            aria-label="Use Sample Player"
            title="Procedural Drum Loop"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
              sourceType === 'sample'
                ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Sample</span>
          </button>
          <button
            type="button"
            onClick={handleSelectFile}
            aria-label="Use Local Audio File"
            title={
              audioFileName
                ? `File: ${audioFileName} (click to choose another)`
                : 'Load audio file from local filesystem'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
              sourceType === 'file'
                ? 'bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span className="max-w-[70px] truncate">
              {audioFileName || 'File'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleSelectMic}
            aria-label="Use Microphone"
            title="Live Microphone Capture (Uncompressed)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
              sourceType === 'mic'
                ? 'bg-cyber-magenta/20 text-cyber-magenta border border-cyber-magenta/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Mic</span>
          </button>
        </div>

        {/* Progress & Seek Bar (Visible when audio file is loaded/active) */}
        {sourceType === 'file' && audioFileName && (
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
        )}

        {/* Volume Slider */}
        <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
          {volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume slider"
            className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
          />
        </div>

        {/* FPS Badge Toggle */}
        <button
          type="button"
          onClick={toggleFpsOverlay}
          aria-label="Toggle FPS overlay"
          title={showFpsOverlay ? 'Hide FPS Counter' : 'Show FPS Counter'}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            showFpsOverlay
              ? 'bg-cyber-cyan/15 border-cyber-cyan/30 text-cyber-cyan'
              : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Dynamic Formula Testbed f(x) Button */}
        <button
          type="button"
          onClick={toggleFormulaTestbed}
          aria-label="Open Dynamic Expression Testbed"
          title="Open Dynamic Expression Testbed f(x)"
          className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer font-mono font-bold text-xs select-none ${
            isFormulaTestbedOpen
              ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan shadow-md shadow-cyber-cyan/20'
              : 'bg-white/5 border-transparent text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/10'
          }`}
        >
          f(x)
        </button>

        {/* Preset Settings Modal Button */}
        <button
          type="button"
          onClick={togglePresetSettings}
          aria-label="Open Preset Settings"
          title="Open Preset Performance Settings"
          className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      {/* Audio Error Alert Toast */}
      {audioError && (
        <div
          role="alert"
          className="fixed top-20 right-4 z-50 flex items-center gap-3 p-3 max-w-sm rounded-xl backdrop-blur-md bg-cyber-void/95 border border-cyber-crimson/50 text-slate-200 shadow-2xl shadow-cyber-crimson/20 animate-in fade-in slide-in-from-top-2"
        >
          <AlertCircle className="w-5 h-5 text-cyber-crimson shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-cyber-crimson">Audio Device Notice</p>
            <p className="opacity-90">{audioError}</p>
          </div>
          <button
            type="button"
            onClick={() => setAudioError(null)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
