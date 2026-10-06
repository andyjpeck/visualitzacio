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

## Active Milestone: Track 1 Planning & Scaffolding

1. **Track Planning (`conductor-new-track`):**
   - [ ] Plan Track 1: "Core Engine & Audio-Reactive Foundation MVP".
   - [ ] Generate `conductor/tracks/core_engine_foundation/spec.md` and `plan.md`.
   - [ ] Register track in `conductor/tracks.md`.

2. **Scaffolding & Initial Phase Implementation:**
   - [ ] Scaffold Vite TypeScript React project (`npm create vite@latest`).
   - [ ] Install core dependencies (Three.js, `@xyflow/react`, Zustand, Tailwind CSS, Lucide, `expr-eval`, Vitest).
   - [ ] Implement Phase 1 according to TDD workflow.
