export interface FormulaPreset {
  name: string
  formula: string
  description: string
}

export const PRESET_FORMULAS: FormulaPreset[] = [
  {
    name: 'Bass Pulsar',
    formula: '1.0 + $BASS * 0.8',
    description: 'Expands crystal scale proportionally with low-frequency energy',
  },
  {
    name: 'Beat Shockwave',
    formula: '#BEAT(0.2) * 2.0',
    description: 'Instant transient punch on beats with exponential decay',
  },
  {
    name: 'Harmonic Sine',
    formula: 'sin($TIME * 2.0) * 0.5 + 1.0',
    description: 'Smooth periodic sine wave modulation over elapsed time',
  },
  {
    name: 'Triangle LFO',
    formula: '#TRI($TIME * 0.5) * 0.8 + 1.0',
    description: 'Linear ramp-up and ramp-down periodic oscillation',
  },
  {
    name: 'Sub-Bass Slice',
    formula: '#FFT(0.02, 0.04) * 2.5',
    description: 'Direct narrow FFT band sampling of sub-bass frequencies',
  },
  {
    name: 'Linear Beat Fade',
    formula: '#BEAT_FRAMES(16, "linear") * 1.5',
    description: 'Mechanical linear frame-counter decay over 16 frames',
  },
]

export interface QuickRefItem {
  name: string
  insertText: string
  tooltip: string
}

export const QUICK_REF_VARS: QuickRefItem[] = [
  {
    name: '$BASS',
    insertText: '$BASS',
    tooltip: '$BASS: Audio bass energy [0.0 - 1.0] with exponential decay smoothing',
  },
  {
    name: '$MID',
    insertText: '$MID',
    tooltip: '$MID: Audio midrange energy [0.0 - 1.0] for lead and vocal presence',
  },
  {
    name: '$TREBLE',
    insertText: '$TREBLE',
    tooltip: '$TREBLE: Audio treble energy [0.0 - 1.0] for high-frequency transients and percussion',
  },
  {
    name: '$RMS',
    insertText: '$RMS',
    tooltip: '$RMS: Root Mean Square overall audio amplitude energy [0.0 - 1.0]',
  },
  {
    name: '$BEAT',
    insertText: '$BEAT',
    tooltip: '$BEAT: Beat trigger pulse flag (1.0 on beat frame onset, 0.0 otherwise)',
  },
  {
    name: '$BPM',
    insertText: '$BPM',
    tooltip: '$BPM: Estimated musical tempo in beats per minute (e.g. 120.0)',
  },
  {
    name: '$TIME',
    insertText: '$TIME',
    tooltip: '$TIME: Total elapsed visualization playback time in seconds',
  },
  {
    name: '$DT',
    insertText: '$DT',
    tooltip: '$DT: Delta time between consecutive render frames in seconds (~0.016s at 60 FPS)',
  },
  {
    name: '$FRAME',
    insertText: '$FRAME',
    tooltip: '$FRAME: Monotonic frame counter index',
  },
  {
    name: '$FPS',
    insertText: '$FPS',
    tooltip: '$FPS: Current measured rendering framerate (e.g. 60.0)',
  },
  {
    name: '$WIDTH',
    insertText: '$WIDTH',
    tooltip: '$WIDTH: Viewport canvas width in pixels',
  },
  {
    name: '$HEIGHT',
    insertText: '$HEIGHT',
    tooltip: '$HEIGHT: Viewport canvas height in pixels',
  },
  {
    name: '$ASPECT',
    insertText: '$ASPECT',
    tooltip: '$ASPECT: Viewport aspect ratio ($WIDTH / $HEIGHT)',
  },
  {
    name: '$PIXEL_RATIO',
    insertText: '$PIXEL_RATIO',
    tooltip: '$PIXEL_RATIO: Device pixel ratio (DPR)',
  },
]

export const QUICK_REF_FUNCS: QuickRefItem[] = [
  {
    name: '#BEAT(decay)',
    insertText: '#BEAT(0.2)',
    tooltip: '#BEAT([decay_seconds = 0.2]): Exponential decay pulse [1.0 -> 0.0] following beat onset',
  },
  {
    name: '#BEAT_FRAMES(f, curve)',
    insertText: '#BEAT_FRAMES(12, "exponential")',
    tooltip: '#BEAT_FRAMES([frames = 12], [curve = "exponential"|"linear"|"logarithmic"]): Frame-based decay envelope',
  },
  {
    name: '#FFT(band, width)',
    insertText: '#FFT(0.02, 0.04)',
    tooltip: '#FFT(lower_band, [band_width = 0.02]): Normalized frequency slice [0.0 - 1.0] from FFT spectrum',
  },
  {
    name: '#WAVEFORM(pos)',
    insertText: '#WAVEFORM(0.5)',
    tooltip: '#WAVEFORM(position): Oscilloscope audio waveform sample [-1.0 to 1.0] at normalized position [0.0 - 1.0]',
  },
  {
    name: '#TRI(t)',
    insertText: '#TRI($TIME)',
    tooltip: '#TRI(t): Normalized periodic triangle wave [-1.0 to 1.0] with period 1.0',
  },
  {
    name: '#SAW(t)',
    insertText: '#SAW($TIME)',
    tooltip: '#SAW(t): Normalized periodic sawtooth wave [-1.0 to 1.0] with period 1.0',
  },
  {
    name: '#SQR(t)',
    insertText: '#SQR($TIME)',
    tooltip: '#SQR(t): Normalized periodic square wave [-1.0 or 1.0] with period 1.0',
  },
  {
    name: 'clamp(x, min, max)',
    insertText: 'clamp($BASS, 0.2, 1.0)',
    tooltip: 'clamp(x, min, max): Restricts x to the range [min, max]',
  },
  {
    name: 'lerp(a, b, t)',
    insertText: 'lerp(1.0, 2.0, $BASS)',
    tooltip: 'lerp(a, b, t): Linear interpolation between a and b by factor t (a + (b - a) * t)',
  },
  {
    name: 'smoothstep(e0, e1, x)',
    insertText: 'smoothstep(0.2, 0.8, $RMS)',
    tooltip: 'smoothstep(edge0, edge1, x): Smooth Hermite interpolation between 0 and 1',
  },
]
