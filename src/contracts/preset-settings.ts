export type ResolutionScale = 1.0 | 0.75 | 0.5 | 0.25

export interface PresetSettings {
  target_fps: number // default 60
  resolution_scale: ResolutionScale // default 1.0
}

export const DEFAULT_PRESET_SETTINGS: PresetSettings = {
  target_fps: 60,
  resolution_scale: 1.0,
}
