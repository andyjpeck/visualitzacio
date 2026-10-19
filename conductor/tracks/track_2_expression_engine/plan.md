# Implementation Plan: Track 2 — Dynamic Expression Engine & Parameter Binding

## Phase 1: Core Expression Parser, AST Compiler & System Variables

- [ ] Task: Sandboxed Parser & AST Compiler (`ExpressionEngine`) (TDD)
  - [ ] Write unit tests for `ExpressionEngine.compile(expr)` verifying AST caching, arithmetic operations, operator precedence, standard math functions (`sin`, `cos`, `abs`, `min`, `max`), and syntax error reporting.
  - [ ] Write unit tests verifying sandboxing: syntax containing prototype pollution, property accessors, or assignment operators is rejected.
  - [ ] Write unit tests for safe evaluation fallbacks (`NaN`, division by zero, missing variables returning fallback without crashing).
  - [ ] Implement `ExpressionEngine` utilizing `expr-eval` with pre-compilation cache and safe error handling.
- [ ] Task: System Variables Binding (`$VARIABLE`) (TDD)
  - [ ] Write unit tests verifying that all uppercase `$`-prefixed identifiers (`$TIME`, `$DT`, `$FRAME`, `$FPS`, `$WIDTH`, `$HEIGHT`, `$ASPECT`, `$PIXEL_RATIO`, `$BASS`, `$MID`, `$TREBLE`, `$RMS`, `$BEAT`, `$BPM`) evaluate accurately against a `FrameContext`.
  - [ ] Implement zero-allocation variable evaluation binding passing `FrameContext` into the evaluation loop without creating intermediate garbage collection objects.
- [ ] Task: Phase 1 Checkpoint & Unit Test Verification
  - [ ] Run test suite (`npm test`) to ensure all parser and variable tests pass.

---

## Phase 2: Audio Function Library (#FFT, #WAVEFORM, #BEAT, #BEAT_FRAMES)

- [ ] Task: Beat Envelope Functions (`#BEAT`, `#BEAT_FRAMES`) (TDD)
  - [ ] Add `secondsSinceLastBeat` and `framesSinceLastBeat` tracking to `FrameContext` and `RenderEngine` / `AudioAnalyzer`.
  - [ ] Write unit tests for `#BEAT(decay_seconds)`: verifies exponential decay over time, instantaneous reset to 1.0 on beat frame, and stateless multi-call behavior.
  - [ ] Write unit tests for `#BEAT_FRAMES(decay_frames, curve)`: verifies `"exponential"`, `"linear"`, and `"logarithmic"` decay curves over discrete frame counts.
  - [ ] Implement `#BEAT` and `#BEAT_FRAMES` evaluator functions.
- [ ] Task: Audio Spectrum & Waveform Sampling Functions (`#FFT`, `#WAVEFORM`) (TDD)
  - [ ] Expose raw frequency spectrum and waveform buffer getters in `AudioAnalyzer` / `FrameContext`.
  - [ ] Write unit tests for `#FFT(lower, width, channel)`: verifies logarithmic slice mapping across FFT bins and stereo channel routing.
  - [ ] Write unit tests for `#WAVEFORM(pos, channel)`: verifies normalized time-domain sampling in $[-1.0, 1.0]$.
  - [ ] Implement `#FFT` and `#WAVEFORM` evaluator functions.
- [ ] Task: Mathematical Waves & Shaping Functions (TDD)
  - [ ] Write unit tests for `#TRI(t)`, `#SAW(t)`, `#SQR(t)`, `clamp`, `lerp`, and `smoothstep`.
  - [ ] Implement mathematical wave and shaping functions in `ExpressionEngine`.
- [ ] Task: Phase 2 Checkpoint & Integration Verification
  - [ ] Run full test suite (`npm test`) and verify DSP feature extraction integration.

---

## Phase 3: DynamicParam Abstraction & Interactive Formula Testbed HUD

- [ ] Task: `DynamicParam` Abstraction & Scene Modulation (TDD)
  - [ ] Implement `createDynamicParam(raw, engine)` utility supporting static numbers and dynamic compiled expressions.
  - [ ] Update `TestVisualNode` to allow binding its scale, rotation speed, or glow intensity via dynamic expressions.
  - [ ] Write unit tests for `DynamicParam` evaluation and fallback handling.
- [ ] Task: Interactive Formula Testbed HUD Component (TDD)
  - [ ] Design and implement `FormulaTestbedModal` / drawer in `src/ui/hud/formula-testbed.tsx`.
  - [ ] Write component tests verifying live expression input, 60 FPS real-time numerical readout, error message banner for invalid syntax, and quick preset buttons.
  - [ ] Add `f(x)` button to the top toolbar (`Toolbar`) to toggle the Formula Testbed HUD.
- [ ] Task: Phase 3 Visual Checkpoint & User Experience Verification
  - [ ] Verify Formula Testbed in browser via `npm run dev`: type custom expressions with audio running and observe real-time response.

---

## Phase 4: Quality Assurance, Documentation & Pre-Upload Verification

- [ ] Task: Code Documentation & Directory README Audit
  - [ ] Verify JSDoc coverage across 100% of newly created classes and public methods.
  - [ ] Update directory `README.md` files for any new or modified directories (`src/engine/expressions/`, `src/ui/hud/`, etc.).
- [ ] Task: Pre-Upload Verification & GitHub Sync
  - [ ] Execute `oxlint` linter check (`npm run lint`).
  - [ ] Execute production build (`npm run build`).
  - [ ] Execute full unit test suite (`npm test`).
  - [ ] Commit all completed deliverables following Conventional Commits referencing Issue #3.
