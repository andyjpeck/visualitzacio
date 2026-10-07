# Specification: Core Engine Foundation & Modular Frame Buffer MVP

## 1. Overview
This bootstrap track establishes Visualització's foundational architecture: a high-performance, two-plane execution model decoupling React UI from a 60+ FPS Three.js/WebGL render loop, basic Web Audio frequency analysis, a **Dynamic Expression Engine** allowing any component parameter to be bound to mathematical formulas once per frame (including special variables like `$BASS` and `$BEAT`, and system functions like `%FFT` and `%BEAT`), a **Declarative Nested JSON Preset Schema** for seamless import/export, and the initial hierarchical compositing pipeline featuring a **Static Image Component** nested inside a composable **Frame Buffer Container Component**.

## 2. Functional Requirements

### 2.1 Project Infrastructure & Two-Plane Scaffold
- Initialize Vite + React 19 + TypeScript + Tailwind CSS with Vitest and testing setup.
- Enforce the Two-Plane decoupling:
  - **State Plane (React 19 + Zustand):** Manages graph topology, node selection, parameter values, theme preferences, and audio playback states (<10 Hz).
  - **Render Data Plane (Three.js):** Executes purely in `requestAnimationFrame` with zero React re-render overhead. Uses pre-allocated Float32Array buffers and material uniform mutations.

### 2.2 Reactive Audio Engine Foundation
- Web Audio `AudioContext` and `AnalyserNode` ($fftSize=2048$, smoothing $0.8$).
- Bundled audio test sample with play/pause/loop controls.
- Microphone input toggle with clean musical capture flags (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`).
- Extraction of logarithmic normalized energy bands: `$BASS` (20–250 Hz), `$MID` (250–4000 Hz), `$TREBLE` (4000–16000 Hz), `$RMS` energy, binary `$BEAT` transient detection, and elapsed `$TIME`.
- Channel support: Stereo channel analysis for Left, Right, and Mono ($L+R$).

### 2.3 Dynamic Expression Engine & Universal Parameter Binding
- **Per-Frame Evaluation:** Compiled mathematical expressions execute strictly once per frame within the Render Data Plane.
- **Built-in Special Values ($VARIABLE):**
  - Formatted with leading `$` in uppercase:
    - `$BASS`, `$MID`, `$TREBLE`: Normalized FFT bands (0.0–1.0).
    - `$RMS`: Overall RMS energy.
    - `$BPM`: Detected or configured tempo.
    - **`$BEAT`**: Binary trigger (evaluates strictly to `1.0` if the current frame is a beat, `0.0` otherwise).
    - `$TIME`: Elapsed time in seconds.
    - `$FRAME`: Monotonically increasing frame counter integer.
- **Built-in System Functions (%FUNCTION):**
  - Formatted with leading `%` in uppercase:
    - **`%FFT(lower_band, band_width, channel)`:**
      - Calculates energy of a custom frequency window.
      - `lower_band`: Normalized start frequency in $[0.0, 1.0]$ mapped logarithmically ($f = 20 \times 10^{3x}$) to $[20\text{Hz}, 20000\text{Hz}]$.
      - `band_width`: Frequency window width in $[0.0, 1.0]$.
      - `channel`: `0` = Left + Right (default mono mix), `1` = Left channel, `2` = Right channel.
    - **`%BEAT([decay_seconds = 0.2])` / `%BEAT_SECONDS([decay_seconds = 0.2])`:**
      - Transient attack pulse: Jumps to `1.0` on a detected beat, exponentially decaying to `0.0` over `decay_seconds` (default: 0.2s).
    - **`%BEAT_FRAMES([decay_frames = 12])`:**
      - Transient attack pulse: Jumps to `1.0` on a detected beat, exponentially decaying to `0.0` over `decay_frames` frames (default: 12 frames).
- **Universal Parameter Binding:**
  - All component parameters (e.g., Frame Buffer `scale`, `rotation`, `opacity`, `positionX`, `positionY`, `blend`) can be set to a static literal value or bound to a dynamic expression (e.g., `Blend: %FFT(0, 0.3, 1) * 0.5`, `Scale: 1.0 + %BEAT(0.25) * 0.4`).
- **Fault-Tolerant Sandboxing:**
  - Expressions compiled on edit via `expr-eval`.
  - Guarded against syntax errors, division by zero, `NaN`, and `Infinity`. Safe fallback to previous valid frame value.

### 2.4 Modular Visual Pipeline: Image & Frame Buffer Components
- **Static Image Component:**
  - Loads an image (JPG/PNG) via drag-and-drop or file picker, with an included bundled default test graphic.
  - Generates a WebGL texture source. Exposes no transformation knobs directly on the raw asset.
- **Frame Buffer Component (Container, Compositor & Buffer Router):**
  - Serves as a modular container for child visual components (such as the Static Image).
  - Renders child components into an offscreen `THREE.WebGLRenderTarget`.
  - Exposes container-level modulation parameters: Position (X, Y), Scale/Zoom, Rotation, Opacity, and Blend Mode.
  - **Master Frame Buffer Root:**
    - Every preset pipeline is strictly rooted in a single **Master Frame Buffer** (`is_master: true`), enclosing all visual components and child buffers.
    - **Clean Slate vs. Frame Feedback:** The Master Frame Buffer's blend mode determines the canvas lifecycle:
      - `Replace` (opacity 1.0): Clears the render target at the start of every frame, providing a clean slate.
      - Feedback blend modes (`Additive`, `Maximum`, `Minimum`, `Subtractive`, `Multiplicative`, or opacity < 1.0): Utilizes dual-FBO ping-pong render targets to feed the previous frame's rendered output into the next frame, producing classic motion trails, phosphor decay, and feedback textures.
  - **Named Buffer Routing (`save_to` & `load_from`):**
    - **Buffer Production (`save_to="#NAME"`):** Frame buffers can publish their rendered output into a global `BufferPool` keyed by a normalized identifier (e.g., `#BUFFER_A`).
    - **Buffer Consumption (`load_from="#NAME"`):** Frame buffers can load and sample an upstream rendered texture from `BufferPool` as a textured quad before or alongside compositing child components.
    - **Compositing & Multi-Quad Routing:** Enables complex multi-pass routing such as 4-corner scaled replication (e.g., loading `#BUFFER_A` into 4 child buffers scaled to 25% and translated to upper-left, upper-right, lower-left, lower-right), recursive feedback echoes, and PIP.
    - **Cycle Prevention & Graceful Fallback:** Prevents recursive freeze by isolating frame passes or using ping-pong references. If a referenced buffer has not yet rendered or does not exist, it safely falls back to a transparent empty texture with a diagnostic warning.
  - Supports 6 distinct blend modes:
    1. **Replace:** Overwrites existing pixels completely with the new layer data.
    2. **Additive (Add):** Adds color values of top layer to background layer (bright spots glow/overexpose, black areas stay unchanged).
    3. **Maximum Blend:** Compares each color channel value from both layers and keeps the higher value of the two.
    4. **Minimum Blend:** Compares pixel values and keeps the lower (darker) value.
    5. **Subtractive:** Subtracts the top layer's color values from the underlying layer.
    6. **Multiplicative (Multiply):** Multiplies background and top layer color channels, resulting in darker/shaded effects.

### 2.5 Split-View Interface, Node Inspector & `f(x)` Switcher
- **Left Panel:** Live Three.js WebGL visualizer canvas rendering the output at 60+ FPS.
  - **Toggleable FPS Counter Overlay:** Displays current frame rate by default in Studio/Editor Mode; can be toggled on/off via viewport header button. Automatically hidden in Live Performance Mode. Updated via throttled telemetry without triggering React re-renders.
- **Right Panel (Vertically Split):**
  - **Top Sub-Panel:** Interactive Node Pipeline Graph (`@xyflow/react`) displaying components and container connections.
  - **Bottom Sub-Panel (Node Inspector):** Dynamically displays the parameter controls for the selected node.
  - **Universal `f(x)` Parameter Toggle:** Each parameter row displays an `f(x)` button. In Fixed mode, it renders knobs/sliders/inputs. When toggled into Expression mode, it morphs into a formula input with `$SPECIAL_VALUE` and `%FUNCTION` auto-suggestions, syntax validation, and live preview evaluation chips.
  - **Inline Autocomplete & Documentation Dropdown:**
    - Triggered automatically when typing `$` or `%` inside the formula input.
    - Displays full variable and function definitions alongside live real-time values (e.g. `$BASS: 0.68`).
    - Full keyboard navigation (Arrow keys, Enter/Tab).
- **Collapsible Bottom Bar:** In-app Diagnostics / Error Console with glowing warning/error badge.

### 2.6 Declarative Nested JSON Preset Schema (Import & Export)
- The entire visualizer preset is represented as a single portable JSON document.
- **Nested Component Hierarchy:**
  - The root element (`root`) is strictly the **Master Frame Buffer** (`is_master: true`), containing child components and nested buffers in its `children` array.
  - Containers serialize a `children` array containing nested child components.
  - Parameters serialize with `{ "mode": "literal" | "expression", "value": ... }`.
- **Import / Export Actions:**
  - Export: Download active preset as a `.json` file or copy to clipboard.
  - Import: Load `.json` preset via file dialog, drag-and-drop, or paste, reconstructing both the React Flow graph and Three.js execution tree.

## 3. Non-Functional Requirements
- **Performance:** Maintain 60+ FPS without garbage collection stutter during audio playback.
- **Zero-Crash / Error Boundary:** Graceful handling of image loading failures, invalid formulas, or audio context suspension.

## 4. Acceptance Criteria
1. The web app builds and runs cleanly via `npm run dev` and passes `npm test`.
2. Audio plays from bundled sample or mic, populating special values (`$BASS`, `$MID`, `$TREBLE`, `$RMS`, binary `$BEAT`).
3. Binary `$BEAT` evaluates to `1.0` on beat frames and `0.0` on non-beat frames.
4. `%BEAT()`, `%BEAT_SECONDS(decay)`, and `%BEAT_FRAMES(decay)` decay smoothly from `1.0` to `0.0` following exponential curves.
5. System function `%FFT(lower, width, channel)` evaluates correctly with logarithmic frequency scaling and stereo channel selection.
6. The Static Image component loads and displays an image inside a Frame Buffer container.
7. Selecting the Frame Buffer node in the node graph opens its parameters in the bottom-right inspector.
8. Clicking `f(x)` on any parameter toggles it between fixed widget and dynamic formula input.
9. Typing `$` or `%` in the formula editor automatically opens the inline documentation dropdown showing variable definitions and live audio values.
10. Binding dynamic expressions with special values or system functions (e.g. `Blend: %FFT(0, 0.3, 1) * 0.5` or `Scale: 1.0 + %BEAT(0.2) * 0.3`) dynamically modulates visual parameters to the audio at 60+ FPS.
11. Tweaking Frame Buffer blend modes (Replace, Additive, Maximum, Minimum, Subtractive, Multiplicative) produces the expected visual compositing.
12. Every preset is structured with a single Master Frame Buffer root node; switching its blend mode to `Replace` starts each frame with a clean slate, while feedback blend modes (or partial opacity) feed previous frames into next frames via ping-pong FBOs to generate motion decay trails.
13. Frame buffers can produce named buffers (`save_to="#NAME"`) and consume named buffers (`load_from="#NAME"`), allowing multiple child buffers to sample and composite an upstream buffer (e.g. four scaled instances in each corner).
14. An FPS counter is displayed on the live preview canvas by default in Studio mode, accurately reflects rendering frame rate, is toggleable on/off by the user, and does not cause React re-render loops.
15. Exporting the active setup downloads a valid nested JSON preset file; importing that file perfectly restores the component tree, parameter expressions, and visual state.

## 5. Out of Scope for Track 1
- Full arbitrary GLSL shader editor / custom user shader authoring (Track 2).
- Web MIDI controller mapping (Track 2).
- IndexedDB preset library and community sharing (Track 3).
- Detached multi-window projector output (Roadmap).
