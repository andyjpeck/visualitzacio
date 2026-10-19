# Project Setup Tasks & Resumption Checklist

## Current Setup Status: Conductor Scaffolding

- [x] **Product Definition:** [`conductor/product.md`](./product.md)
  - Vision, target personas (casual listeners & live VJ/DJ performers), core capabilities (Web Audio, Three.js/WebGL, Web MIDI, modular node pipeline).
- [x] **Product Guidelines:** [`conductor/product-guidelines.md`](./product-guidelines.md)
  - Cyberpunk/Neon default theme & Dark Studio theme (runtime theme switcher).
  - Split-view UI (node graph + visualizer canvas) and full-screen live performance mode.
  - Dedicated diagnostics console with status bar glow/badge indicators.
  - Architecture-level scalability-by-design for future adaptive scaling.
- [x] **Technology Stack:** [`conductor/tech-stack.md`](./tech-stack.md)
  - Hardened with Two-Plane architecture (State Plane vs. Render Data Plane).
  - Dual-FBO Ping-Pong feedback loop for AVS/MilkDrop visuals.
  - Logarithmic FFT binning, raw mic capture flags, and zero-allocation render loop policy.
  - Pre-compiled, sandboxed `expr-eval` uniform modulation.
- [x] **Code Style Guides:** [`conductor/code_styleguides/typescript.md`](./code_styleguides/typescript.md)
- [x] **Workflow Configuration:** [`conductor/workflow.md`](./workflow.md)
- [x] **Index Handshake:** [`conductor/index.md`](./index.md)
- [x] **Stateless Subagent Architectural Review:** Completed and findings integrated into `tech-stack.md`.

---

## Active Milestone: Track 1 — Minimal Reactive Canvas & Audio Testbed

1. **Track Planning (`conductor-new-track`):**
   - [x] Define 8-track granular roadmap in [`conductor/tracks.md`](./tracks.md).
   - [x] Plan Track 1: "Minimal Reactive Canvas & Audio Testbed".
   - [x] Generate [`conductor/tracks/track_1_reactive_canvas_audio_testbed/spec.md`](./tracks/track_1_reactive_canvas_audio_testbed/spec.md) and [`plan.md`](./tracks/track_1_reactive_canvas_audio_testbed/plan.md).

2. **Track 1 Implementation (`conductor-implement`):**
   - [ ] Phase 1: Project Scaffolding (Vite, React 19, TypeScript, Tailwind CSS, Three.js, Zustand, Lucide, Vitest), Two-Plane Render Loop, and GitHub Pages CI/CD deployment checkpoint.
   - [ ] Phase 2: Reactive Web Audio Pipeline (`AudioAnalyzer`, `AudioManager`, `$BASS`/`$MID`/`$TREBLE`/`$RMS`/`$BEAT`/`$BPM`) and debug audio meter visual checkpoint.
   - [ ] Phase 3: Live Reactive Visual Scene, Clickable FPS Badge (`target_fps` & `resolution_scale` preset settings), and end-to-end interactive verification.
