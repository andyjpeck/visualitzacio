# Contracts & Interfaces (`src/contracts/`)

The `contracts` directory contains core TypeScript data contracts, interfaces, and mathematical schemas shared across the engine, audio pipeline, and user interface.

## Key Contracts

- [**`frame-context.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/contracts/frame-context.ts):
  - Defines the `FrameContext` interface: the mutable, pre-allocated telemetry struct passed into every render pass and shader node.
  - Contains timing metrics (`$TIME`, `$DT`, `$FRAME`, `$FPS`), viewport metrics (`$WIDTH`, `$HEIGHT`, `$ASPECT`, `$PIXEL_RATIO`), and audio metrics (`$BASS`, `$MID`, `$TREBLE`, `$RMS`, `$BEAT`, `$BPM`).
  - Provides `createDefaultFrameContext()` for initial state construction.

- [**`preset-settings.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/contracts/preset-settings.ts):
  - Defines `PresetSettings` and `ResolutionScale` (`1.0`, `0.75`, `0.5`, `0.25`).
  - Defines `AudioBandsSettings` and `DEFAULT_AUDIO_BANDS` specifying customizable cutoff boundaries for `$BASS` (default 20–250 Hz), `$MID` (default 250–4000 Hz), and `$TREBLE` (default 4000–16000 Hz).
  - Sets default target FPS (60 FPS) and rendering scale for hardware efficiency.

- [**`preset-schema.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/contracts/preset-schema.ts):
  - Defines portable JSON preset specification contracts (`Preset`, `PresetMetadata`, `PresetNode`, `PresetEdge`, `PresetFeedbackConfig`, `PresetSettingsData`).
  - Provides `validatePreset()` to enforce structural integrity, single Master Output constraints, parent validation, and schema versioning.

- [**`renderer-like.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/contracts/renderer-like.ts):
  - `RendererLike`: Decoupled abstraction over Three.js `WebGLRenderer` enabling headless unit testing without requiring real GPU contexts.
  - `Scheduler`: Abstraction over `requestAnimationFrame` / `cancelAnimationFrame` for deterministic virtual-clock tests.
  - `VisualNode`: Standard lifecycle contract (`init`, `resize`, `update`, `dispose`) implemented by all visual elements in the rendering tree.
