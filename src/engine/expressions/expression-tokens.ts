import type { FrameContext } from '../../contracts/frame-context'

/**
 * Set of supported internal system variable tokens.
 */
export const SUPPORTED_SYSTEM_VARIABLES: ReadonlySet<string> = new Set([
  '__SYS_TIME',
  '__SYS_DT',
  '__SYS_FRAME',
  '__SYS_FPS',
  '__SYS_WIDTH',
  '__SYS_HEIGHT',
  '__SYS_ASPECT',
  '__SYS_PIXEL_RATIO',
  '__SYS_BASS',
  '__SYS_MID',
  '__SYS_TREBLE',
  '__SYS_RMS',
  '__SYS_BEAT',
  '__SYS_BPM',
])

/**
 * Set of supported internal system function tokens.
 */
export const SUPPORTED_SYSTEM_FUNCTIONS: ReadonlySet<string> = new Set([
  '__FN_BEAT',
  '__FN_BEAT_SECONDS',
  '__FN_BEAT_FRAMES',
  '__FN_FFT',
  '__FN_WAVEFORM',
  '__FN_TRI',
  '__FN_SAW',
  '__FN_SQR',
])

/**
 * Transforms user-facing syntax ($VARIABLE and #FUNCTION) into parser-friendly internal tokens.
 */
export function transformTokens(raw: string): string {
  return raw
    .replace(/\$([a-zA-Z0-9_]+)/g, '__SYS_$1')
    .replace(/#([a-zA-Z0-9_]+)/g, '__FN_$1')
}

/**
 * Synchronizes the internal scope object with active FrameContext telemetry in-place with zero allocations.
 */
export function updateScopeFromContext(scope: Record<string, number>, context: FrameContext): void {
  scope.__SYS_TIME = context.$TIME
  scope.__SYS_DT = context.$DT
  scope.__SYS_FRAME = context.$FRAME
  scope.__SYS_FPS = context.$FPS
  scope.__SYS_WIDTH = context.$WIDTH
  scope.__SYS_HEIGHT = context.$HEIGHT
  scope.__SYS_ASPECT = context.$ASPECT
  scope.__SYS_PIXEL_RATIO = context.$PIXEL_RATIO
  scope.__SYS_BASS = context.$BASS
  scope.__SYS_MID = context.$MID
  scope.__SYS_TREBLE = context.$TREBLE
  scope.__SYS_RMS = context.$RMS
  scope.__SYS_BEAT = context.$BEAT
  scope.__SYS_BPM = context.$BPM
}

/**
 * Creates dummy scope variables populated with valid test telemetry for dry-run evaluations.
 */
export function createDummyScope(): Record<string, number> {
  return {
    __SYS_TIME: 1.0,
    __SYS_DT: 0.016,
    __SYS_FRAME: 60,
    __SYS_FPS: 60.0,
    __SYS_WIDTH: 1920,
    __SYS_HEIGHT: 1080,
    __SYS_ASPECT: 16 / 9,
    __SYS_PIXEL_RATIO: 1.0,
    __SYS_BASS: 0.5,
    __SYS_MID: 0.5,
    __SYS_TREBLE: 0.5,
    __SYS_RMS: 0.5,
    __SYS_BEAT: 0.0,
    __SYS_BPM: 120.0,
  }
}
