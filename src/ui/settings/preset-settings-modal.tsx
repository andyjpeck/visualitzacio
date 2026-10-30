import React from 'react'
import { Settings } from 'lucide-react'
import type { ResolutionScale } from '../../contracts/preset-settings'
import { useAppStore } from '../store/app-store'
import { BaseModalDialog } from '../dialogs/base-modal-dialog'

import { FrequencyBandRow } from './frequency-band-row'

const RESOLUTION_OPTIONS: Array<{ label: string; value: ResolutionScale }> = [
  { label: '1.0x (Native)', value: 1.0 },
  { label: '0.75x (Balanced)', value: 0.75 },
  { label: '0.50x (Performance)', value: 0.5 },
  { label: '0.25x (Low-Fi)', value: 0.25 },
]

const FPS_OPTIONS: number[] = [30, 60, 120]

/**
 * Modal dialog for configuring preset performance (FPS target, resolution scale)
 * and audio DSP frequency band boundaries ($BASS, $MID, $TREBLE).
 */
export function PresetSettingsModal(): React.ReactElement | null {
  const closeDialog = useAppStore((state) => state.closeDialog)
  const targetFps = useAppStore((state) => state.targetFps)
  const setTargetFps = useAppStore((state) => state.setTargetFps)
  const resolutionScale = useAppStore((state) => state.resolutionScale)
  const setResolutionScale = useAppStore((state) => state.setResolutionScale)
  const audioBands = useAppStore((state) => state.audioBands)
  const setAudioBands = useAppStore((state) => state.setAudioBands)
  const resetAudioBands = useAppStore((state) => state.resetAudioBands)

  return (
    <BaseModalDialog
      dialogId="preset-settings"
      title="Preset Performance & DSP Settings"
      icon={<Settings className="w-5 h-5" />}
      headerTestId="preset-settings-header"
      closeAriaLabel="Close settings"
      maxWidthClass="max-w-lg"
      maxHeightClass="max-h-[90vh]"
    >

        {/* Scrollable Content */}
        <div className="mt-5 space-y-6 overflow-y-auto pr-1">
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
                    className={`py-2 px-3 rounded-lg font-mono text-sm font-semibold transition-all border cursor-pointer ${
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
            <p className="mt-2 text-[11px] text-slate-400 font-mono leading-relaxed">
              * Note: Actual rendering speed is capped by your display&apos;s physical refresh rate and browser VSync (e.g., 60Hz displays will cap at 60 FPS).
            </p>
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
                    className={`py-2 px-3 rounded-lg text-left text-xs font-mono transition-all border cursor-pointer ${
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
              Lowers internal WebGL canvas render resolution to increase FPS on complex visualizations.
            </p>
          </div>

          {/* Audio Frequency Bands (DSP) */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                Audio Frequency Bands (DSP)
              </label>
              <button
                type="button"
                onClick={resetAudioBands}
                className="text-[11px] font-mono text-cyber-cyan hover:underline transition-colors cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>

            <div className="space-y-3">
              {/* Bass Band */}
              <FrequencyBandRow
                bandName="$BASS"
                colorClass="text-cyber-cyan"
                focusBorderClass="focus:border-cyber-cyan"
                minLabel="Bass minimum frequency"
                maxLabel="Bass maximum frequency"
                minValue={audioBands.bassMin}
                maxValue={audioBands.bassMax}
                minStep={5}
                maxStep={10}
                minLimit={20}
                maxLimit={audioBands.midMax - 10}
                onMinChange={(val) => setAudioBands({ bassMin: val })}
                onMaxChange={(val) => setAudioBands({ bassMax: val, midMin: val })}
              />

              {/* Mid Band */}
              <FrequencyBandRow
                bandName="$MID"
                colorClass="text-cyber-amber"
                focusBorderClass="focus:border-cyber-amber"
                minLabel="Mid minimum frequency"
                maxLabel="Mid maximum frequency"
                minValue={audioBands.midMin}
                maxValue={audioBands.midMax}
                minStep={25}
                maxStep={50}
                minLimit={audioBands.bassMin + 10}
                maxLimit={audioBands.trebleMax - 50}
                onMinChange={(val) => setAudioBands({ midMin: val, bassMax: val })}
                onMaxChange={(val) => setAudioBands({ midMax: val, trebleMin: val })}
              />

              {/* Treble Band */}
              <FrequencyBandRow
                bandName="$TREBLE"
                colorClass="text-cyber-magenta"
                focusBorderClass="focus:border-cyber-magenta"
                minLabel="Treble minimum frequency"
                maxLabel="Treble maximum frequency"
                minValue={audioBands.trebleMin}
                maxValue={audioBands.trebleMax}
                minStep={100}
                maxStep={500}
                minLimit={audioBands.midMin + 50}
                maxLimit={20000}
                onMinChange={(val) => setAudioBands({ trebleMin: val, midMax: val })}
                onMaxChange={(val) => setAudioBands({ trebleMax: val })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => closeDialog('preset-settings')}
            className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-cyber-cyan text-black hover:bg-cyber-cyan/90 transition-colors font-mono font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
    </BaseModalDialog>
  )
}
