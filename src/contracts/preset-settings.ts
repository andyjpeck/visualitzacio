/**
 * Allowed internal rendering resolution multipliers for adaptive GPU performance.
 */
export type ResolutionScale = 1.0 | 0.75 | 0.5 | 0.25

/**
 * Frequency band cutoffs (in Hz) for audio telemetry extraction.
 */
export interface AudioBandsSettings {
  /** Low cutoff for $BASS in Hz (default: 20 Hz). */
  bassMin: number
  /** High cutoff for $BASS in Hz (default: 250 Hz). */
  bassMax: number
  /** Low cutoff for $MID in Hz (default: 250 Hz). */
  midMin: number
  /** High cutoff for $MID in Hz (default: 4000 Hz). */
  midMax: number
  /** Low cutoff for $TREBLE in Hz (default: 4000 Hz). */
  trebleMin: number
  /** High cutoff for $TREBLE in Hz (default: 16000 Hz). */
  trebleMax: number
}

/**
 * Standard default audio frequency band boundaries.
 */
export const DEFAULT_AUDIO_BANDS: AudioBandsSettings = {
  bassMin: 20,
  bassMax: 250,
  midMin: 250,
  midMax: 4000,
  trebleMin: 4000,
  trebleMax: 16000,
}

/**
 * Global preset performance configuration controlling frame pacing, resolution, and audio DSP bands.
 */
export interface PresetSettings {
  /** Target frame rate for requestAnimationFrame pacing (e.g. 30, 60, 120, 144). */
  target_fps: number
  /** Internal render resolution scale multiplier. */
  resolution_scale: ResolutionScale
  /** Audio frequency bands for $BASS, $MID, and $TREBLE DSP extraction. */
  audio_bands?: AudioBandsSettings
}

/**
 * Default preset settings (60 FPS, native 1.0x resolution scale, default audio bands).
 */
export const DEFAULT_PRESET_SETTINGS: PresetSettings = {
  target_fps: 60,
  resolution_scale: 1.0,
  audio_bands: { ...DEFAULT_AUDIO_BANDS },
}
