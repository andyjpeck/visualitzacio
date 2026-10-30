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

## Completed Tracks

- [x] **Track 1: Minimal Reactive Canvas & Audio Testbed**
  - [x] Phase 1: Two-Plane Render Loop, Viewport Canvas, and CI/CD.
  - [x] Phase 2: Reactive Web Audio Pipeline (`AudioAnalyzer`, `AudioManager`, `$BASS`/`$MID`/`$TREBLE`/`$RMS`/`$BEAT`/`$BPM`) and 60 FPS telemetry overlay.
  - [x] Phase 3: Live Reactive Visual Scene, Clickable FPS Badge, Preset Settings Modal (`target_fps` & `resolution_scale`), and end-to-end interactive verification.
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

## Active Track

- [ ] **Track 5: Generative Visual Synthesis & Duperscope**
  - [ ] Phase 1: Multi-Statement Script Compiler & 4-Phase Execution Engine.
  - [ ] Phase 2: WebGL Duperscope Node (`DuperscopeNode`) & Custom Shaders.
  - [ ] Phase 3: Built-in Templates, Preset Schema v2 & Store Synchronization.
  - [ ] Phase 4: Studio Inspector 4-Phase Code Editor, Autocomplete & Outliner UI.
  - [ ] Phase 5: End-to-End Integration, Documentation Sync & Track Completion Protocol.
