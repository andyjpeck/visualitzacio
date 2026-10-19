# Global Application Store (`src/ui/store/`)

This directory provides centralized state management for low-frequency UI states using Zustand.

## Modules

- [**`app-store.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/store/app-store.ts):
  - State fields:
    - `isPlaying`: Global audio playback state.
    - `sourceType`: Currently selected audio input (`'sample'`, `'file'`, `'mic'`).
    - `volume`: Output audio volume in [0.0, 1.0].
    - `audioFileName`: Name of user-loaded custom audio file.
    - `audioError`: Descriptive error message when hardware permissions fail or file decoding errors occur.
    - `showFpsOverlay`: Visibility toggle for the FPS HUD badge.
    - `isPresetSettingsOpen`: Modal open/close state.
    - `currentFps`: Measured frame rate reported by `RenderEngine`.
    - `targetFps` & `resolutionScale`: Performance preset tuning.
  - Action setters for all state mutations.
