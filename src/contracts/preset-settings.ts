/**
 * Allowed internal rendering resolution multipliers for adaptive GPU performance.
 */
export type ResolutionScale = 1.0 | 0.75 | 0.5 | 0.25

/**
 * Global preset performance configuration controlling frame pacing and resolution.
 */
export interface PresetSettings {
  /** Target frame rate for requestAnimationFrame pacing (e.g. 30, 60, 120, 144). */
  target_fps: number
  /** Internal render resolution scale multiplier. */
  resolution_scale: ResolutionScale
}

/**
 * Default preset settings (60 FPS, native 1.0x resolution scale).
 */
export const DEFAULT_PRESET_SETTINGS: PresetSettings = {
  target_fps: 60,
  resolution_scale: 1.0,
}
