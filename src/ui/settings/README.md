# Performance Settings (`src/ui/settings/`)

This directory contains configuration dialogs for performance presets and DSP frequency bands.

## Components

- **`preset-settings-modal.tsx`**: Accessible modal dialog for configuring target frame rates (30, 60, 120 FPS) and internal WebGL resolution scales (1.0x Native, 0.75x Balanced, 0.50x Performance, 0.25x Low-Fi). Supports backdrop closing, Escape key dismissal, and Zustand state synchronization.
- **`frequency-band-row.tsx`**: Reusable input card for configuring the frequency cutoff boundaries of DSP bands (`$BASS`, `$MID`, `$TREBLE`) with numeric step clamping.
- **`preset-settings-modal.test.tsx`**: Vitest tests verifying target frame rate updates, resolution scaling, frequency band adjustments, reset defaults, and keyboard dismissal.
