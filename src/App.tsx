import React, { useEffect, useState } from 'react'
import { ViewportCanvas } from './ui/canvas/viewport-canvas'
import { FpsBadge } from './ui/hud/fps-badge'
import { PresetSettingsModal } from './ui/settings/preset-settings-modal'
import { Toolbar } from './ui/toolbar/toolbar'
import { AudioTelemetryOverlay } from './ui/hud/audio-telemetry-overlay'
import { FormulaTestbed } from './ui/hud/formula-testbed'
import { AudioManager } from './audio/audio-manager'
import { AudioAnalyzer } from './audio/audio-analyzer'
import type { RenderEngine } from './engine/render-engine'
import { useAppStore } from './ui/store/app-store'

/**
 * Root Application component integrating the WebGL RenderEngine canvas,
 * Web Audio DSP pipeline, and responsive floating HUD interface.
 */
export function App(): React.ReactElement {
  const [engine, setEngine] = useState<RenderEngine | null>(null)
  const [audioManager] = useState(() => new AudioManager())
  const [audioAnalyzer] = useState(() => new AudioAnalyzer())
  const audioBands = useAppStore((state) => state.audioBands)

  // Synchronize dynamic frequency band cutoffs to audio analyzer
  useEffect(() => {
    audioAnalyzer.setAudioBands(audioBands)
  }, [audioAnalyzer, audioBands])

  // Clean up Web Audio pipeline on unmount
  useEffect(() => {
    return () => {
      audioManager.dispose()
    }
  }, [audioManager])

  // Hook audio telemetry into RenderEngine loop
  const handleEngineReady = React.useCallback(
    (newEngine: RenderEngine) => {
      setEngine(newEngine)

      newEngine.setBeforeUpdate((frameContext, timestamp) => {
        if (audioManager.isPlaying()) {
          audioAnalyzer.analyze(
            audioManager.getAnalyserNode(),
            frameContext,
            audioManager.getSampleRate(),
            timestamp,
          )
        } else {
          // Smoothly decay transient audio telemetry when paused
          audioAnalyzer.decayIdle(frameContext)
        }
      })
    },
    [audioManager, audioAnalyzer],
  )

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-void text-slate-100 select-none">
      {/* 3D Viewport Canvas */}
      <ViewportCanvas onEngineReady={handleEngineReady} />

      {/* Floating HUD Elements */}
      <FpsBadge />
      <AudioTelemetryOverlay engine={engine} />

      {/* Top Controls Toolbar */}
      <Toolbar audioManager={audioManager} />

      {/* Modals & Dialogs */}
      <PresetSettingsModal />
      <FormulaTestbed engine={engine} />
    </div>
  )
}
