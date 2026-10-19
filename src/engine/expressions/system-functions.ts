import type { Parser } from 'expr-eval'
import type { FrameContext } from '../../contracts/frame-context'
import { logScaleToFrequency } from '../../audio/audio-analyzer'

/**
 * Registers mathematical shaping and interpolation functions (clamp, lerp, smoothstep).
 */
export function registerMathHelpers(parser: Parser): void {
  // clamp(val, min, max)
  parser.functions.clamp = (val: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, val))
  }

  // lerp(a, b, t)
  parser.functions.lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t
  }

  // smoothstep(edge0, edge1, x)
  parser.functions.smoothstep = (edge0: number, edge1: number, x: number): number => {
    const delta = edge1 - edge0 || 1.0
    const t = Math.max(0, Math.min(1, (x - edge0) / delta))
    return t * t * (3 - 2 * t)
  }
}

/**
 * Registers specialized audio analysis, beat decay, and periodic wave functions (#FUNCTION).
 *
 * @param parser - expr-eval Parser instance
 * @param getActiveContext - Callback providing the currently evaluating FrameContext
 */
export function registerSystemFunctions(parser: Parser, getActiveContext: () => FrameContext | null): void {
  const fn = parser.functions

  // #BEAT([decay_seconds = 0.2]) & #BEAT_SECONDS(...)
  const beatFn = (decaySeconds = 0.2): number => {
    const ctx = getActiveContext()
    if (!ctx) return 0.0
    const decay = typeof decaySeconds === 'number' && decaySeconds > 0 ? decaySeconds : 0.2
    const t = ctx.secondsSinceLastBeat
    if (t >= decay) return 0.0
    return Math.exp((-3.0 * t) / decay)
  }
  fn.__FN_BEAT = beatFn
  fn.__FN_BEAT_SECONDS = beatFn

  // #BEAT_FRAMES([decay_frames = 12], [curve = "exponential"])
  fn.__FN_BEAT_FRAMES = (decayFrames = 12, curve = 'exponential'): number => {
    const ctx = getActiveContext()
    if (!ctx) return 0.0
    const frames = typeof decayFrames === 'number' && decayFrames > 0 ? decayFrames : 12
    const f = ctx.framesSinceLastBeat
    if (f >= frames) return 0.0

    if (curve === 'linear') {
      return 1.0 - f / frames
    }
    if (curve === 'logarithmic') {
      return Math.log(1.0 + ((frames - f) / frames) * 9.0) / Math.LN10
    }
    return Math.exp((-3.0 * f) / frames)
  }

  // #FFT(lower_band, [band_width = 0.02], [channel = 0])
  // Uses logarithmic frequency mapping: f = 20 * 10^(3x) across 20 Hz to 20,000 Hz.
  // Note: channel parameter (0 = Mono, 1 = Left, 2 = Right) is reserved for future stereo splitting.
  fn.__FN_FFT = (lowerBand = 0.0, bandWidth = 0.02): number => {
    const ctx = getActiveContext()
    if (!ctx || !ctx.frequencyData) return 0.0
    const freqData = ctx.frequencyData
    const binCount = freqData.length
    if (binCount === 0) return 0.0

    const lower = Math.max(0.0, Math.min(1.0, typeof lowerBand === 'number' ? lowerBand : 0.0))
    const width = Math.max(0.001, Math.min(1.0 - lower, typeof bandWidth === 'number' ? bandWidth : 0.02))

    // Logarithmic frequency bounds in Hz (20 Hz - 20000 Hz)
    const minFreq = logScaleToFrequency(lower)
    const maxFreq = logScaleToFrequency(lower + width)

    // Assuming Nyquist frequency = 22050 Hz (standard 44100 Hz sample rate)
    const nyquist = 22050
    const startBin = Math.max(0, Math.min(binCount - 1, Math.floor((minFreq / nyquist) * binCount)))
    const endBin = Math.max(startBin + 1, Math.min(binCount, Math.ceil((maxFreq / nyquist) * binCount)))

    let sum = 0
    let count = 0
    for (let i = startBin; i < endBin; i++) {
      sum += freqData[i] / 255.0
      count++
    }
    return count > 0 ? sum / count : 0.0
  }

  // #WAVEFORM(position, [channel = 0])
  // Note: channel parameter is reserved for future stereo splitting.
  fn.__FN_WAVEFORM = (position = 0.0): number => {
    const ctx = getActiveContext()
    if (!ctx || !ctx.timeDomainData) return 0.0
    const timeData = ctx.timeDomainData
    const length = timeData.length
    if (length === 0) return 0.0

    const pos = Math.max(0.0, Math.min(1.0, typeof position === 'number' ? position : 0.0))
    const index = Math.min(length - 1, Math.floor(pos * length))
    return timeData[index]
  }

  // #TRI(t): Normalized triangle wave [-1.0, 1.0] with period 1.0
  fn.__FN_TRI = (t: number): number => {
    const phase = ((t % 1.0) + 1.0) % 1.0
    return 1.0 - 4.0 * Math.abs(phase - 0.5)
  }

  // #SAW(t): Normalized sawtooth wave [-1.0, 1.0] with period 1.0
  fn.__FN_SAW = (t: number): number => {
    const phase = ((t % 1.0) + 1.0) % 1.0
    return 2.0 * phase - 1.0
  }

  // #SQR(t): Normalized square wave [-1.0, 1.0] with period 1.0
  fn.__FN_SQR = (t: number): number => {
    const phase = ((t % 1.0) + 1.0) % 1.0
    return phase < 0.5 ? 1.0 : -1.0
  }
}
