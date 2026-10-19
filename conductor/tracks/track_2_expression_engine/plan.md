# Implementation Plan: Track 2 — Dynamic Expression Engine & Parameter Binding

## Phase 1: Core Expression Parser, AST Compiler & System Variables

- [x] Task: Sandboxed Parser & AST Compiler (`ExpressionEngine`) (TDD)
  - [x] Write unit tests for `ExpressionEngine.compile(expr)` verifying AST caching, arithmetic operations, operator precedence, standard math functions (`sin`, `cos`, `abs`, `min`, `max`), and syntax error reporting.
  - [x] Write unit tests verifying sandboxing: syntax containing prototype pollution, property accessors, or assignment operators is rejected.
  - [x] Write unit tests for safe evaluation fallbacks (`NaN`, division by zero, missing variables returning fallback without crashing).
  - [x] Implement `ExpressionEngine` utilizing `expr-eval` with pre-compilation cache and safe error handling.
- [x] Task: System Variables Binding (`$VARIABLE`) (TDD)
  - [x] Write unit tests verifying that all uppercase `$`-prefixed identifiers (`$TIME`, `$DT`, `$FRAME`, `$FPS`, `$WIDTH`, `$HEIGHT`, `$ASPECT`, `$PIXEL_RATIO`, `$BASS`, `$MID`, `$TREBLE`, `$RMS`, `$BEAT`, `$BPM`) evaluate accurately against a `FrameContext`.
  - [x] Implement zero-allocation variable evaluation binding passing `FrameContext` into the evaluation loop without creating intermediate garbage collection objects.
- [x] Task: Phase 1 Checkpoint & Unit Test Verification
  - [x] Run test suite (`npm test`) to ensure all parser and variable tests pass.

---

## Phase 2: Audio Function Library (#FFT, #WAVEFORM, #BEAT, #BEAT_FRAMES)

- [x] Task: Beat Envelope Functions (`#BEAT`, `#BEAT_FRAMES`) (TDD)
  - [x] Add `secondsSinceLastBeat` and `framesSinceLastBeat` tracking to `FrameContext` and `RenderEngine` / `AudioAnalyzer`.
  - [x] Write unit tests for `#BEAT(decay_seconds)`: verifies exponential decay over time, instantaneous reset to 1.0 on beat frame, and stateless multi-call behavior.
  - [x] Write unit tests for `#BEAT_FRAMES(decay_frames, curve)`: verifies `"exponential"`, `"linear"`, and `"logarithmic"` decay curves over discrete frame counts.
  - [x] Implement `#BEAT` and `#BEAT_FRAMES` evaluator functions.
- [x] Task: Audio Spectrum & Waveform Sampling Functions (`#FFT`, `#WAVEFORM`) (TDD)
  - [x] Expose raw frequency spectrum and waveform buffer getters in `AudioAnalyzer` / `FrameContext`.
  - [x] Write unit tests for `#FFT(lower, width, channel)`: verifies logarithmic slice mapping across FFT bins and stereo channel routing.
  - [x] Write unit tests for `#WAVEFORM(pos, channel)`: verifies normalized time-domain sampling in $[-1.0, 1.0]$.
  - [x] Implement `#FFT` and `#WAVEFORM` evaluator functions.
- [x] Task: Mathematical Waves & Shaping Functions (TDD)
  - [x] Write unit tests for `#TRI(t)`, `#SAW(t)`, `#SQR(t)`, `clamp`, `lerp`, and `smoothstep`.
  - [x] Implement mathematical wave and shaping functions in `ExpressionEngine`.
- [x] Task: Phase 2 Checkpoint & Integration Verification
  - [x] Run full test suite (`npm test`) and verify DSP feature extraction integration.

---

## Phase 3: DynamicParam Abstraction & Interactive Formula Testbed HUD

- [x] Task: `DynamicParam` Abstraction & Scene Modulation (TDD)
  - [x] Implement `createDynamicParam(raw, engine)` utility supporting static numbers and dynamic compiled expressions.
  - [x] Update `TestVisualNode` to allow binding its scale, rotation speed, or glow intensity via dynamic expressions.
  - [x] Write unit tests for `DynamicParam` evaluation and fallback handling.
- [x] Task: Interactive Formula Testbed HUD Component (TDD)
  - [x] Design and implement `FormulaTestbedModal` / drawer in `src/ui/hud/formula-testbed.tsx`.
  - [x] Write component tests verifying live expression input, 60 FPS real-time numerical readout, error message banner for invalid syntax, and quick preset buttons.
  - [x] Add `f(x)` button to the top toolbar (`Toolbar`) to toggle the Formula Testbed HUD.
- [x] Task: Phase 3 Visual Checkpoint & User Experience Verification
  - [x] Verify Formula Testbed in browser via `npm run dev`: type custom expressions with audio running and observe real-time response.

---

## Phase 4: Quality Assurance, Documentation & Pre-Upload Verification

- [x] Task: Code Documentation & Directory README Audit
  - [x] Verify JSDoc coverage across 100% of newly created classes and public methods.
  - [x] Update directory `README.md` files for any new or modified directories (`src/engine/expressions/`, `src/ui/hud/`, etc.).
- [x] Task: Pre-Upload Verification & GitHub Sync
  - [x] Execute `oxlint` linter check (`npm run lint`).
  - [x] Execute production build (`npm run build`).
  - [x] Execute full unit test suite (`npm test`).
  - [x] Commit all completed deliverables following Conventional Commits referencing Issue #3.
- [x] Task: Track Completion Stateless Review, Decomposition & Documentation Sync
  - [x] Conduct stateless repository audit of code complexity, file sizes, and documentation consistency.
  - [x] Decompose `FormulaTestbed` (760L -> 195L) into reusable UI components (`src/ui/expressions/`) and hooks (`src/ui/hooks/`).
  - [x] Decompose `ExpressionEngine` (458L -> 158L) into tokens, validator, and system functions.
  - [x] Fix `#FFT` frequency mapping to use logarithmic scaling ($20\text{ Hz} \rightarrow 20,000\text{ Hz}$).
  - [x] Modularize `Toolbar`, `PresetSettingsModal`, and `AudioManager` (extract file loader and fix background playback edge case).
  - [x] Purge dead assets and synchronize 18 documentation inconsistencies across Conductor and repository READMEs.
  - [x] Verify 100% pass rate across 117 tests and zero oxlint warnings.

