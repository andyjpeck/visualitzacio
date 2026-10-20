import React, { useEffect, useState } from 'react'
import { ViewportCanvas } from './ui/canvas/viewport-canvas'
import { FpsBadge } from './ui/hud/fps-badge'
import { PresetSettingsModal } from './ui/settings/preset-settings-modal'
import { FrameBufferTemplateSelector } from './ui/settings/frame-buffer-template-selector'
import { Toolbar } from './ui/toolbar/toolbar'
import { AudioTelemetryOverlay } from './ui/hud/audio-telemetry-overlay'
import { FormulaTestbed } from './ui/hud/formula-testbed'
import { StudioSplitView } from './ui/studio/studio-split-view'
import { VisualNodeGraph } from './ui/graph/visual-node-graph'
import { ParameterInspector } from './ui/inspector/parameter-inspector'
import { useStudioControls } from './ui/studio/use-studio-controls'
import { AudioManager } from './audio/audio-manager'
import { AudioAnalyzer } from './audio/audio-analyzer'
import type { RenderEngine } from './engine/render-engine'
import { useAppStore } from './ui/store/app-store'

/**
 * Root Application component integrating the WebGL RenderEngine canvas,
 * Web Audio DSP pipeline, Studio resizable split-view workspace, and responsive floating HUD interface.
 */
export function App(): React.ReactElement {
  const [engine, setEngine] = useState<RenderEngine | null>(null)
  const [audioManager] = useState(() => new AudioManager())
  const [audioAnalyzer] = useState(() => new AudioAnalyzer())
  const audioBands = useAppStore((state) => state.audioBands)
  const { isHudVisible, isLive } = useStudioControls()

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
    <div
      className={`relative w-screen h-screen overflow-hidden bg-cyber-void text-slate-100 select-none ${
        isLive && !isHudVisible ? 'cursor-none' : ''
      }`}
    >
      {/* Top Floating Controls Toolbar (on top of all panes and canvas) */}
      <div
        className={`transition-opacity duration-300 relative z-50 ${
          isHudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Toolbar audioManager={audioManager} />
      </div>

      {/* Resizable Studio Split-View Workspace */}
      <StudioSplitView
        preview={
          <div className="relative w-full h-full overflow-hidden">
            {/* 3D Viewport Canvas */}
            <ViewportCanvas onEngineReady={handleEngineReady} />

            {/* Floating HUD Elements (auto-hide in Live Mode) */}
            <div
              className={`transition-opacity duration-300 ${
                isHudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <FpsBadge />
              <AudioTelemetryOverlay engine={engine} />
            </div>
          </div>
        }
        graph={
          <div data-testid="studio-graph-container" className="w-full h-full relative">
            <VisualNodeGraph />
          </div>
        }
        inspector={
          <div data-testid="studio-inspector-container" className="w-full h-full relative">
            <ParameterInspector engine={engine} />
          </div>
        }
      />

      {/* Modals & Dialogs (Stack Managed) */}
      <PresetSettingsModal />
      <FrameBufferTemplateSelector />
      <FormulaTestbed engine={engine} />
    </div>
  )
}
