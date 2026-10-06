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
  - Evaluates compiled per-frame math expressions and writes uniforms directly into WebGL materials.
  - Zero React component reconciliation or state re-renders in this loop.
  - **Zero-Allocation Policy:** All `Float32Array` buffers, `THREE.Vector`, `THREE.Matrix`, and uniform objects are pre-allocated at initialization to eliminate Garbage Collection (GC) pauses.

## 3. Frontend Framework & Interface
- **Framework:** React 19
- **Styling:** Tailwind CSS (utility-first styling with CSS variables for runtime theme switching between Cyberpunk and Dark Studio)
- **Icons:** Lucide React
- **Node Graph Pipeline UI:** `@xyflow/react` (React Flow) for visual component chaining, custom port handles, mini-map, and canvas navigation
- **State Management:** Zustand (decoupled reactive state for UI and preset metadata)

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
- **Logarithmic Frequency Binning:**
  - Converts linear FFT bins into logarithmic psychoacoustic energy bands: `bass` (20–250 Hz), `mid` (250–4000 Hz), and `treble` (4000–16000 Hz).
  - Includes asymmetric attack/decay smoothing and normalized RMS calculation.
  - Spectral flux transient detection for reactive beat pulses.
- **Audio Inputs:**
  - `getUserMedia` (Microphone/Line-in) with `{ echoCancellation: false, noiseSuppression: false, autoGainControl: false }` to preserve raw musical dynamics.
  - HTML5 Audio / File API (local MP3, WAV, FLAC playback).
  - `getDisplayMedia` (system/tab audio capture with fallback).
- **Hardware Integration:** Web MIDI API (`navigator.requestMIDIAccess`) with dynamic MIDI Learn, state machine, and value smoothing (slew-rate limiting / lerp).

## 6. Expression & Math Engine
- **Formula Evaluator:** `expr-eval`
- **Scope Limitation:** Strictly used for **Per-Frame Uniform Modulation** (not per-pixel/per-vertex, which runs on GPU).
- **Compilation & Caching:** Mathematical expressions are parsed and compiled once on edit (`parser.compile()`) and executed each frame.
- **Numeric Sandboxing:** Safe evaluation wrappers guard against division by zero, `NaN`, and `Infinity`, clamping values safely to prevent shader breakage.

## 7. Storage & Architecture
- **Architecture:** Client-Side Single Page Application (SPA)
- **Persistence (MVP):** IndexedDB (via `idb-keyval`) and LocalStorage for preset storage and theme preferences, paired with JSON preset import/export.
- **Roadmap / Future:** Backend cloud sync (PostgreSQL/Supabase or Firebase) for user accounts and community preset sharing.

## 8. Testing & Quality Assurance
- **Unit & Integration Testing:** Vitest + React Testing Library
- **Linting & Formatting:** ESLint + Prettier
