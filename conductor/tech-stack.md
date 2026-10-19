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
- **Universal Parameter UI Pattern:** `f(x)` button on each modulatable parameter row to switch between fixed controls (sliders, knobs, toggles) and dynamic expression input.

## 4. Graphics, Shaders & Feedback Rendering Pipeline
- **3D / 2D Engine:** Three.js (WebGL 2.0 rendering context)
- **Named Buffer Architecture (`save_to` & `load_from`):**
  - Managed via an offscreen `BufferPool` maintaining a registry of `THREE.WebGLRenderTarget` instances keyed by `@NAME`.
  - Topological sort guarantees upstream producer buffers render prior to downstream consumers. If a cyclic dependency or nonexistent buffer is detected, the affected buffer is disabled from rendering, flagged with an error state, and logged to the Diagnostics Console.
  - Full specification: [Frame Buffer Component Proposal](../component_proposals/frame_buffer.md).
- **Master Frame Buffer & Dual-FBO Ping-Pong Feedback Loop:**
  - Every preset pipeline is rooted in a single **Master Frame Buffer** that manages dual `THREE.WebGLRenderTarget` instances (ping-pong FBOs) supporting both Clean Slate (`replace`, opacity `1.0`) and Frame Feedback modes (see [Frame Buffer Component Proposal](../component_proposals/frame_buffer.md)).
- **Shaders:** Custom GLSL fragment and vertex passes.
- **Runtime Shader Error Boundary:** Intercepts shader compilation logs (`gl.getShaderInfoLog`) and surfaces diagnostics to the in-app Diagnostics Console without crashing WebGL context.
- **Context Loss & Asset Recovery:** Listens to `webglcontextlost` and `webglcontextrestored` to rebuild render targets and materials seamlessly. Raw asset references/URLs are retained in the State Plane memory so textures re-instantiate automatically.
- **Screen Coordinate System (Winamp AVS / WebGL NDC):**
  - All 2D visual elements, quads, and container transformations (`position_x`, `position_y`) operate in normalized Cartesian coordinates $[-1.0, 1.0]$ with `(0.0, 0.0)` at screen center (see [Product Guidelines](./product-guidelines.md)).
- **Viewport Resizing, DPR Clamping & Resolution Scale:** Window resize events debounce FBO reallocation by 150ms, clamp device pixel ratio (`Math.min(window.devicePixelRatio, 2)`), and multiply internal WebGL canvas and `BufferPool` render target dimensions by the preset's `settings.resolution_scale` (`1.0`, `0.75`, `0.5`, or `0.25`) to eliminate GC memory thrashing and allow users to trade off resolution for frame rate on heavy presets.
- **Frame-Time Budget & Adaptive Pacing:** The render loop runs natively via `requestAnimationFrame` paced against the preset's `settings.target_fps` (default `60`). If a frame exceeds the frame budget, `requestAnimationFrame` naturally drops to the next display refresh without skipping passes or altering visual output, while clamping `$DT` (`Math.min(dt, 0.1)`) to prevent physics/time jumps and shifting the clickable FPS badge to amber as soon as measured FPS falls below `target_fps`.

## 5. Audio Engine & Hardware Integration
- **Audio Processing:** Native Web Audio API (`AudioContext`, `AnalyserNode` with `fftSize = 2048`, `smoothingTimeConstant = 0.8`).
- **Stereo & Multi-Channel Analysis:** Supports stereo channel splitting (`ChannelSplitterNode`) for distinct Left, Right, and Mono ($(L+R)/2$) spectral extraction.
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

## 6. Dynamic Expression Engine
- **Two-Tier Expression Architecture:**
  1. **Tier 1 (Universal Parameter Modulation — MVP):** `expr-eval` (lightweight, zero-`eval` safe AST evaluator compiling scalar formulas evaluated **once per frame** for uniform and parameter modulation). Pre-allocated variable scope object (`scope`) is mutated in-place each frame to eliminate garbage collection.
  2. **Tier 2 (High-Throughput Procedural Loops — Track 5 Duperscope):** JIT-compiled sandboxed JavaScript functions executing multi-line imperative statements (`init`, `frame`, `beat`, `point`) capable of running up to 240,000 evaluations/sec in per-vertex point loops.
- **Language & Symbol Reference:**
  - System reactive variables (`$VARIABLE`): See [System Variables Reference](./system_variables.md).
  - Built-in audio/DSP functions (`#FUNCTION`): See [System Functions Reference](./system_functions.md).
- **Fault-Tolerant Sandboxing:**
  - Wraps evaluations in safe guards against syntax errors, division by zero, `NaN`, and `Infinity`.
  - On error, smoothly retains the previous valid frame value (or falls back to the default fixed value on frame 0) without interrupting the 60 FPS render pipeline.

## 7. Declarative JSON Preset Schema & Persistence
- **Architecture:** The entire visualizer preset is serialized as a single, portable, human-readable JSON document for seamless import, export, and sharing.
- **Preset-Wide Settings & Hierarchical Component Schema:**
  Every preset includes a top-level `settings` object (`target_fps`, `resolution_scale`) and defines exactly one **Master Frame Buffer** at the root (`root`), which houses all child components inside its nested `children` array. Modulatable numeric, boolean, color, and enum parameters use `{ "mode": "fixed" | "expression", "value": ... }`, while static asset paths, buffer identifiers, and multi-line scripts are stored as plain strings:
  ```json
  {
    "version": "1.0",
    "name": "Neon Pulse Visualizer",
    "author": "User",
    "created_at": "2026-10-07T00:00:00Z",
    "settings": {
      "target_fps": 60,
      "resolution_scale": 1.0
    },
    "root": {
      "id": "master_buffer",
      "name": "Master Frame Buffer",
      "type": "frame_buffer",
      "enabled": true,
      "is_master": true,
      "parameters": {
        "scale": { "mode": "expression", "value": "1.0 + #BEAT(0.25) * 0.4" },
        "rotation": { "mode": "fixed", "value": 0.0 },
        "opacity": { "mode": "fixed", "value": 1.0 },
        "blend_mode": { "mode": "fixed", "value": "replace" }
      },
      "children": [
        {
          "id": "img_bg",
          "name": "Background Image",
          "type": "static_image",
          "enabled": true,
          "parameters": {
            "source_url": "assets/default.jpg",
            "fit_mode": { "mode": "fixed", "value": "cover" },
            "filter": { "mode": "fixed", "value": "linear" }
          }
        }
      ]
    }
  }
  ```
- **Graph Representation & Pure Tree Schema:**
  - Presets serialize only the execution hierarchy (`root` and nested `children`) and preset-wide `settings`.
  - Upon preset import or file load, the editor's node graph uses automatic hierarchical tree layout to place nodes cleanly on canvas, keeping preset files compact, human-readable, and free from fragile coordinate metadata.
- **Local Persistence (MVP):** IndexedDB (via `idb-keyval`) and LocalStorage for preset storage and theme preferences, paired with `.json` file upload/download.
- **Roadmap / Future:** Backend cloud sync (PostgreSQL/Supabase or Firebase) for user accounts and community preset sharing.

## 8. Testing & Quality Assurance
- **Unit & Integration Testing:** Vitest + React Testing Library
- **Linting & Formatting:** ESLint + Prettier

## 9. Hosting, Deployment & CI/CD
- **Hosting Platform:** GitHub Pages (`https://andyjpeck.github.io/visualitzacio/`)
- **CI/CD Pipeline:** Automated deployment via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`:
  - Installs dependencies (`npm ci`).
  - Runs ESLint and Vitest test suites.
  - Builds production bundle (`npm run build`) with `base: '/visualitzacio/'`.
  - Automatically deploys static artifact to GitHub Pages environment.
- **Security & Device APIs:** Native HTTPS provided by GitHub Pages, satisfying browser security policies required for Web Audio microphone capture (`getUserMedia`), Web MIDI (`navigator.requestMIDIAccess`), and Fullscreen APIs.
