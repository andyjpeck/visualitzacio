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
- [x] **Live GitHub Pages Deployment:** Built & verified at https://andyjpeck.github.io/visualitzacio/ via GitHub Actions.
- [x] **Stateless Subagent Architectural Review:** Completed and findings integrated into `tech-stack.md`.

---

## Completed Tracks

- [x] **Track 1: Minimal Reactive Canvas & Audio Testbed**
  - [x] Phase 1: Two-Plane Render Loop, Viewport Canvas, and CI/CD.
  - [x] Phase 2: Reactive Web Audio Pipeline (`AudioAnalyzer`, `AudioManager`, `$BASS`/`$MID`/`$TREBLE`/`$RMS`/`$BEAT`/`$BPM`) and 60 FPS telemetry overlay.
  - [x] Phase 3: Live Reactive Visual Scene, Clickable FPS Badge, Preset Settings Modal (`target_fps` & `resolution_scale`), and end-to-end interactive verification.

---

- [x] **Track 2: Dynamic Expression Engine & Parameter Binding**
  - [x] Phase 1: Core Expression Parser, AST Compiler & System Variables.
  - [x] Phase 2: Audio Function Library (`#FFT`, `#WAVEFORM`, `#BEAT`, `#BEAT_FRAMES`, `#TRI`, `#SAW`, `#SQR`, math helpers).
  - [x] Phase 3: `DynamicParam` Abstraction & Interactive Formula Testbed HUD.
  - [x] Phase 4: Quality Assurance, Documentation & Pre-Upload Verification.

---

- [x] **Track 3: Modular Frame Buffer, Ping-Pong Feedback & Named Buffers**
  - [x] Phase 1: Frame Buffer Node & Dual-FBO Ping-Pong Core.
  - [x] Phase 2: Ping-Pong Feedback Motion Trails & Multi-Pass Shader Blending.
  - [x] Phase 3: Named Buffers (`@NAME`), Static Image Component & Built-in Templates.
  - [x] Phase 4: UI Integration, Template Selector & Toolbar Integration.
  - [x] Phase 5: Quality Assurance, Documentation & Mandatory Track Completion Protocol.

---

- [x] **Track 4: Visual Studio Shell, Node Graph & Preset Import/Export**
  - [x] Phase 1: Dependencies, Layout & Studio Shell Framework.
  - [x] Phase 2: Hierarchical Layer Tree Outliner & Node Graph Pipeline.
  - [x] Phase 3: Universal `f(x)` Parameter Inspector, Modals & Viewport Toolbar Integration.
  - [x] Phase 4: 100-Step Undo / Redo Engine & Preset Serialization.
  - [x] Phase 5: End-to-End Integration, Documentation Sync & Track Protocol.

---

- [x] **Track 5: Generative Visual Synthesis & Duperscope**
  - [x] Phase 1: Multi-Statement Script Compiler & 4-Phase Execution Engine.
  - [x] Phase 2: WebGL Duperscope Node (DuperscopeNode) & Custom Shaders.
  - [x] Phase 3: Built-in Templates, Preset Schema v2 & Store Synchronization.
  - [x] Phase 4: Studio Inspector 4-Phase Code Editor, Autocomplete & Outliner UI.
  - [x] Phase 5: End-to-End Integration, Documentation Sync & Track Completion Protocol.

---

- [x] **Track 11: High-Fidelity Verification Overhaul (Playwright, WebGL Smoke Tests, & Agent Quality Gates)**
  - [x] Phase 1: Modal Stacking, Portal Guarantees & Z-Index Guardrails.
  - [x] Phase 2: WebGL Pipeline & Preset Integration Smoke Tests.
  - [x] Phase 3: Playwright Real-Browser E2E Suite.
  - [x] Phase 4: Conductor 3-Tier Verification Gates & Protocol Sync.

---

- [x] **Track 12: Toolbar Preset Selector & Overwrite Confirmation Guard**
  - [x] Phase 1: Dynamic Preset Discovery & Emptiness Detection Utilities (TDD).
  - [x] Phase 2: Preset Selector Component & Confirmation Dialog (TDD).
  - [x] Phase 3: Integration, Regression Verification & Documentation.

---

## Active Track

*None currently active. Track 12 completed.*

---

## Planned Future Tracks (Tracks 6 – 10)

- [ ] **Track 6: Next-Generation Component Suite (Colormap, LightSource, 3dMesh)**
- [ ] **Track 7: Custom GLSL Shader Passes & Post-Processing Pipeline**
- [ ] **Track 8: Web MIDI Hardware Integration & Live Performance Mode**
- [ ] **Track 9: Preset Library, Community Sharing & Detached Display Output**
- [ ] **Track 10: Rust + WASM Engine Architecture & Desktop Portability Evaluation**
  - [ ] Feasibility study & boundary benchmarks (TS vs. Rust WASM 4,096-point loop).
  - [ ] Zero-copy shared memory WebGL attribute buffer prototype.
  - [ ] Rust AudioWorklet DSP frequency extraction evaluation.
  - [ ] Standalone desktop performance runtime via Tauri.
