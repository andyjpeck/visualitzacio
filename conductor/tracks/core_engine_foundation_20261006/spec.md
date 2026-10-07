# Specification: Core Engine Foundation & Modular Frame Buffer MVP

## 1. Overview
This bootstrap track establishes Visualització's foundational architecture: a high-performance, two-plane execution model decoupling React UI from a 60+ FPS Three.js/WebGL render loop, basic Web Audio frequency analysis, a **Dynamic Expression Engine** allowing any component parameter to be bound to mathematical formulas once per frame (including special variables like `$BASS` and `$BEAT`, and system functions like `%FFT` and `%BEAT`), and the initial hierarchical compositing pipeline featuring a **Static Image Component** nested inside a composable **Frame Buffer Container Component**.

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
- **Frame Buffer Component (Container / Compositor):**
  - Serves as a modular container for child visual components (such as the Static Image).
  - Renders child components into an offscreen `THREE.WebGLRenderTarget`.
  - Exposes container-level modulation parameters: Position (X, Y), Scale/Zoom, Rotation, Opacity, and Blend Mode.
  - Supports 6 distinct blend modes:
    1. **Replace:** Overwrites existing pixels completely with the new layer data.
    2. **Additive (Add):** Adds color values of top layer to background layer (bright spots glow/overexpose, black areas stay unchanged).
    3. **Maximum Blend:** Compares each color channel value from both layers and keeps the higher value of the two.
    4. **Minimum Blend:** Compares pixel values and keeps the lower (darker) value.
    5. **Subtractive:** Subtracts the top layer's color values from the underlying layer.
    6. **Multiplicative (Multiply):** Multiplies background and top layer color channels, resulting in darker/shaded effects.

### 2.5 Split-View Interface, Node Inspector & `f(x)` Switcher
- **Left Panel:** Live Three.js WebGL visualizer canvas rendering the output at 60+ FPS.
- **Right Panel (Vertically Split):**
  - **Top Sub-Panel:** Interactive Node Pipeline Graph (`@xyflow/react`) displaying components and container connections.
  - **Bottom Sub-Panel (Node Inspector):** Dynamically displays the parameter controls for the selected node.
  - **Universal `f(x)` Parameter Toggle:** Each parameter row displays an `f(x)` button. In Fixed mode, it renders knobs/sliders/inputs. When toggled into Expression mode, it morphs into a formula input with `$SPECIAL_VALUE` and `%FUNCTION` auto-suggestions, syntax validation, and live preview evaluation chips.
- **Collapsible Bottom Bar:** In-app Diagnostics / Error Console with glowing warning/error badge.

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
9. Binding dynamic expressions with special values or system functions (e.g. `Blend: %FFT(0, 0.3, 1) * 0.5` or `Scale: 1.0 + %BEAT(0.2) * 0.3`) dynamically modulates visual parameters to the audio at 60+ FPS.
10. Tweaking Frame Buffer blend modes (Replace, Additive, Maximum, Minimum, Subtractive, Multiplicative) produces the expected visual compositing.

## 5. Out of Scope for Track 1
- Full arbitrary GLSL shader editor / custom user shader authoring (Track 2).
- Web MIDI controller mapping (Track 2).
- IndexedDB preset library and community sharing (Track 3).
- Detached multi-window projector output (Roadmap).
