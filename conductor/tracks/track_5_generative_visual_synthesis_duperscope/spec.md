# Track 5 Specification: Generative Visual Synthesis & Duperscope

## Context & Vision
Track 5 introduces **Duperscope** (`duperscopeNode`), Visualització's WebGL reinterpretation of the iconic Winamp AVS Superscope component. Duperscope is a programmable parametric curve and particle generator that evaluates user mathematical scripts across 4 execution phases (`init`, `beat`, `frame`, `point`) at 60 FPS to compute vertex positions, colors, and stroke thicknesses driven by real-time audio waveform and frequency spectrum data.

Completing Track 5 finishes Visualització's foundational component suite (`FrameBufferNode`, `StaticImageNode`, `DuperscopeNode`).

---

## Functional Requirements

### FR-1: Multi-Statement Script Compiler & Sandbox (`DuperscopeCompiler`)
- **Comment Stripping & Statement Splitting:**
  - Strip single-line (`// ...`) and multi-line block (`/* ... */`) comments prior to parsing.
  - Split each phase script (`initCode`, `beatCode`, `frameCode`, `pointCode`) into ordered assignment statements (`target = expression`) separated by semicolons (`;`) or newlines.
  - Support empty scripts or comment-only scripts as valid no-op programs.
- **Read-Only Variable Protection:**
  - Reject assignments to system variables (`$TIME`, `$BASS`, etc.) or built-in constants (`PI`, `E`).
  - Reject assignments to `i` and `v` in all phases (`i` and `v` are strictly read-only).
  - Allow assignments to `n` in `init`, `beat`, and `frame`, but reject assignments to `n` inside the `point` phase (`n` is read-only during point iteration).
- **Sandboxed Validation & Zero-Allocation Execution:**
  - Transform `$VARIABLE` and `#FUNCTION(...)` tokens and validate the right-hand side of every assignment using the sandboxed `expr-eval` parser (preventing access to `window`, `document`, prototypes, or member properties).
  - Pre-compile validated statements into an ordered array of AST evaluators operating on a flat, pre-allocated numeric `scope` dictionary for zero Garbage Collection (GC) allocations during the 60 FPS render loop.
- **Error Handling (Blank Output on Error):**
  - Return per-phase validation diagnostics (`isValid`, `error`, statement/line context).
  - If any of the 4 phases contains a syntax or validation error, the `DuperscopeNode` enters an error state and outputs a **blank frame** (renders 0 vertices/segments) until the error is fixed, without disrupting the rest of the WebGL render pipeline.

### FR-2: 4-Phase Execution Lifecycle & Variable Scope
- **Phase Execution Sequence:**
  1. **`init`:** Executes once when the node is initialized, when a preset/template loads, or whenever any of the 4 script blocks is edited.
     - Clears all previous user-defined custom variables from the scope dictionary.
     - Initializes built-in defaults: `n = 200`, `r = 1.0`, `g = 1.0`, `b = 1.0`, `a = 1.0`, `linesize = 1.0`, `x = 0.0`, `y = 0.0`, `i = 0.0`, `v = 0.0`, `skip = 0.0`.
  2. **`beat`:** Executes at the start of `update(context)` **before `frame`** if and only if `context.$BEAT === 1.0`.
     - State mutations in `beat` are immediately visible to `frame` on the same frame.
  3. **`frame`:** Executes once every render frame immediately following the `beat` check.
     - Updates frame-level accumulators, rotations, colors, and dynamic point count `n`.
     - After `frame` completes, `n` is clamped to an integer in `[1, 4096]`.
  4. **`point`:** Executes $n$ times per frame ($k = 0 \dots n - 1$).
     - Before each point iteration $k$:
       - `i = n > 1 ? k / (n - 1) : 0.0`
       - `v = sampleAudio(i, audioMode, channel, context)`
       - `x = (i * 2.0) - 1.0`
       - `y = 0.0`
       - `skip = 0.0`
       - `r`, `g`, `b`, `a`, `linesize`, and all persistent user variables retain their current values in scope.
     - After evaluating `point` for index $k$:
       - Clamp `r, g, b, a` to `[0.0, 1.0]` (if `skip > 0`, effective vertex alpha is `0.0`).
       - Clamp `linesize` to `[1.0, 128.0]`.
       - Write vertex coordinates, color, and size into pre-allocated typed arrays.

### FR-3: Audio Sampling (`v` Shorthand, Modes & Channels)
- **Audio Mode (`audioMode`):**
  - `'waveform'` (Default): Samples `context.timeDomainData` at normalized position `i`, yielding $v \in [-1.0, 1.0]$.
  - `'spectrum'`: Samples `context.frequencyData` at normalized position `i` using **logarithmic frequency mapping** (`20 Hz` to `20,000 Hz`, matching `#FFT(i)`), yielding $v \in [0.0, 1.0]$.
- **Audio Channel (`channel`):**
  - Supports `'center'` (Default), `'left'`, and `'right'`.
  - Matching `#FFT` and `#WAVEFORM`, all three channel options sample the primary `AudioAnalyzer` mono mixdown stream.

### FR-4: WebGL Rendering, 1:1 Aspect Projection & Draw Modes (`DuperscopeNode`)
- **Coordinate System & Always-On 1:1 Square Aspect Projection:**
  - Screen coordinates $(x, y)$ span $[-1.0, 1.0]$ with `(0.0, 0.0)` at the viewport center.
  - Horizontal coordinate $x$ is automatically divided by `$ASPECT` (`width / height`) in the projection so $[-1.0, 1.0]$ forms a true 1:1 square centered in the viewport (`x = cos(t); y = sin(t)` always renders as a circle).
- **3 Draw Modes (`drawMode`):**
  1. **`'lines'` (Default) — Instanced Screen-Space Quad Ribbon ($n - 1$ segments):**
     - Uses a pre-allocated `THREE.InstancedBufferGeometry` (max 4,096 instances) where each instance renders segment $[P_k, P_{k+1}]$ as a screen-space quad expanded along its 2D perpendicular normal by `linesize * 0.5` pixels.
     - Overcomes WebGL's `1px` `gl.lineWidth()` hardware cap on Windows (ANGLE/Direct3D) and macOS (Metal).
     - Interpolates per-vertex `(r, g, b, a)` colors and `linesize` smoothly across each segment.
     - If either endpoint of a segment has `skip > 0` (or when `n < 2`), the segment is collapsed/discarded.
  2. **`'lineLoop'` — Closed Instanced Screen-Space Quad Ribbon ($n$ segments):**
     - Uses the same Instanced Screen-Space Quad Ribbon geometry with an additional closing segment connecting point $n - 1$ back to point $0$ (when $n \ge 2$).
  3. **`'points'` — Custom `THREE.Points` Shader ($n$ vertices):**
     - Uses a pre-allocated `THREE.BufferGeometry` and custom `THREE.ShaderMaterial` setting `gl_PointSize = aSize * uPixelRatio` and rendering anti-aliased circular particles in the fragment shader.
- **Node Opacity Modulation:**
  - Supports a top-level `opacity` parameter (`number | string`, Fixed or `f(x)` Expression mode) that multiplies vertex alpha across the node.
- **No Redundant Internal FBO (`saveTo` Omitted):**
  - `DuperscopeNode` renders directly into its parent `FrameBufferNode` (users who wish to publish a Duperscope to a `@NAME` buffer place it inside a Frame Buffer).

### FR-5: Built-in Duperscope Templates & Preset Schema v2 Integration
- **Built-in Duperscope Template Catalog (`src/engine/nodes/duperscope-templates.ts`):**
  1. **Oscilloscope Tunnel** (`waveform`, `lineLoop` — circular reactive waveform)
  2. **Frequency Spectrum Ribbon** (`spectrum`, `lines` — full-width logarithmic spectrum with beat-reactive thickness)
  3. **Reactive Lissajous Figure** (`waveform`, `lines` — harmonic parametric curves)
  4. **Single Audio-Reactive Beat Particle** (`waveform`, `points` — pulsing beat orb with `n = 1`)
- **Dirty-State Overwrite Protection:**
  - Integrate with `isNodeDirty()` and `BaseModalDialog` so selecting a template on a modified `DuperscopeNode` prompts for confirmation and records a single coalesced undo step.
- **Preset Schema v2 & Store Integration:**
  - Node type: `'duperscopeNode'`.
  - Define `DuperscopeNodeData` in `src/ui/graph/node-data.ts`.
  - Support full roundtrip serialization/deserialization in Preset Schema v2 and full diffing in `UndoRedoManager` (`SemanticActionDelta`).

### FR-6: Studio Inspector, Autocomplete & Outliner UI
- **Outliner Layer Creation:**
  - Add **"+ Duperscope"** action in `LayerTreeView` / `WorkspacePane` to insert a new `DuperscopeNode` into the active container.
  - Render a distinctive waveform/scope icon badge for `DuperscopeNode` rows in the Layers Outliner.
- **Parameter Inspector Controls:**
  - Built-in Component Preset Selector at the top of the inspector when a `DuperscopeNode` is selected.
  - Dropdown controls for `audioMode` (`Waveform` / `Spectrum`), `channel` (`Center` / `Left` / `Right`), and `drawMode` (`Lines` / `Line Loop` / `Points`).
  - Universal `f(x)` `ParameterRow` for `opacity`.
  - **4-Phase Script Editor (`init`, `beat`, `frame`, `point`):**
    - Multi-line code inputs for each of the 4 lifecycle phases in execution order (`init`, `beat`, `frame`, `point`).
    - Inline autocomplete dropdown supporting `$VARIABLE`, `#FUNCTION`, and Duperscope scope variables (`n`, `i`, `v`, `x`, `y`, `r`, `g`, `b`, `a`, `linesize`, `skip`).
    - Per-block syntax validation badge and inline error banner if a phase script fails validation.
    - Debounced (500ms) history recording so typing in script editors coalesces cleanly in the 100-step Undo/Redo stack.

---

## Non-Functional Requirements
- **Zero-Allocation 60 FPS Loop:** Pre-allocate all `Float32Array` geometry buffers (4,096 vertices/segments max) and scope dictionaries on node construction; zero `new Float32Array` or object allocations inside `update(context)`.
- **GPU Resource Cleanup:** Dispose all geometries and `ShaderMaterial` instances cleanly in `DuperscopeNode.dispose()`.
- **Code Style:** Strict adherence to semicolon-free Google TypeScript style and `oxlint` zero-warning threshold.
