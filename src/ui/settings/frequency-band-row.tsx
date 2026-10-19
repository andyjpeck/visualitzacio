import React from 'react'

export interface FrequencyBandRowProps {
  bandName: string
  colorClass: string
  focusBorderClass: string
  minLabel: string
  maxLabel: string
  minValue: number
  maxValue: number
  minStep?: number
  maxStep?: number
  minLimit: number
  maxLimit: number
  onMinChange: (val: number) => void
  onMaxChange: (val: number) => void
}

/**
 * Reusable input card for configuring the frequency cutoff boundaries
 * of a DSP frequency band ($BASS, $MID, $TREBLE).
 */
export function FrequencyBandRow({
  bandName,
  colorClass,
  focusBorderClass,
  minLabel,
  maxLabel,
  minValue,
  maxValue,
  minStep = 10,
  maxStep = 50,
  minLimit,
  maxLimit,
  onMinChange,
  onMaxChange,
}: FrequencyBandRowProps): React.ReactElement {
  return (
    <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-mono font-bold ${colorClass}`}>
          {bandName}
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          {minValue} Hz – {maxValue} Hz
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-mono text-slate-500 block mb-0.5">Min (Hz)</span>
          <input
            type="number"
            aria-label={minLabel}
            min={minLimit}
            max={maxValue - 10}
            step={minStep}
            value={minValue}
            onChange={(e) => {
              const parsed = Number(e.target.value)
              const clamped = Math.max(minLimit, Math.min(maxValue - 10, isNaN(parsed) ? minLimit : parsed))
              onMinChange(clamped)
            }}
            className={`w-full px-2 py-1 text-xs font-mono bg-black/40 border border-white/10 rounded ${focusBorderClass} focus:outline-none text-white`}
          />
        </div>
        <div>
          <span className="text-[10px] font-mono text-slate-500 block mb-0.5">Max (Hz)</span>
          <input
            type="number"
            aria-label={maxLabel}
            min={minValue + 10}
            max={maxLimit}
            step={maxStep}
            value={maxValue}
            onChange={(e) => {
              const parsed = Number(e.target.value)
              const clamped = Math.max(minValue + 10, Math.min(maxLimit, isNaN(parsed) ? maxLimit : parsed))
              onMaxChange(clamped)
            }}
            className={`w-full px-2 py-1 text-xs font-mono bg-black/40 border border-white/10 rounded ${focusBorderClass} focus:outline-none text-white`}
          />
        </div>
      </div>
    </div>
  )
}
