# Floating Toolbar (`src/ui/toolbar/`)

This directory contains the main interactive control header of Visualització.

## Components

- **`toolbar.tsx`**: Top-right floating glassmorphic toolbar with cyberpunk aesthetics floating directly within the 3D playback viewport canvas. Integrates transport play/pause, source toggles (Sample, File, Mic), volume slider, FPS overlay toggle, preset settings modal button, and studio/live mode toggle. Features dynamic responsive auto-scaling via `ResizeObserver` (`transform: scale(...)` from top-right) and adaptive row shifting (< 480px) to prevent viewport clipping.
- **`audio-progress-scrubber.tsx`**: Audio file loading progress bar with stage messaging, and interactive track seek scrubber with 60 FPS direct-DOM time display.
- **`audio-error-toast.tsx`**: Floating accessible alert toast for microphone permission denials and audio file decoding failures.
- **`toolbar.test.tsx`**: Vitest unit tests verifying play/pause transitions, source switching (Sample → File → Mic), seeking, volume adjustments, loading states, error dismissing, responsive auto-scaling, and compact row shifting.
