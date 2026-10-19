# HUD Overlays (`src/ui/hud/`)

This directory contains Head-Up Display (HUD) overlay elements floating above the 3D WebGL canvas.

## Components

- **`audio-telemetry-overlay.tsx`**: Bottom-left floating glassmorphic telemetry dashboard displaying 60 FPS meter bars for Bass, Mid, Treble, RMS, an animated Beat pill indicator, rolling BPM tempo counter, and real-time $TIME and $FRAME tickers via direct DOM manipulation with zero React re-renders.
- **`fps-badge.tsx`**: Top-left floating FPS badge displaying current vs target frames per second, color-coded for nominal vs throttled performance.
- **`formula-testbed.tsx`**: Interactive floating testbed dialog for testing mathematical expressions ($VARIABLE, #FUNCTION). Integrates draggable header, collapsible reference accordion, preset formula chips, syntax validation input, 60 FPS canvas sparkline, and crystal scale binding toggle. Composes subcomponents from `src/ui/expressions/` and `src/ui/hooks/`.
- **`formula-testbed.test.tsx`**: Vitest unit and integration tests covering dialog open/close, dragging, preset formulas, expression validation, DOM readout, canvas sparkline buffer management, and scene crystal binding.
- **`audio-telemetry-overlay.test.tsx`**: Vitest tests verifying DOM element mounting, RAF loop lifecycle, and telemetry tickers.
- **`fps-badge.test.tsx`**: Vitest tests verifying FPS display, throttling colors, and toggle behavior.
