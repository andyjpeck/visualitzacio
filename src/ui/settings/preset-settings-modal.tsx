import React from 'react'
import { Settings } from 'lucide-react'
import type { ResolutionScale } from '../../contracts/preset-settings'
import { useAppStore } from '../store/app-store'
import { BaseModalDialog } from '../dialogs/base-modal-dialog'

import { FrequencyBandRow } from './frequency-band-row'
import { getTemplateById } from '../../engine/frame-buffer/frame-buffer-templates'

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
  const openDialog = useAppStore((state) => state.openDialog)
  const targetFps = useAppStore((state) => state.targetFps)
  const setTargetFps = useAppStore((state) => state.setTargetFps)
  const resolutionScale = useAppStore((state) => state.resolutionScale)
  const setResolutionScale = useAppStore((state) => state.setResolutionScale)
  const audioBands = useAppStore((state) => state.audioBands)
  const setAudioBands = useAppStore((state) => state.setAudioBands)
  const resetAudioBands = useAppStore((state) => state.resetAudioBands)

  const selectedTemplateId = useAppStore((state) => state.selectedTemplateId)
  const feedbackEnabled = useAppStore((state) => state.feedbackEnabled)
  const setFeedbackEnabled = useAppStore((state) => state.setFeedbackEnabled)
  const feedbackBlendMode = useAppStore((state) => state.feedbackBlendMode)
  const setFeedbackBlendMode = useAppStore((state) => state.setFeedbackBlendMode)
  const feedbackOpacity = useAppStore((state) => state.feedbackOpacity)
  const setFeedbackOpacity = useAppStore((state) => state.setFeedbackOpacity)
  const feedbackScale = useAppStore((state) => state.feedbackScale)
  const setFeedbackScale = useAppStore((state) => state.setFeedbackScale)
  const feedbackRotation = useAppStore((state) => state.feedbackRotation)
  const setFeedbackRotation = useAppStore((state) => state.setFeedbackRotation)

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

          {/* Frame Buffer & Ping-Pong Feedback */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Frame Buffer & Feedback
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Ping-pong feedback motion trails & compositing
                </p>
              </div>
              <button
                type="button"
                onClick={() => openDialog('template-selector')}
                className="px-2.5 py-1 text-xs font-mono rounded border border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 transition-colors"
              >
                Template: {getTemplateById(selectedTemplateId)?.name ?? 'Custom'}
              </button>
            </div>

            <div className="space-y-3 bg-black/30 p-3 rounded-lg border border-white/5">
              {/* Feedback Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-mono">Feedback Loop</span>
                <button
                  type="button"
                  onClick={() => setFeedbackEnabled(!feedbackEnabled)}
                  className={`px-3 py-1 text-xs font-mono font-semibold rounded border transition-colors ${
                    feedbackEnabled
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {feedbackEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Blend Mode */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-mono">Blend Mode</span>
                <select
                  aria-label="Feedback blend mode"
                  title="Feedback compositing blend mode"
                  value={feedbackBlendMode}
                  onChange={(e) => setFeedbackBlendMode(e.target.value)}
                  className="bg-slate-900 border border-white/15 text-xs text-slate-200 rounded px-2 py-1 font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="replace" title="Replace: Standard direct overwrite">replace</option>
                  <option value="additive" title="Additive: Pixels sum together for neon bloom">additive</option>
                  <option value="maximum" title="Maximum: Retains the brightest pixel">maximum</option>
                  <option value="minimum" title="Minimum: Retains the darkest pixel">minimum</option>
                  <option value="subtractive" title="Subtractive: Subtracts source color from background">subtractive</option>
                  <option value="multiplicative" title="Multiplicative: Multiplies color channels for shading">multiplicative</option>
                </select>
              </div>

              {/* Opacity Control */}
              {typeof feedbackOpacity === 'number' ? (
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Decay Persistence</span>
                    <span>{(feedbackOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={feedbackOpacity}
                    onChange={(e) => setFeedbackOpacity(parseFloat(e.target.value))}
                    aria-label="Feedback opacity"
                    className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyber-cyan"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-purple-500/30">
                  <div className="text-[11px] font-mono">
                    <span className="text-slate-400">Decay: </span>
                    <span className="text-purple-300 font-bold">{feedbackOpacity}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpacity(0.92)}
                    className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/10 cursor-pointer"
                    title="Switch to manual slider"
                  >
                    Reset to Slider
                  </button>
                </div>
              )}

              {/* Scale Control */}
              {typeof feedbackScale === 'number' ? (
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Feedback Zoom</span>
                    <span>{feedbackScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.01"
                    value={feedbackScale}
                    onChange={(e) => setFeedbackScale(parseFloat(e.target.value))}
                    aria-label="Feedback scale"
                    className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyber-cyan"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-purple-500/30">
                  <div className="text-[11px] font-mono">
                    <span className="text-slate-400">Zoom: </span>
                    <span className="text-purple-300 font-bold">{feedbackScale}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackScale(1.0)}
                    className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/10 cursor-pointer"
                    title="Switch to manual slider"
                  >
                    Reset to Slider
                  </button>
                </div>
              )}

              {/* Rotation Control */}
              {typeof feedbackRotation === 'number' ? (
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Feedback Rotation</span>
                    <span>{feedbackRotation.toFixed(3)} rad</span>
                  </div>
                  <input
                    type="range"
                    min="-0.1"
                    max="0.1"
                    step="0.005"
                    value={feedbackRotation}
                    onChange={(e) => setFeedbackRotation(parseFloat(e.target.value))}
                    aria-label="Feedback rotation"
                    className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyber-cyan"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-purple-500/30">
                  <div className="text-[11px] font-mono">
                    <span className="text-slate-400">Rotation: </span>
                    <span className="text-purple-300 font-bold">{feedbackRotation}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackRotation(0.0)}
                    className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/10 cursor-pointer"
                    title="Switch to manual slider"
                  >
                    Reset to Slider
                  </button>
                </div>
              )}
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
