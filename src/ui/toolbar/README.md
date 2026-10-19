# Floating Toolbar (`src/ui/toolbar/`)

This directory contains the main interactive control header of Visualització.

## Components

- **`toolbar.tsx`**: Top-right floating glassmorphic toolbar with cyberpunk aesthetics, integrating transport play/pause, source toggles, volume slider, FPS overlay toggle, preset settings modal, and expression testbed f(x) launcher.
- **`audio-progress-scrubber.tsx`**: Audio file loading progress bar with stage messaging, and interactive track seek scrubber with 60 FPS direct-DOM time display.
- **`audio-error-toast.tsx`**: Floating accessible alert toast for microphone permission denials and audio file decoding failures.
- **`toolbar.test.tsx`**: Vitest unit tests verifying play/pause transitions, source switching (Sample → File → Mic), seeking, volume adjustments, loading states, and error dismissing.
