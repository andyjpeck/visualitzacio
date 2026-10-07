# Technology Stack: Visualització

## 1. Core Runtime & Tooling
- **Language:** TypeScript (strict mode)
- **Build Tool & Bundler:** Vite (with `vite-plugin-glsl` for hot-reloading GLSL vertex and fragment shaders)
- **Package Manager:** npm

## 2. System Architecture: Two-Plane Decoupled Model
To guarantee uncompromised 60+ FPS rendering while providing rich interactive UI editing:
- **Control & State Plane (React 19 + Zustand):**
  - Manages graph topology, preset serialization, parameter inspectors, theme preferences, and MIDI CC bindings.
  - Operates at human interaction speeds (<10 Hz) with zero participation in the render loop.
- **Audio & Render Data Plane (Pure TypeScript + Three.js):**
  - Executes strictly inside `requestAnimationFrame`.
  - Directly samples pre-allocated `Float32Array` audio buffers from the Web Audio `AnalyserNode`.
  - Evaluates compiled per-frame dynamic expressions and writes uniforms directly into WebGL materials.
  - Zero React component reconciliation or state re-renders in this loop.
  - **Zero-Allocation Policy:** All `Float32Array` buffers, `THREE.Vector`, `THREE.Matrix`, and uniform objects are pre-allocated at initialization to eliminate Garbage Collection (GC) pauses.

## 3. Frontend Framework & Interface
- **Framework:** React 19
- **Styling:** Tailwind CSS (utility-first styling with CSS variables for runtime theme switching between Cyberpunk and Dark Studio)
- **Icons:** Lucide React
- **Node Graph Pipeline UI:** `@xyflow/react` (React Flow) for visual component chaining, custom port handles, mini-map, and canvas navigation
- **State Management:** Zustand (decoupled reactive state for UI and preset metadata)
- **Universal Parameter UI Pattern:** `f(x)` button on each parameter row to switch between fixed controls (sliders, knobs, toggles) and dynamic expression input.

## 4. Graphics, Shaders & Feedback Rendering Pipeline
- **3D / 2D Engine:** Three.js (WebGL 2.0 rendering context)
- **Dual-FBO Ping-Pong Feedback Loop:**
  - Emulates classic Winamp AVS and MilkDrop frame feedback (warp meshes, decay trails, motion vectors).
  - Maintains dual `THREE.WebGLRenderTarget` instances; renders current scene + feedback pass into Target B reading Target A as a texture uniform, swapping targets each frame.
- **Shaders:** Custom GLSL fragment and vertex passes.
- **Runtime Shader Error Boundary:** Intercepts shader compilation logs (`gl.getShaderInfoLog`) and surfaces diagnostics to the in-app Diagnostics Console without crashing WebGL context.
- **Context Loss Handling:** Listens to `webglcontextlost` and `webglcontextrestored` to rebuild render targets and materials seamlessly.

## 5. Audio Engine & Hardware Integration
- **Audio Processing:** Native Web Audio API (`AudioContext`, `AnalyserNode` with `fftSize = 2048`, `smoothingTimeConstant = 0.8`).
- **Stereo & Multi-Channel Analysis:** Supports stereo channel splitting (`ChannelSplitterNode`) for distinct Left, Right, and Mono ($L+R$) spectral extraction.
- **Logarithmic Frequency Binning:**
  - Converts linear FFT bins into logarithmic psychoacoustic energy bands: `bass` (20–250 Hz), `mid` (250–4000 Hz), and `treble` (4000–16000 Hz).
  - Exponential mapping: $f(x) = 20 \times 10^{3x}$ for $x \in [0.0, 1.0]$ spanning 20Hz – 20,000Hz.
  - Includes asymmetric attack/decay smoothing and normalized RMS calculation.
  - Spectral flux transient detection for reactive beat pulses.
- **Audio Inputs:**
  - `getUserMedia` (Microphone/Line-in) with `{ echoCancellation: false, noiseSuppression: false, autoGainControl: false }` to preserve raw musical dynamics.
  - HTML5 Audio / File API (local MP3, WAV, FLAC playback).
  - `getDisplayMedia` (system/tab audio capture with fallback).
- **Hardware Integration:** Web MIDI API (`navigator.requestMIDIAccess`) with dynamic MIDI Learn, state machine, and value smoothing (slew-rate limiting / lerp).

## 6. Dynamic Expression Engine & Universal Parameter Binding
- **Parser & Evaluator:** `expr-eval` (lightweight, zero-`eval` safe mathematical expression evaluator).
- **Scope & Frequency:** Strictly executed **once per frame** in the Render Data Plane for uniform and parameter modulation.
- **Built-in Special Values ($VARIABLE):**
  - Formatted with a leading `$` in uppercase:
    - `$BASS`: Normalized low-frequency energy (0.0 – 1.0).
    - `$MID`: Normalized mid-frequency energy (0.0 – 1.0).
    - `$TREBLE`: Normalized high-frequency energy (0.0 – 1.0).
    - `$RMS`: Overall root-mean-square audio energy (0.0 – 1.0).
    - `$BPM`: Detected or configured tempo in beats per minute.
    - `$BEAT`: **Binary trigger: `1.0` if the current frame is a beat, `0.0` otherwise.**
    - `$TIME`: Elapsed time in seconds since playback start.
    - `$FRAME`: Monotonically increasing frame counter integer.
- **Built-in System Functions (%FUNCTION):**
  - Formatted with a leading `%` in uppercase:
    - **`%FFT(lower_band, band_width, channel)`:**
      - Calculates energy of a custom frequency window.
      - `lower_band`: Normalized start frequency in $[0.0, 1.0]$ mapped logarithmically to $[20\text{Hz}, 20000\text{Hz}]$.
      - `band_width`: Frequency width in $[0.0, 1.0]$.
      - `channel`: `0` = Left + Right (default mono mix), `1` = Left channel, `2` = Right channel.
      - Example: `%FFT(0, 0.3, 1)` calculates the lowest 30% of frequencies (approx. 20Hz–158Hz) on the left audio channel.
    - **`%BEAT([decay_seconds = 0.2])` / `%BEAT_SECONDS([decay_seconds = 0.2])`:**
      - Transient attack pulse envelope: Jumps to `1.0` on beat and decays exponentially to `0.0` over `decay_seconds` (default: 0.2s).
    - **`%BEAT_FRAMES([decay_frames = 12])`:**
      - Transient attack pulse envelope: Jumps to `1.0` on beat and decays exponentially to `0.0` over `decay_frames` frames (default: 12 frames).
- **Universal Parameter Binding:**
  - Every component parameter (e.g., `scale`, `rotation`, `opacity`, `positionX`, `positionY`, `blend`) supports dual modes:
    - **Literal Mode:** Static scalar/boolean/enum value.
    - **Expression Mode:** Compiles an expression string (e.g. `Blend: %FFT(0, 0.3, 1) * 0.5`, `Scale: 1.0 + %BEAT(0.3) * 0.4`).
- **Compilation & Caching:**
  - Expression strings are compiled into AST execution functions on edit (`parser.compile(expr)`).
  - Pre-allocated variable context object and bound audio buffers passed into `.evaluate(scope)` each frame to eliminate GC allocation.
- **Fault-Tolerant Sandboxing:**
  - Wraps evaluations in safe guards against syntax errors, division by zero, `NaN`, and `Infinity`.
  - On error, smoothly retains the previous valid frame value, clamps within valid component boundaries, and emits an inline warning state to the UI without interrupting the 60 FPS render pipeline.

## 7. Storage & Architecture
- **Architecture:** Client-Side Single Page Application (SPA)
- **Persistence (MVP):** IndexedDB (via `idb-keyval`) and LocalStorage for preset storage and theme preferences, paired with JSON preset import/export.
- **Roadmap / Future:** Backend cloud sync (PostgreSQL/Supabase or Firebase) for user accounts and community preset sharing.

## 8. Testing & Quality Assurance
- **Unit & Integration Testing:** Vitest + React Testing Library
- **Linting & Formatting:** ESLint + Prettier
