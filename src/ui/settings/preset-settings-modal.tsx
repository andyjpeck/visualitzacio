import React, { useEffect } from 'react'
import { Settings, X } from 'lucide-react'
import type { ResolutionScale } from '../../contracts/preset-settings'
import { useAppStore } from '../store/app-store'

const RESOLUTION_OPTIONS: Array<{ label: string; value: ResolutionScale }> = [
  { label: '1.0x (Native)', value: 1.0 },
  { label: '0.75x (Balanced)', value: 0.75 },
  { label: '0.50x (Performance)', value: 0.5 },
  { label: '0.25x (Low-Fi)', value: 0.25 },
]

const FPS_OPTIONS: number[] = [30, 60, 120]

export function PresetSettingsModal(): React.ReactElement | null {
  const isOpen = useAppStore((state) => state.isPresetSettingsOpen)
  const setIsOpen = useAppStore((state) => state.setIsPresetSettingsOpen)
  const targetFps = useAppStore((state) => state.targetFps)
  const setTargetFps = useAppStore((state) => state.setTargetFps)
  const resolutionScale = useAppStore((state) => state.resolutionScale)
  const setResolutionScale = useAppStore((state) => state.setResolutionScale)

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-settings-title"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-md p-6 rounded-xl border border-cyber-cyan/40 bg-cyber-panel/95 text-slate-100 shadow-2xl shadow-cyber-cyan/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-cyber-cyan">
            <Settings className="w-5 h-5" />
            <h2 id="preset-settings-title" className="text-base font-bold tracking-wide">
              Preset Performance Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-6">
          {/* Target FPS */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2">
              Target Frame Rate (FPS)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FPS_OPTIONS.map((fps) => {
                const isSelected = targetFps === fps
                return (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => setTargetFps(fps)}
                    className={`py-2 px-3 rounded-lg font-mono text-sm font-semibold transition-all border ${
                      isSelected
                        ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan shadow-md shadow-cyber-cyan/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {fps} FPS
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resolution Scale */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2">
              Render Resolution Scale
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTION_OPTIONS.map((opt) => {
                const isSelected = resolutionScale === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResolutionScale(opt.value)}
                    className={`py-2 px-3 rounded-lg text-left text-xs font-mono transition-all border ${
                      isSelected
                        ? 'bg-cyber-magenta/20 border-cyber-magenta text-cyber-magenta shadow-md shadow-cyber-magenta/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold">{opt.label}</div>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Lowers internal WebGL canvas and FBO render resolution to increase FPS on complex visualizations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-cyber-cyan text-black hover:bg-cyber-cyan/90 transition-colors font-mono font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
