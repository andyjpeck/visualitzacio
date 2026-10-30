import React, { useEffect, useRef, useState } from 'react'
import {
  Activity,
  Check,
  Copy,
  Disc,
  Download,
  FileAudio,
  Loader2,
  Maximize2,
  Mic,
  Minimize2,
  Pause,
  Play,
  Redo2,
  Settings,
  Undo2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useAppStore } from '../store/app-store'
import type { AudioManager } from '../../audio/audio-manager'
import { AudioProgressScrubber } from './audio-progress-scrubber'
import { AudioErrorToast } from './audio-error-toast'

export interface ToolbarProps {
  audioManager: AudioManager | null
  className?: string
}

/**
 * Top floating glassmorphic toolbar for audio playback controls, source selection,
 * volume, FPS counter toggle, preset settings modal, and expression testbed f(x).
 */
export function Toolbar({ audioManager, className = '' }: ToolbarProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [scale, setScale] = useState(1)
  const [isNarrow, setIsNarrow] = useState(false)

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
  const toggleDialog = useAppStore((state) => state.toggleDialog)
  const studioMode = useAppStore((state) => state.studioMode)
  const toggleStudioMode = useAppStore((state) => state.toggleStudioMode)
  const canUndo = useAppStore((state) => state.canUndo)
  const canRedo = useAppStore((state) => state.canRedo)
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)
  const exportPresetJson = useAppStore((state) => state.exportPresetJson)
  const loadPreset = useAppStore((state) => state.loadPreset)
  const presetFileInputRef = useRef<HTMLInputElement>(null)
  const [copiedPreset, setCopiedPreset] = useState(false)
  const copyPresetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyPresetTimeoutRef.current) {
        clearTimeout(copyPresetTimeoutRef.current)
      }
    }
  }, [])

  const handleExportPreset = () => {
    const jsonStr = exportPresetJson()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `preset-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyPresetJson = () => {
    const jsonStr = exportPresetJson()
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr).catch(() => {})
    }
    setCopiedPreset(true)
    if (copyPresetTimeoutRef.current) {
      clearTimeout(copyPresetTimeoutRef.current)
    }
    copyPresetTimeoutRef.current = setTimeout(() => setCopiedPreset(false), 2000)
  }

  const handlePresetFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        const result = loadPreset(text)
        if (!result.success) {
          setAudioError(result.errors?.join('; ') ?? 'Failed to import preset.')
        }
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  const isAudioLoading = useAppStore((state) => state.isAudioLoading)
  const audioLoadingProgress = useAppStore((state) => state.audioLoadingProgress)
  const audioLoadingStage = useAppStore((state) => state.audioLoadingStage)
  const setIsAudioLoading = useAppStore((state) => state.setIsAudioLoading)
  const setAudioLoadingProgress = useAppStore(
    (state) => state.setAudioLoadingProgress,
  )

  const isMicActive = sourceType === 'mic'

  // Dynamically scale toolbar to fit available horizontal space in preview window
  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const updateScale = () => {
      const parent = el.parentElement
      const parentWidth = parent ? parent.clientWidth : window.innerWidth
      if (!parentWidth || parentWidth <= 0) {
        setScale(1)
        return
      }

      // If preview pane is narrow (< 480px) and FPS badge is shown, position toolbar on row 2
      const isNarrowWithFps = showFpsOverlay && parentWidth < 480
      setIsNarrow(isNarrowWithFps)

      const leftReserved = isNarrowWithFps ? 16 : showFpsOverlay ? 135 : 16
      const rightReserved = 16
      const availableWidth = Math.max(100, parentWidth - leftReserved - rightReserved)

      // Layout width before CSS transforms
      const naturalWidth = el.offsetWidth || el.scrollWidth || 0

      if (naturalWidth > availableWidth && naturalWidth > 0) {
        const targetScale = Math.min(1, Math.max(0.35, availableWidth / naturalWidth))
        setScale(targetScale)
      } else {
        setScale(1)
      }
    }

    updateScale()

    const resizeObserver = new ResizeObserver(() => {
      updateScale()
    })

    if (el.parentElement) {
      resizeObserver.observe(el.parentElement)
    }
    resizeObserver.observe(el)

    window.addEventListener('resize', updateScale)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [showFpsOverlay, sourceType, audioFileName, isPlaying])

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
      setIsAudioLoading(true, 5, 'Reading file...')

      const name = await audioManager.loadAudioFile(file, (percent, stage) => {
        setAudioLoadingProgress(percent, stage)
      })
      setAudioFileName(name)
      setAudioError(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setAudioError(`Failed to decode audio file: ${msg}`)
    } finally {
      setIsAudioLoading(false)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (audioManager) {
      audioManager.setVolume(val)
    }
  }

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

      {/* Top Floating Glassmorphic Toolbar (floats within playback window, scales to fit available horizontal space) */}
      <header
        ref={headerRef}
        data-testid="playback-toolbar"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top right',
        }}
        className={`absolute ${isNarrow ? 'top-14' : 'top-4'} right-4 z-40 flex items-center gap-2 p-1.5 rounded-xl backdrop-blur-md bg-cyber-void/85 border border-white/10 shadow-2xl select-none transition-all duration-75 max-w-[calc(100%-2rem)] ${className}`}
      >
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
            {isAudioLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-cyber-amber animate-spin" />
            ) : (
              <FileAudio className="w-3.5 h-3.5" />
            )}
            <span className="max-w-[70px] truncate">
              {isAudioLoading ? `${audioLoadingProgress}%` : audioFileName || 'File'}
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

        {/* Audio Progress / Scrubber / Loading Bar */}
        <AudioProgressScrubber
          audioManager={audioManager}
          sourceType={sourceType}
          audioFileName={audioFileName}
          isPlaying={isPlaying}
          isAudioLoading={isAudioLoading}
          audioLoadingProgress={audioLoadingProgress}
          audioLoadingStage={audioLoadingStage}
        />

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

        {/* Undo Action */}
        <button
          type="button"
          data-testid="toolbar-undo-btn"
          disabled={!canUndo}
          onClick={() => undo()}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          className="p-2 rounded-lg bg-white/5 transition-colors border border-transparent disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/10 text-slate-300 hover:text-white hover:border-white/10 cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo Action */}
        <button
          type="button"
          data-testid="toolbar-redo-btn"
          disabled={!canRedo}
          onClick={() => redo()}
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          aria-label="Redo"
          className="p-2 rounded-lg bg-white/5 transition-colors border border-transparent disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/10 text-slate-300 hover:text-white hover:border-white/10 cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Export Preset (.json) Action */}
        <button
          type="button"
          data-testid="toolbar-export-preset-btn"
          onClick={handleExportPreset}
          title="Export Preset (.json file download)"
          aria-label="Export Preset"
          className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Copy Preset JSON Action */}
        <button
          type="button"
          data-testid="toolbar-copy-preset-btn"
          onClick={handleCopyPresetJson}
          title={copiedPreset ? 'Copied to Clipboard!' : 'Copy Preset JSON to Clipboard'}
          aria-label="Copy Preset JSON"
          className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
        >
          {copiedPreset ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Import Preset (.json) Action */}
        <button
          type="button"
          data-testid="toolbar-import-preset-btn"
          onClick={() => presetFileInputRef.current?.click()}
          title="Import Preset (.json file or paste Ctrl+V)"
          aria-label="Import Preset"
          className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
        </button>
        <input
          ref={presetFileInputRef}
          type="file"
          data-testid="toolbar-preset-file-input"
          accept=".json,application/json"
          onChange={handlePresetFileSelect}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />

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

        {/* Preset Settings Modal Button */}
        <button
          type="button"
          onClick={() => toggleDialog('preset-settings')}
          aria-label="Open Preset Settings"
          title="Open Preset Performance Settings"
          className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Studio / Live Performance Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleStudioMode}
          aria-label={
            studioMode === 'live'
              ? 'Exit Live Performance Mode'
              : 'Enter Live Performance Mode'
          }
          title={
            studioMode === 'live'
              ? 'Exit Live Performance Mode (F11 / Esc)'
              : 'Enter Live Performance Mode (F11)'
          }
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            studioMode === 'live'
              ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan shadow-sm shadow-cyber-cyan/20'
              : 'bg-white/5 border-transparent text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/10'
          }`}
        >
          {studioMode === 'live' ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </header>

      {/* Audio Error Alert Toast */}
      <AudioErrorToast
        error={audioError}
        onDismiss={() => setAudioError(null)}
      />
    </>
  )
}
