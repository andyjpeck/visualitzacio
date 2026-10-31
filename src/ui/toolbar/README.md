# Floating Toolbar (`src/ui/toolbar/`)

This directory contains the main interactive control header of Visualització.

## Components & Modules

- **`toolbar.tsx`**: Top-right floating glassmorphic toolbar with cyberpunk aesthetics floating directly within the 3D playback viewport canvas. Integrates transport play/pause, source toggles (Sample, File, Mic), generative preset selector, volume slider, FPS overlay toggle, preset settings modal button, and studio/live mode toggle. Features dynamic responsive auto-scaling via `ResizeObserver` (`transform: scale(...)` from top-right) and adaptive row shifting (< 480px) to prevent viewport clipping.
- **`preset-selector.tsx`**: Cyberpunk glassmorphic preset dropdown allowing one-click loading of generative presets from the root `presets/` directory. If the active canvas contains child layers (`hasChildLayers`), loading is guarded by an overwrite confirmation modal (`BaseModalDialog`) displaying the target preset's name, author, and description before applying changes and pushing state onto the 100-step Undo stack (`Ctrl+Z`).
- **`preset-catalog.ts`**: Pure discovery utility that dynamically scans root `presets/*.json` via Vite's `import.meta.glob('/presets/*.json', { eager: true })` without hardcoded preset lists, and provides the `hasChildLayers` scene emptiness detection helper.
- **`audio-progress-scrubber.tsx`**: Audio file loading progress bar with stage messaging, and interactive track seek scrubber with 60 FPS direct-DOM time display.
- **`audio-error-toast.tsx`**: Floating accessible alert toast for microphone permission denials and audio file decoding failures.

## Test Suites

- **`toolbar.test.tsx`**: Vitest unit tests verifying play/pause transitions, source switching (Sample → File → Mic), seeking, volume adjustments, loading states, error dismissing, responsive auto-scaling, compact row shifting, and preset selector mounting.
- **`preset-selector.test.tsx`**: Component tests verifying immediate loading on empty canvas, protective confirmation modal on non-empty canvas, cancel flow, and overwrite confirmation with undo tracking.
- **`preset-catalog.test.ts`**: Unit tests verifying dynamic glob discovery, metadata extraction, sorting, fallback slugs, and `hasChildLayers` detection logic.
