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
- **Draggable Viewport Dialog:** Accessible from the top toolbar (via the `f(x)` button) or keyboard shortcut (`Escape` to dismiss). Draggable via header handle with pointer capture (`setPointerCapture`) and automatic viewport edge clamping on drag and window resize.
- **Strict Syntax Validation & Feedback:**
  - Real-time syntax checking on every keystroke with status badge (`Syntax Valid` check or `Syntax Error` cross).
  - Strict AST and token validation: rejects misspelled function signatures (e.g. `#BEAzT(...)`) or unknown variable identifiers with explicit, actionable error messaging.
- **60 FPS Real-Time Evaluation & Dynamic Line Chart:**
  - Direct DOM text ticker updating at 60 FPS with zero React re-render overhead.
  - Real-time `<canvas>` line chart plotting a 180-frame sliding window (~3 seconds of real-time history) with cyan line stroke and gradient fill.
  - Dynamic Y-axis scaling displaying both live `min:` and `max:` values with adaptive headroom.
  - Zero-leak lifecycle management: history data is strictly tracked only while the panel is open and is immediately cleared (`length = 0`) on close or expression change.
- **Collapsible Guidance & Quick Reference:**
  - Ordered with **Quick Reference** guide positioned above **Example Formula Presets**.
  - Interactive clickable chips with rich hover tooltips explaining variables (`$BASS`, `$MID`, etc.) and functions (`#BEAT(...)`, `#FFT(...)`, etc.).
  - One-click token insertion appending into the formula expression input.
  - State persistence for open/collapsed section preferences.

### FR-6: Standard UI Specification for Dynamic Expression Controls
When individual visual components (e.g. crystal scale, lighting intensity, mesh deformers) expose dynamic expression inputs in future tracks, they must adhere to the standardized UI patterns established by the testbed:
1. **Input & Validation Anatomy:**
   - Monospace font input with cyberpunk cyan active styling and crimson error borders.
   - Immediate syntax status indicator with explicit error diagnostics for unknown variables and functions.
2. **Real-Time Visual Feedback:**
   - Dual-readout display: real-time numeric value accompanied by the 180-frame sliding-window `<canvas>` line chart.
   - Dynamic scaling showing both `min:` and `max:` values with zero React re-render overhead.
3. **Memory Safeguards for Multi-Component Expressions:**
   - Expression history buffers must only be maintained for the currently active/expanded inspector or dialog.
   - When an expression input/popover is closed or collapsed, all history arrays must be cleared and their requestAnimationFrame loops terminated to ensure zero performance degradation across dozens of simultaneous component expressions.
4. **Token Quick Reference & Discovery:**
   - Accessible quick reference chips with tooltips detailing expected ranges and signatures.


---

## 3. Non-Functional Requirements

- **Performance:** Pre-compiled AST evaluation must execute in $\le 0.02\text{ ms}$ (under 20 microseconds) per expression on standard hardware.
- **Garbage Collection:** Zero object allocations during per-frame `.evaluate()` calls.
- **Type Safety:** 100% strict TypeScript types with named exports and Google TypeScript Style Guide compliance.
- **Documentation:** JSDoc on 100% of classes and public methods; updated directory READMEs.
- **Test Coverage:** 100% pass rate across unit tests and integration tests.

---

## 4. Acceptance Criteria

- [x] `ExpressionEngine` compiles valid formulas with all `$VARIABLE` and `#FUNCTION` bindings.
- [x] In-memory AST caching prevents re-parsing.
- [x] Safe fallback values returned on division by zero or invalid variables.
- [x] `#BEAT()` and `#BEAT_FRAMES()` produce smooth decay curves keyed to audio transients.
- [x] `#FFT()` and `#WAVEFORM()` accurately sample active audio analyzer buffers.
- [x] Interactive Formula Testbed HUD renders live evaluations at 60 FPS without React re-render lag.
- [x] Draggable HUD dialog with edge-clamping and collapsible section persistence.
- [x] Real-time `<canvas>` line chart with dynamic `min:` and `max:` scaling and isolated memory lifecycle.
- [x] Strict token and signature syntax validation with actionable error feedback.
- [x] All unit and component tests pass (`npm test`).
- [x] Linter checks pass cleanly (`oxlint`).
