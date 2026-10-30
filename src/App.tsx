import React, { useEffect, useState } from 'react'
import { ViewportCanvas } from './ui/canvas/viewport-canvas'
import { FpsBadge } from './ui/hud/fps-badge'
import { PresetSettingsModal } from './ui/settings/preset-settings-modal'
import { Toolbar } from './ui/toolbar/toolbar'
import { AudioTelemetryOverlay } from './ui/hud/audio-telemetry-overlay'
import { StudioSplitView } from './ui/studio/studio-split-view'
import { WorkspacePane } from './ui/studio/workspace-pane'
import { ParameterInspector } from './ui/inspector/parameter-inspector'
import { useStudioControls } from './ui/studio/use-studio-controls'
import { AudioManager } from './audio/audio-manager'
import { AudioAnalyzer } from './audio/audio-analyzer'
import type { RenderEngine } from './engine/render-engine'
import { useAppStore } from './ui/store/app-store'
import { useUndoRedoShortcuts } from './ui/history/use-undo-redo-shortcuts'

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

  // Bind global Ctrl+Z / Ctrl+Y undo/redo shortcuts
  useUndoRedoShortcuts()

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
      {/* Resizable Studio Split-View Workspace */}
      <StudioSplitView
        preview={
          <div className="relative w-full h-full overflow-hidden">
            {/* 3D Viewport Canvas */}
            <ViewportCanvas onEngineReady={handleEngineReady} />

            {/* Floating HUD Elements & Playback Toolbar (floats within playback window, auto-hides in Live Mode) */}
            <div
              className={`transition-opacity duration-300 ${
                isHudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <FpsBadge />
              <Toolbar audioManager={audioManager} />
              <AudioTelemetryOverlay engine={engine} />
            </div>
          </div>
        }
        graph={
          <div data-testid="studio-graph-container" className="w-full h-full relative">
            <WorkspacePane />
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
    </div>
  )
}
