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
  - [ ] Write unit tests for logarithmic frequency band aggregation (`$BASS`, `$MID`, `$TREBLE`)
  - [ ] Write unit tests for RMS energy smoothing and attack/decay calculations
  - [ ] Implement `AudioAnalyzer` utility class computing normalized values from raw Web Audio `AnalyserNode`
- [ ] Task: Web Audio Manager & Source Selector (TDD)
  - [ ] Write tests for audio source switching (bundled sample vs. microphone)
  - [ ] Implement `AudioManager` with autoplay policy unlock, sample player, and uncompressed `getUserMedia` stream capture
  - [ ] Bundle a lightweight default ambient/rhythm audio test sample
- [ ] Task: Dynamic Expression Engine & Sandboxing (TDD)
  - [ ] Write unit tests for `$SPECIAL_VALUE` token extraction (`$BASS`, `$MID`, `$TREBLE`, `$BPM`, `$RMS`, `$TIME`, `$BEAT`, `$FRAME`)
  - [ ] Write unit tests for mathematical expression compilation, NaN/Infinity fallback, and zero-allocation per-frame evaluation
  - [ ] Implement `ExpressionEngine` wrapping `expr-eval` with pre-allocated evaluation scope and safe numeric clamping
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

## Phase 4: Modular Visual Components & Dynamic Expression Binding

- [ ] Task: Static Image Component (TDD)
  - [ ] Write tests for texture loading, drag-and-drop validation, and fallback sample image
  - [ ] Implement `StaticImageComponent` generating a `THREE.Texture` and quad geometry
  - [ ] Bundle a default test graphic
- [ ] Task: Frame Buffer Container Component Hierarchy (TDD)
  - [ ] Write tests for container child registration and hierarchical render dispatching
  - [ ] Implement `FrameBufferContainer` rendering child component textures into its render target
  - [ ] Wire per-frame dynamic expression evaluation into Frame Buffer transformation uniforms (evaluating expressions like `Blend: $BASS * 0.5` or `Scale: 1.0 + $BASS * 0.3` each frame)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Phase 5: Split-View UI, Universal `f(x)` Inspector & Diagnostics Console

- [ ] Task: Diagnostics Console & Status Indicator (TDD)
  - [ ] Write unit tests for diagnostic log capture and warning/error badge triggers
  - [ ] Implement collapsible bottom Diagnostics Console with status bar alert badge
- [ ] Task: Universal `f(x)` Parameter Component (TDD)
  - [ ] Write unit tests for parameter mode toggle (Fixed widget vs. Dynamic formula input)
  - [ ] Implement `ParameterControl` component featuring the `f(x)` toggle button, formula autocomplete for `$SPECIAL_VALUE` tokens, and real-time evaluation preview chip
- [ ] Task: Split Layout & Node Inspector (TDD)
  - [ ] Write tests for node selection and inspector parameter synchronization
  - [ ] Implement Split-View UI: Left preview viewport, Right vertically split panel
  - [ ] Integrate `@xyflow/react` in top-right panel displaying Frame Buffer container and Image node
  - [ ] Integrate `ParameterControl` into bottom-right Node Inspector for seamless parameter editing
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
