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
  - TypeScript, React 19, Vite, Tailwind CSS, Lucide React, `@xyflow/react`.
  - Three.js + WebGL 2.0 with custom GLSL shaders.
  - Native Web Audio API (FFT / waveform / beat detection) & Web MIDI API.
  - `expr-eval` for mathematical formula components.
  - Client-side SPA with IndexedDB / LocalStorage; future backend for community preset sharing.
- [x] **Code Style Guides:** [`conductor/code_styleguides/typescript.md`](./code_styleguides/typescript.md)
- [x] **Workflow Configuration:** [`conductor/workflow.md`](./workflow.md)
- [x] **Index Handshake:** [`conductor/index.md`](./index.md)

---

## Next Steps Before Implementation

1. **Stateless Subagent Review:**
   - [ ] Before commencing implementation, invoke stateless subagent(s) (acting as outside observers) to thoroughly review all generated Conductor artifacts (`product.md`, `product-guidelines.md`, `tech-stack.md`, `workflow.md`, `index.md`).
   - [ ] Incorporate review findings and resolve any architecture ambiguities.

2. **Track Planning:**
   - [ ] Use `conductor-new-track` to plan the initial Track 1 (e.g., Core Engine & Audio-Reactive Foundation MVP).
   - [ ] Create `plan.md` and define phases and tasks.

3. **Development Kickoff:**
   - [ ] Scaffold Vite project (`npm create vite@latest . -- --template react-ts`) and install core dependencies.
   - [ ] Implement tasks sequentially according to TDD workflow.
