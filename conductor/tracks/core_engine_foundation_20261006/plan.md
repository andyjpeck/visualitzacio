# Implementation Plan: Core Engine Foundation & Modular Frame Buffer MVP

## Phase 1: Project Scaffolding & Two-Plane Render Loop Core

- [ ] Task: Project Scaffolding with Vite, React 19, TypeScript, and Tailwind CSS
  - [ ] Initialize Vite React TypeScript project with Tailwind CSS configuration
  - [ ] Configure Vitest and React Testing Library setup
  - [ ] Configure ESLint and Prettier per `code_styleguides/typescript.md`
- [ ] Task: Two-Plane Architecture Skeleton (TDD)
  - [ ] Write unit tests for decoupled Engine Loop controller (state subscriber vs. RAF ticker)
  - [ ] Implement `RenderEngine` core class managing `requestAnimationFrame`, FPS monitoring, and Three.js canvas mount
  - [ ] Create Zustand store for UI/playback state (`useAppStore`) ensuring zero audio tick re-renders
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 2: Reactive Audio Engine & Dynamic Expression Evaluator

- [ ] Task: Audio Feature Extraction & DSP Utilities (TDD)
  - [ ] Write unit tests for logarithmic frequency band aggregation (`$BASS`, `$MID`, `$TREBLE`) and channel splitting
  - [ ] Write unit tests for binary `$BEAT` detection (evaluating to 1 on beat frame, 0 otherwise)
  - [ ] Write unit tests for RMS energy smoothing and attack/decay calculations
  - [ ] Implement `AudioAnalyzer` utility class computing normalized values from raw Web Audio `AnalyserNode`
- [ ] Task: Web Audio Manager & Source Selector (TDD)
  - [ ] Write tests for audio source switching (bundled sample vs. microphone)
  - [ ] Implement `AudioManager` with autoplay policy unlock, sample player, and uncompressed `getUserMedia` stream capture
  - [ ] Bundle a lightweight default ambient/rhythm audio test sample
- [ ] Task: Dynamic Expression Engine & Sandboxing (TDD)
  - [ ] Write unit tests for `$SPECIAL_VALUE` token extraction (`$BASS`, `$MID`, `$TREBLE`, `$BPM`, `$RMS`, `$TIME`, binary `$BEAT`, `$FRAME`)
  - [ ] Write unit tests for `%FFT(lower, width, channel)` system function evaluation with logarithmic frequency mapping ($20\text{Hz}-20000\text{Hz}$)
  - [ ] Write unit tests for `%BEAT()`, `%BEAT_SECONDS(decay_seconds)`, and `%BEAT_FRAMES(decay_frames)` exponential decay envelopes
  - [ ] Write unit tests for mathematical expression compilation, NaN/Infinity fallback, and zero-allocation per-frame evaluation
  - [ ] Implement `ExpressionEngine` wrapping `expr-eval` with pre-allocated evaluation scope, `%FFT` and `%BEAT` function bindings, and safe numeric clamping
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 3: Three.js Compositing Engine & 6 Custom Blend Modes

- [ ] Task: Offscreen Frame Buffer Pipeline (TDD)
  - [ ] Write tests for render target allocation, resizing, and ping-pong texture management
  - [ ] Implement `FrameBufferRenderer` managing `THREE.WebGLRenderTarget` textures
- [ ] Task: Custom GLSL Blend Mode Compositor (TDD)
  - [ ] Write tests verifying shader compilation and blend mode uniform switching
  - [ ] Implement GLSL fragment shader supporting all 6 blend modes: Replace, Additive, Maximum, Minimum, Subtractive, Multiplicative
  - [ ] Implement full-screen compositing quad material with uniforms for position, scale, rotation, and opacity
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 4: Modular Visual Components & Declarative Preset Schema

- [ ] Task: Static Image Component (TDD)
  - [ ] Write tests for texture loading, drag-and-drop validation, and fallback sample image
  - [ ] Implement `StaticImageComponent` generating a `THREE.Texture` and quad geometry
  - [ ] Bundle a default test graphic
- [ ] Task: Frame Buffer Container Component Hierarchy (TDD)
  - [ ] Write tests for container child registration and hierarchical render dispatching
  - [ ] Implement `FrameBufferContainer` rendering child component textures into its render target
  - [ ] Wire per-frame dynamic expression evaluation into Frame Buffer transformation uniforms (evaluating expressions like `Blend: %FFT(0, 0.3, 1) * 0.5` or `Scale: 1.0 + %BEAT(0.25) * 0.3` each frame)
- [ ] Task: Declarative Nested JSON Preset Serializer (TDD)
  - [ ] Write unit tests for nested tree serialization (`children` arrays) and deserialization
  - [ ] Implement `PresetSerializer` importing/exporting full component trees and parameter expression states
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 5: Split-View UI, Universal `f(x)` Inspector & Diagnostics Console

- [ ] Task: Diagnostics Console & Status Indicator (TDD)
  - [ ] Write unit tests for diagnostic log capture and warning/error badge triggers
  - [ ] Implement collapsible bottom Diagnostics Console with status bar alert badge
- [ ] Task: Universal `f(x)` Parameter Component (TDD)
  - [ ] Write unit tests for parameter mode toggle (Fixed widget vs. Dynamic formula input)
  - [ ] Write unit tests for inline autocomplete dropdown triggered by `$` and `%`, testing definition tooltips, live value display, and keyboard navigation
  - [ ] Implement `ParameterControl` component featuring the `f(x)` toggle button, inline token autocomplete dropdown with real-time value previews and parameter documentation, and evaluation chip
- [ ] Task: Split Layout, Node Inspector & Preset Import/Export UI (TDD)
  - [ ] Write tests for node selection and inspector parameter synchronization
  - [ ] Implement Split-View UI: Left preview viewport, Right vertically split panel
  - [ ] Integrate `@xyflow/react` in top-right panel displaying Frame Buffer container and Image node
  - [ ] Integrate `ParameterControl` into bottom-right Node Inspector for seamless parameter editing
  - [ ] Add header buttons for Preset Export (.json download) and Import (file upload/drop)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
