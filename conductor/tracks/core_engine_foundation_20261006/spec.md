# Specification: Core Engine Foundation & Modular Frame Buffer MVP

## 1. Overview
This bootstrap track establishes Visualització's foundational architecture: a high-performance, two-plane execution model decoupling React UI from a 60+ FPS Three.js/WebGL render loop, basic Web Audio frequency analysis, and the initial hierarchical compositing pipeline featuring a **Static Image Component** nested inside a composable **Frame Buffer Container Component**.

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
- Extraction of logarithmic normalized energy bands: `bass` (20–250 Hz), `mid` (250–4000 Hz), `treble` (4000–16000 Hz), and overall `rms`.

### 2.3 Modular Visual Pipeline: Image & Frame Buffer Components
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
  - Parameters can be manipulated manually or bound to audio energy (e.g. Bass -> Scale).

### 2.4 Split-View Interface & Parameter Inspector
- **Left Panel:** Live Three.js WebGL visualizer canvas rendering the output at 60+ FPS.
- **Right Panel (Vertically Split):**
  - **Top Sub-Panel:** Interactive Node Pipeline Graph (`@xyflow/react`) displaying components, container connections, and audio reactive cables.
  - **Bottom Sub-Panel (Node Inspector):** Dynamically displays the detailed parameter controls (sliders, knobs, dropdowns, formula inputs) for whichever node is currently selected on the graph.
- **Collapsible Bottom Bar:** In-app Diagnostics / Error Console with glowing warning/error badge.

## 3. Non-Functional Requirements
- **Performance:** Maintain 60+ FPS without garbage collection stutter during audio playback.
- **Zero-Crash / Error Boundary:** Graceful handling of image loading failures or audio context suspension.

## 4. Acceptance Criteria
1. The web app builds and runs cleanly via `npm run dev` and passes `npm test`.
2. Audio plays from bundled sample or mic, showing live FFT reactivity.
3. The Static Image component loads and displays an image inside a Frame Buffer container.
4. Selecting the Frame Buffer node in the node graph opens its parameters in the bottom-right inspector.
5. Tweaking Frame Buffer scale, rotation, opacity, and blend modes transforms the rendered image in real time at 60+ FPS.
6. Binding audio energy (e.g., bass) to the Frame Buffer container visibly modulates its scale/rotation to the music.

## 5. Out of Scope for Track 1
- Full arbitrary GLSL shader editor / custom user shader authoring (Track 2).
- Web MIDI controller mapping (Track 2).
- IndexedDB preset library and community sharing (Track 3).
- Detached multi-window projector output (Roadmap).
