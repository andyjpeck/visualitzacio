import React from 'react'
import {
  Play,
  Pause,
  Mic,
  Disc,
  Volume2,
  VolumeX,
  Activity,
  Settings,
  AlertCircle,
  X,
} from 'lucide-react'
import { useAppStore } from '../store/app-store'
import type { AudioManager } from '../../audio/audio-manager'

export interface ToolbarProps {
  audioManager: AudioManager | null
}

export function Toolbar({ audioManager }: ToolbarProps): React.ReactElement {
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const sourceType = useAppStore((state) => state.sourceType)
  const setSourceType = useAppStore((state) => state.setSourceType)
  const volume = useAppStore((state) => state.volume)
  const setVolume = useAppStore((state) => state.setVolume)
  const audioError = useAppStore((state) => state.audioError)
  const setAudioError = useAppStore((state) => state.setAudioError)
  const showFpsOverlay = useAppStore((state) => state.showFpsOverlay)
  const toggleFpsOverlay = useAppStore((state) => state.toggleFpsOverlay)
  const togglePresetSettings = useAppStore(
    (state) => state.togglePresetSettings,
  )

  const handlePlayPause = async () => {
    if (!audioManager) return

    if (isPlaying) {
      if (sourceType === 'sample') {
        audioManager.pauseSample()
      } else {
        audioManager.disableMicrophone()
      }
      setIsPlaying(false)
    } else {
      if (sourceType === 'sample') {
        await audioManager.playSample()
        setIsPlaying(true)
      } else {
        const ok = await audioManager.enableMicrophone()
        if (ok) {
          setIsPlaying(true)
        } else {
          setAudioError(audioManager.getLastError() || 'Microphone error')
        }
      }
    }
  }

  const handleSelectSample = async () => {
    if (!audioManager) return
    setSourceType('sample')
    setAudioError(null)
    if (isPlaying) {
      audioManager.disableMicrophone()
      await audioManager.playSample()
    }
  }

  const handleSelectMic = async () => {
    if (!audioManager) return
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (audioManager) {
      audioManager.setVolume(val)
    }
  }

  return (
    <>
      {/* Top Floating Glassmorphic Toolbar */}
      <header className="fixed top-4 right-4 z-40 flex items-center gap-2 p-1.5 rounded-xl backdrop-blur-md bg-cyber-void/85 border border-white/10 shadow-2xl select-none">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause audio' : 'Play procedural drum beat'}
          className="p-2 rounded-lg bg-cyber-cyan text-black hover:bg-cyber-cyan/90 transition-all font-bold shadow-md shadow-cyber-cyan/20 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Source Toggle: Sample vs Mic */}
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
