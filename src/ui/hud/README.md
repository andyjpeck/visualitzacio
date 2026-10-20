# HUD Overlays (`src/ui/hud/`)

This directory contains Head-Up Display (HUD) overlay elements floating above the 3D WebGL canvas.

## Components

- **`audio-telemetry-overlay.tsx`**: Bottom-left floating glassmorphic telemetry dashboard displaying 60 FPS meter bars for Bass, Mid, Treble, RMS, an animated Beat pill indicator, rolling BPM tempo counter, and real-time $TIME and $FRAME tickers via direct DOM manipulation with zero React re-renders.
- **`fps-badge.tsx`**: Top-left floating FPS badge displaying current vs target frames per second, color-coded for nominal vs throttled performance.
- **`audio-telemetry-overlay.test.tsx`**: Vitest tests verifying DOM element mounting, RAF loop lifecycle, and telemetry tickers.
- **`fps-badge.test.tsx`**: Vitest tests verifying FPS display, throttling colors, and toggle behavior.
