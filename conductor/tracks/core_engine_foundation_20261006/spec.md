# Specification: Core Engine Foundation & Modular Frame Buffer MVP

## 1. Overview
This bootstrap track establishes Visualització's foundational architecture: a high-performance, two-plane execution model decoupling React UI from a 60+ FPS Three.js/WebGL render loop, basic Web Audio frequency analysis, a **Dynamic Expression Engine** allowing any component parameter to be bound to mathematical formulas once per frame (including special variables like `$BASS` and `$BEAT`, and system functions like `#FFT` and `#BEAT`), a **Declarative Nested JSON Preset Schema** for seamless import/export, and the initial hierarchical compositing pipeline featuring a **Static Image Component** nested inside a composable **Frame Buffer Container Component**.

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
- **Built-in System Functions (#FUNCTION):**
  - Formatted with leading `#` in uppercase (all `#` functions require parentheses):
    - **`#FFT(lower_band, band_width, channel)`:**
      - Calculates energy of a custom frequency window.
      - `lower_band`: Normalized start frequency in $[0.0, 1.0]$ mapped logarithmically ($f = 20 \times 10^{3x}$) to $[20\text{Hz}, 20000\text{Hz}]$.
      - `band_width`: Frequency window width in $[0.0, 1.0]$.
      - `channel`: `0` = Left + Right (default mono mix), `1` = Left channel, `2` = Right channel.
    - **`#BEAT([decay_seconds = 0.2])` / `#BEAT_SECONDS([decay_seconds = 0.2])`:**
      - Transient attack pulse: Jumps to `1.0` on a detected beat, exponentially decaying to `0.0` over `decay_seconds` (default: 0.2s).
    - **`#BEAT_FRAMES([decay_frames = 12])`:**
      - Transient attack pulse: Jumps to `1.0` on a detected beat, exponentially decaying to `0.0` over `decay_frames` frames (default: 12 frames).
- **Universal Parameter Binding:**
  - All component parameters (e.g., Frame Buffer `scale`, `rotation`, `opacity`, `positionX`, `positionY`, `blend_mode`) can be set to a static literal value or bound to a dynamic expression (e.g., `opacity: #FFT(0, 0.3, 1) * 0.5`, `scale: 1.0 + #BEAT(0.25) * 0.4`).
- **Fault-Tolerant Sandboxing:**
  - Preprocessor selectively transforms system functions (`#NAME(` $\to$ `__fn_NAME(`) and special variables (`$NAME` $\to$ `__var_NAME`) prior to compiling with `expr-eval`.
  - Standard mathematical expressions and operators remain untouched and fully functional.
  - Guarded against syntax errors, division by zero, `NaN`, and `Infinity`. Safe fallback to previous valid frame value, or initial literal value on frame 0.

### 2.4 Modular Visual Pipeline: Image & Frame Buffer Components
*(See complete component proposals: [Static Image Proposal](../../../component_proposals/static_image.md) and [Frame Buffer Proposal](../../../component_proposals/frame_buffer.md))*

- **Static Image Component (`static_image`):**
  - Loads an image (JPG/PNG) via drag-and-drop or file picker, with an included bundled default test graphic.
  - Exposes `source_url`, `fit_mode` (`cover`, `contain`, `stretch`), and `filter` (`linear`, `nearest`). Exposes no spatial transformation knobs directly on the raw asset (delegating them to enclosing containers).
- **Frame Buffer Component (`frame_buffer` - Container, Compositor & Buffer Router):**
  - Serves as a modular container for child visual components (such as the Static Image).
  - Renders child components into an offscreen `THREE.WebGLRenderTarget`.
  - Exposes container-level modulation parameters:
    - **Position X (`positionX`):** Horizontal translation in $[-1.0, 1.0]$ (`-1.0` = left edge, `1.0` = right edge, `0.0` = center).
    - **Position Y (`positionY`):** Vertical translation in $[-1.0, 1.0]$ (`-1.0` = bottom edge, `1.0` = top edge, `0.0` = center).
    - **Scale/Zoom:** Scaling factor (default: `1.0`).
    - **Rotation:** Rotation angle.
    - **Opacity:** Layer opacity in $[0.0, 1.0]$ (default: `1.0`).
    - **Blend Mode (`blend_mode`):** One of the 6 blend mode enums.
  - **Master Frame Buffer Root:**
    - Every preset pipeline is strictly rooted in a single **Master Frame Buffer** (`is_master: true`), enclosing all visual components and child buffers.
    - **Clean Slate vs. Frame Feedback:** The Master Frame Buffer's blend mode determines the canvas lifecycle:
      - `Replace` (opacity 1.0): Clears the render target at the start of every frame, providing a clean slate.
      - Feedback blend modes (`Additive`, `Maximum`, `Minimum`, `Subtractive`, `Multiplicative`, or opacity < 1.0): Utilizes dual-FBO ping-pong render targets to feed the previous frame's rendered output into the next frame, producing classic motion trails, phosphor decay, and feedback textures.
  - **Named Buffer Routing (`save_to` & `load_from`):**
    - **Buffer Production (`save_to="@NAME"`):** Frame buffers can publish their rendered output into a global `BufferPool` keyed by a normalized identifier (e.g., `@BUFFER_A`).
    - **Buffer Consumption (`load_from="@NAME"`):** Frame buffers can load and sample an upstream rendered texture from `BufferPool` as a textured quad before or alongside compositing child components.
    - **Compositing & Multi-Quad Routing:** Enables complex multi-pass routing such as 4-corner scaled replication (e.g., loading `@BUFFER_A` into 4 child buffers scaled to 0.5 and translated to corners: top-left $x=-0.5, y=0.5$; top-right $x=0.5, y=0.5$; bottom-left $x=-0.5, y=-0.5$; bottom-right $x=0.5, y=-0.5$), recursive feedback echoes, and PIP.
    - **Cycle Prevention & Error Handling:** If a circular dependency or nonexistent buffer name is configured, the affected buffer is disabled from rendering, flagged with a visual error state, and logged to the Diagnostics Console (preventing infinite loops or application freezing).
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
  - **Universal `f(x)` Parameter Toggle:** Each parameter row displays an `f(x)` button. In Fixed mode, it renders knobs/sliders/inputs. When toggled into Expression mode, it morphs into a formula input with `$SPECIAL_VALUE` and `#FUNCTION` auto-suggestions, syntax validation, and formula status chips.
  - **Inline Autocomplete & Documentation Dropdown:**
    - Triggered automatically when typing `$` or `#` inside the formula input.
    - Displays full variable and function definitions, parameter signatures, and usage documentation.
    - Full keyboard navigation (Arrow keys, Enter/Tab).
- **Collapsible Bottom Bar:** In-app Diagnostics / Error Console with glowing warning/error badge.

### 2.6 Declarative Nested JSON Preset Schema (Import & Export)
- The entire visualizer preset is represented as a single portable JSON document.
- **Nested Component Hierarchy:**
  - The root element (`root`) is strictly the **Master Frame Buffer** (`is_master: true`), containing child components and nested buffers in its `children` array.
  - Containers serialize a `children` array containing nested child components.
  - Parameters serialize with `{ "mode": "fixed" | "expression", "value": ... }`.
  - Manual canvas node coordinates are not serialized; upon preset import, the editor executes an automatic hierarchical tree layout.
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
4. `#BEAT()`, `#BEAT_SECONDS(decay)`, and `#BEAT_FRAMES(decay)` decay smoothly from `1.0` to `0.0` following exponential curves.
5. System function `#FFT(lower_band, band_width, channel)` evaluates correctly with logarithmic frequency scaling and stereo channel selection.
6. Standard mathematical operators and functions evaluate correctly alongside `#FUNCTION(...)` system calls and `$VARIABLE` tokens.
7. The Static Image component loads and displays an image inside a Frame Buffer container.
8. Selecting the Frame Buffer node in the node graph opens its parameters in the bottom-right inspector.
9. Clicking `f(x)` on any parameter toggles it between fixed widget and dynamic formula input.
10. Typing `$` or `#` in the formula editor automatically opens the inline documentation dropdown showing variable and function definitions.
11. Binding dynamic expressions with special values or system functions (e.g. `opacity: #FFT(0, 0.3, 1) * 0.5` or `scale: 1.0 + #BEAT(0.2) * 0.3`) dynamically modulates visual parameters to the audio at 60+ FPS.
12. Tweaking Frame Buffer blend modes (Replace, Additive, Maximum, Minimum, Subtractive, Multiplicative) produces the expected visual compositing.
13. Every preset is structured with a single Master Frame Buffer root node; switching its blend mode to `Replace` starts each frame with a clean slate, while feedback blend modes (or partial opacity) feed previous frames into next frames via ping-pong FBOs to generate motion decay trails.
14. Frame buffers can produce named buffers (`save_to="@NAME"`) and consume named buffers (`load_from="@NAME"`), allowing multiple child buffers to sample and composite an upstream buffer using Winamp AVS coordinates $[-1.0, 1.0]$ (e.g. four corner instances: top-left at $x=-0.5, y=0.5$; top-right at $x=0.5, y=0.5$; bottom-left at $x=-0.5, y=-0.5$; bottom-right at $x=0.5, y=-0.5$). If a cycle or missing buffer occurs, the node disables and enters an error state.
15. An FPS counter is displayed on the live preview canvas by default in Studio mode, accurately reflects rendering frame rate, is toggleable on/off by the user, and does not cause React re-render loops.
16. Exporting the active setup downloads a valid nested JSON preset file; importing that file perfectly restores the component tree, parameter expressions, and visual state with automatic graph layout.

## 5. Out of Scope for Track 1
- **Duperscope Generative Synthesis Component** (Track 2: Generative Visual Synthesis & Duperscope MVP).
- Full arbitrary GLSL shader editor / custom user shader authoring (Track 2).
- Web MIDI controller mapping (Track 2).
- IndexedDB preset library and community sharing (Track 3).
- Detached multi-window projector output (Roadmap).
