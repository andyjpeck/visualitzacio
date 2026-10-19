# HUD Overlays (`src/ui/hud/`)

This directory contains Head-Up Display (HUD) overlay elements floating above the 3D WebGL canvas.

## Components

- [**`audio-telemetry-overlay.tsx`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/hud/audio-telemetry-overlay.tsx):
  - Bottom-left floating glassmorphic telemetry dashboard.
  - Displays instant 60 FPS meter bars for Bass, Mid, Treble, and RMS energy.
  - Features an animated percussive Beat pill indicator and rolling BPM tempo counter.
  - Employs direct DOM ref manipulation in a `requestAnimationFrame` loop, producing **zero React re-renders** during audio playback.

- [**`fps-badge.tsx`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/hud/fps-badge.tsx):
  - Top-left floating FPS badge displaying current vs target frames per second.
  - Color-codes performance dynamically: cyan for nominal performance, amber when throttling below target, and red when dropping below 80% target FPS.
