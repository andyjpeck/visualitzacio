import React, { useEffect, useState } from 'react'
import { ViewportCanvas } from './ui/canvas/viewport-canvas'
import { FpsBadge } from './ui/hud/fps-badge'
import { PresetSettingsModal } from './ui/settings/preset-settings-modal'
import { Toolbar } from './ui/toolbar/toolbar'
import { AudioTelemetryOverlay } from './ui/hud/audio-telemetry-overlay'
import { AudioManager } from './audio/audio-manager'
import { AudioAnalyzer } from './audio/audio-analyzer'
import type { RenderEngine } from './engine/render-engine'

export function App(): React.ReactElement {
  const [engine, setEngine] = useState<RenderEngine | null>(null)
  const [audioManager] = useState(() => new AudioManager())
  const [audioAnalyzer] = useState(() => new AudioAnalyzer())

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
          frameContext.$BASS *= 0.92
          frameContext.$MID *= 0.92
          frameContext.$TREBLE *= 0.92
          frameContext.$RMS *= 0.85
          frameContext.$BEAT = 0.0
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
    </div>
  )
}

export default App
