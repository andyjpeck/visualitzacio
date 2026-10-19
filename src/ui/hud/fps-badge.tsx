import React from 'react'
import { useAppStore } from '../store/app-store'

/**
 * Real-time floating frame rate badge HUD indicator.
 * Displays current measured FPS against target with cyberpunk status color-coding.
 */
export function FpsBadge(): React.ReactElement | null {
  const showFpsOverlay = useAppStore((state) => state.showFpsOverlay)
  const currentFps = useAppStore((state) => state.currentFps)
  const targetFps = useAppStore((state) => state.targetFps)
  const toggleDialog = useAppStore((state) => state.toggleDialog)

  if (!showFpsOverlay) return null

  // Determine badge color:
  // - Nominal (Cyan): currentFps >= targetFps
  // - Under target (Amber): currentFps < targetFps
  // - Critical drop (Red): currentFps < targetFps * 0.5
  let badgeColor = 'text-cyber-cyan border-cyber-cyan/40 shadow-cyber-cyan/20'
  let dotColor = 'bg-cyber-cyan'

  if (currentFps < targetFps * 0.5) {
    badgeColor =
      'text-cyber-crimson border-cyber-crimson/50 shadow-cyber-crimson/20'
    dotColor = 'bg-cyber-crimson animate-ping'
  } else if (currentFps < targetFps) {
    badgeColor = 'text-cyber-amber border-cyber-amber/50 shadow-cyber-amber/20'
    dotColor = 'bg-cyber-amber'
  }

  return (
    <button
      type="button"
      onClick={() => toggleDialog('preset-settings')}
      title="Click to configure Target FPS & Resolution Scale"
      className={`fixed top-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-semibold backdrop-blur-md bg-cyber-void/80 border shadow-lg transition-colors cursor-pointer select-none hover:brightness-125 focus:outline-none focus:ring-1 focus:ring-cyber-cyan ${badgeColor}`}
      aria-label={`Frame rate ${currentFps} FPS of target ${targetFps} FPS. Click to configure preset settings.`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{currentFps} FPS</span>
      <span className="text-[10px] opacity-60">/ {targetFps}</span>
    </button>
  )
}
