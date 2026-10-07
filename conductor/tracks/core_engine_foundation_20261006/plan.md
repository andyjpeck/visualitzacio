# Implementation Plan: Core Engine Foundation & Modular Frame Buffer MVP

## Phase 1: Project Scaffolding & Two-Plane Render Loop Core

- [ ] Task: Project Scaffolding with Vite, React 19, TypeScript, and Tailwind CSS
  - [ ] Initialize Vite React TypeScript project with Tailwind CSS configuration
  - [ ] Configure Vitest and React Testing Library setup
  - [ ] Configure ESLint and Prettier per `code_styleguides/typescript.md`
- [ ] Task: Two-Plane Architecture Skeleton (TDD)
  - [ ] Write unit tests for decoupled Engine Loop controller (state subscriber vs. RAF ticker) and throttled FPS counter
  - [ ] Implement `RenderEngine` core class managing `requestAnimationFrame`, throttled FPS monitoring, and Three.js canvas mount
  - [ ] Create Zustand store for UI/playback state (`useAppStore`) with `showFpsOverlay` toggle preference (default `true`) ensuring zero audio/RAF tick re-renders
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
  - [ ] Write unit tests for `ExpressionPreprocessor` token rewriting (`%FUNC(` $\to$ `__fn_FUNC(`, `$VAR` $\to$ `__var_VAR`), preserving modulo (`%`) operator
  - [ ] Write unit tests for `$SPECIAL_VALUE` token extraction (`$BASS`, `$MID`, `$TREBLE`, `$BPM`, `$RMS`, `$TIME`, binary `$BEAT`, `$FRAME`)
  - [ ] Write unit tests for `%FFT(lower, width, channel)` system function evaluation with logarithmic frequency mapping ($20\text{Hz}-20000\text{Hz}$)
  - [ ] Write unit tests for `%BEAT()`, `%BEAT_SECONDS(decay_seconds)`, and `%BEAT_FRAMES(decay_frames)` exponential decay envelopes
  - [ ] Write unit tests for mathematical expression compilation, NaN/Infinity fallback, Frame 0 initial literal fallback, and zero-allocation per-frame evaluation
  - [ ] Implement `ExpressionEngine` wrapping `expr-eval` with preprocessor, pre-allocated evaluation scope, function bindings, and safe numeric clamping
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 3: Three.js Compositing Engine & 6 Custom Blend Modes

- [ ] Task: Offscreen Frame Buffer Pipeline & Buffer Pool (TDD)
  - [ ] Write tests for render target allocation, resizing, and ping-pong texture management
  - [ ] Write tests for Master Frame Buffer dual-FBO ping-pong feedback loop vs. clean slate clear mode
  - [ ] Write tests for `BufferPool` managing named render targets (`save_to` and `load_from` lookup, DAG cycle detection, and buffer-disabled error states)
  - [ ] Implement `BufferPool` and `FrameBufferRenderer` managing `THREE.WebGLRenderTarget` textures
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
- [ ] Task: Frame Buffer Container & Named Buffer Routing (TDD)
  - [ ] Write tests for container child registration and hierarchical render dispatching
  - [ ] Write tests for Master Frame Buffer root lifecycle (verifying `blend_mode: "replace"` creates a clean slate while feedback blend modes feed previous frame texture into next frame)
  - [ ] Write tests for `save_to="#NAME"` publishing to `BufferPool` and `load_from="#NAME"` upstream texture sampling (e.g., 4-corner multi-quad replication)
  - [ ] Implement `FrameBufferContainer` rendering child component textures into its render target, saving to named targets, and sampling from loaded buffers
  - [ ] Wire per-frame dynamic expression evaluation into Frame Buffer transformation uniforms (evaluating expressions like `blend_mode: %FFT(0, 0.3, 1) * 0.5` or `scale: 1.0 + %BEAT(0.25) * 0.3` each frame)
  - [ ] Write integration test verifying `RenderEngine` driving `FrameBufferContainer` with active audio telemetry and expression modulation
- [ ] Task: Declarative Nested JSON Preset Serializer (TDD)
  - [ ] Write unit tests for nested tree serialization (`root` strictly as Master Frame Buffer with `children` arrays, `save_to`, `load_from`, expression parameters) and deserialization
  - [ ] Implement `PresetSerializer` importing/exporting full component trees and parameter expression states without fragile manual canvas coordinates
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 5: Split-View UI, Universal `f(x)` Inspector & Diagnostics Console

- [ ] Task: Diagnostics Console & Status Indicator (TDD)
  - [ ] Write unit tests for diagnostic log capture and warning/error badge triggers (including buffer routing cycle alerts)
  - [ ] Implement collapsible bottom Diagnostics Console with status bar alert badge
- [ ] Task: Universal `f(x)` Parameter Component (TDD)
  - [ ] Write unit tests for parameter mode toggle (Fixed widget vs. Dynamic formula input)
  - [ ] Write unit tests for inline autocomplete dropdown triggered by `$` and `%`, testing definition tooltips, usage documentation, keyboard navigation, and syntax status chip
  - [ ] Implement `ParameterControl` component featuring the `f(x)` toggle button, inline token autocomplete dropdown with parameter documentation, and syntax validation status chip
- [ ] Task: Split Layout, Node Inspector & Preset Import/Export UI (TDD)
  - [ ] Write tests for node selection, inspector parameter synchronization, FPS overlay toggle, and preset drag-drop/clipboard import with automatic tree layout
  - [ ] Implement Split-View UI: Left preview viewport with toggleable FPS counter HUD overlay (on by default in Studio mode), Right vertically split panel
  - [ ] Integrate `@xyflow/react` in top-right panel displaying the non-deletable Master Frame Buffer container anchor and nested Image node with auto-layout
  - [ ] Integrate `ParameterControl` into bottom-right Node Inspector for seamless parameter editing
  - [ ] Add header buttons for Preset Export (.json download), Import (file upload/drop/paste), and FPS overlay toggle
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
