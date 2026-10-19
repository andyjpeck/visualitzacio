# Specification: Track 2 — Dynamic Expression Engine & Parameter Binding

> **Track ID:** `track_2_expression_engine`  
> **Type:** Feature  
> **Status:** Draft / Active  
> **Related Issue:** [#3](https://github.com/andyjpeck/visualitzacio/issues/3)  
> **Related Design Specs:** [`conductor/system_variables.md`](../../system_variables.md), [`conductor/system_functions.md`](../../system_functions.md)

---

## 1. Overview & Vision

Visualització is designed for procedural, music-driven generative visual art. Instead of binding visual properties strictly to static numbers or predefined sliders, Visualització empowers artists to write dynamic mathematical expressions directly into component parameters (e.g., `scale = "1.0 + $BASS * 0.5 + #BEAT(0.15) * 0.3"`).

Track 2 creates the foundational **Dynamic Expression Engine** (`ExpressionEngine`):
1. A sandboxed mathematical evaluator based on `expr-eval`.
2. AST pre-compilation and in-memory caching to eliminate runtime garbage collection overhead during 60 FPS animation loops.
3. Complete binding to all real-time audio and frame telemetry variables (`$VARIABLE`).
4. A specialized library of audio analysis and envelope decay functions (`#FUNCTION`).
5. An interactive, on-screen **Formula Testbed** allowing users to compose formulas, inspect real-time outputs, and verify audio reactivity live.

---

## 2. Functional Requirements

### FR-1: Sandboxed Parser & AST Compiler
- **Library Integration:** Utilize `expr-eval` for fast, zero-dependency, safe mathematical expression parsing.
- **Security & Sandboxing:**
  - Completely disallow access to JavaScript globals (`window`, `document`, `eval`, `Function`, `constructor`, `__proto__`).
  - Disable assignment operators and statement execution (`expr-eval` default parser configuration).
- **Compilation & Caching:**
  - Pre-compile raw expression strings into AST `Expression` instances.
  - Implement an in-memory compilation cache (`Map<string, CompiledExpression>`) to avoid re-parsing identical expression strings across render frames.
  - Expose validation utilities: `validateExpression(expr: string): { isValid: boolean; error?: string }`.
- **Runtime Error Resilience & Graceful Fallback:**
  - If an expression evaluation produces `NaN`, `Infinity`, `-Infinity`, or throws an evaluation error, the engine must return a designated fallback default value (e.g., `0.0`) and flag the error without terminating the render loop.

### FR-2: System Variables Binding (`$VARIABLE`)
The engine must map all uppercase `$`-prefixed identifiers to the shared `FrameContext` telemetry buffer:
- **Audio Telemetry:**
  - `$BASS`: Normalized low-frequency energy (`0.0` to `1.0`).
  - `$MID`: Normalized mid-frequency energy (`0.0` to `1.0`).
  - `$TREBLE`: Normalized high-frequency energy (`0.0` to `1.0`).
  - `$RMS`: Normalized Root-Mean-Square overall volume (`0.0` to `1.0`).
  - `$BEAT`: Discrete binary beat flag (`1.0` on beat transient frame, `0.0` otherwise).
  - `$BPM`: Estimated tempo in beats per minute (`0.0` to `300.0`, default `120.0`).
- **Engine & Canvas Telemetry:**
  - `$TIME`: Elapsed running time in seconds ($\ge 0.0$).
  - `$DT`: Delta time between frames in seconds, clamped $\le 0.1$.
  - `$FRAME`: Monotonically increasing frame index ($0, 1, 2, ...$).
  - `$FPS`: Current measured rendering frame rate.
  - `$WIDTH`: Viewport width in CSS pixels.
  - `$HEIGHT`: Viewport height in CSS pixels.
  - `$ASPECT`: Viewport aspect ratio ($WIDTH / HEIGHT$).
  - `$PIXEL_RATIO`: Device pixel ratio clamped $\le 2.0$.
- **Zero-Allocation Variable Map:**
  - The evaluation context object passed to `expr-eval` must be reused in-place on each frame or mapped via zero-allocation getters.

### FR-3: System Functions Library (`#FUNCTION` & Math Helpers)
The parser must support custom functions defined in [`conductor/system_functions.md`](../../system_functions.md):
- **DSP & Audio Functions:**
  - `#FFT(lower_band, [band_width = 0.02], [channel = 0])`: Samples normalized energy from the FFT frequency bins at normalized logarithmic position `lower_band` ($20\text{ Hz}$ to $20,000\text{ Hz}$).
  - `#WAVEFORM(position, [channel = 0])`: Samples time-domain audio amplitude in $[-1.0, 1.0]$ at normalized index `position`.
- **Beat Envelopes (Stateless Evaluation):**
  - `#BEAT([decay_seconds = 0.2])` / `#BEAT_SECONDS(...)`: Smooth exponential decay curve ($e^{-3 \cdot t / \text{decay}}$) based on `secondsSinceLastBeat` maintained in `FrameContext`.
  - `#BEAT_FRAMES([decay_frames = 12], [curve = "exponential"])`: Decay curve over frame counts supporting `"exponential"`, `"linear"`, and `"logarithmic"`.
- **Wave Generators & Shaping Helpers:**
  - `#TRI(t)`: Normalized triangle wave with period $1.0$ ($[-1.0, 1.0]$).
  - `#SAW(t)`: Normalized sawtooth wave with period $1.0$ ($[-1.0, 1.0]$).
  - `#SQR(t)`: Normalized square wave with period $1.0$ ($-1.0$ or $1.0$).
  - `clamp(val, min, max)`: Clamps `val` between `min` and `max`.
  - `lerp(a, b, t)`: Linear interpolation between `a` and `b` by factor `t`.
  - `smoothstep(edge0, edge1, x)`: Hermite interpolation between 0 and 1.
- **Built-in Standard Math:**
  - `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `abs`, `floor`, `ceil`, `round`, `sqrt`, `pow`, `exp`, `log`, `min`, `max`, `PI`, `E`.

### FR-4: Parameter Binding Abstraction (`DynamicParam`)
- Provide a clean TypeScript abstraction for component properties that can be either a constant numeric value or a dynamic expression:
  ```ts
  export interface DynamicParam<T = number> {
    raw: string | number
    compiled?: CompiledExpression
    evaluate(context: FrameContext, fallback?: T): T
  }
  ```
- If `raw` is a numeric literal or constant string, bypass AST evaluation for immediate return.

### FR-5: Interactive Formula Testbed HUD
- **UI Modal / Popover:** Accessible from the top toolbar (via a new `f(x)` button) or keyboard shortcut.
- **Input & Feedback:**
  - Text input for testing formulas with immediate syntax highlighting / validation badge.
  - Live 60 FPS numerical output readout with variable preview tags (`$BASS`, `$MID`, `$TREBLE`, `$BEAT`, `$TIME`).
  - History of recent evaluated expressions.
  - Quick-preset chips to load example formulas:
    - *Bass Pulsar:* `1.0 + $BASS * 0.8`
    - *Beat Shockwave:* `#BEAT(0.2) * 2.0`
    - *Harmonic Oscillator:* `sin($TIME * 2) * 0.5 + 0.5`
    - *Tri-Band Composite:* `$BASS * 0.5 + $MID * 0.3 + $TREBLE * 0.2`
    - *Custom FFT Slice:* `#FFT(0.1, 0.05, 0)`

---

## 3. Non-Functional Requirements

- **Performance:** Pre-compiled AST evaluation must execute in $\le 0.02\text{ ms}$ (under 20 microseconds) per expression on standard hardware.
- **Garbage Collection:** Zero object allocations during per-frame `.evaluate()` calls.
- **Type Safety:** 100% strict TypeScript types with named exports and Google TypeScript Style Guide compliance.
- **Documentation:** JSDoc on 100% of classes and public methods; updated directory READMEs.
- **Test Coverage:** 100% pass rate across unit tests and integration tests.

---

## 4. Acceptance Criteria

- [ ] `ExpressionEngine` compiles valid formulas with all `$VARIABLE` and `#FUNCTION` bindings.
- [ ] In-memory AST caching prevents re-parsing.
- [ ] Safe fallback values returned on division by zero or invalid variables.
- [ ] `#BEAT()` and `#BEAT_FRAMES()` produce smooth decay curves keyed to audio transients.
- [ ] `#FFT()` and `#WAVEFORM()` accurately sample active audio analyzer buffers.
- [ ] Interactive Formula Testbed HUD renders live evaluations at 60 FPS without React re-render lag.
- [ ] All unit and component tests pass (`npm test`).
- [ ] Linter checks pass cleanly (`oxlint`).
