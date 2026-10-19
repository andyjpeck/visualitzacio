import React from 'react'
import { ViewportCanvas } from './ui/canvas/viewport-canvas'
import { FpsBadge } from './ui/hud/fps-badge'
import { PresetSettingsModal } from './ui/settings/preset-settings-modal'

export function App(): React.ReactElement {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-void text-slate-100 select-none">
      {/* 3D Viewport Canvas */}
      <ViewportCanvas />

      {/* Floating HUD Elements */}
      <FpsBadge />

      {/* Modals & Dialogs */}
      <PresetSettingsModal />
    </div>
  )
}

export default App
