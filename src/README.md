# Source Code (`src/`)

Welcome to the core codebase of **Visualització**, a real-time 60 FPS modular music visualizer built with WebGL (Three.js), Web Audio API, and React 19.

## Architecture: Two-Plane System

To ensure smooth 60 FPS rendering under heavy audio FFT processing, the application strictly decouples rendering from user interface state:

1. **High-Frequency Visual Plane (60+ FPS):**
   - Driven entirely by `RenderEngine` using `requestAnimationFrame`.
   - Modulates mutable in-place `FrameContext` buffers without garbage collection overhead.
   - Updates Three.js WebGL scenes and direct DOM telemetry overlays with **zero React re-renders**.

2. **Low-Frequency UI Plane (<10 Hz):**
   - Managed by React 19 and Zustand (`useAppStore`).
   - Handles user interactions, preset settings dialogs, audio input switching, and transport controls.

---

## Directory Structure

The following subdirectories compose the application layer:

- [**`assets/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/assets/README.md)
  Static styles, global CSS styling (Tailwind CSS 4), and font/asset imports.

- [**`audio/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/audio/README.md)
  Web Audio API graph infrastructure, DSP analysis, procedural beat synthesis, microphone capture, and local audio file playback with seeking.

- [**`contracts/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/contracts/README.md)
  TypeScript interface contracts, telemetry data models (`FrameContext`), preset configurations (`PresetSettings`), and hardware abstraction interfaces (`RendererLike`, `VisualNode`).

- [**`engine/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/README.md)
  60 FPS rendering loop orchestrator (`RenderEngine`), animation frame pacing, WebGL context lifecycle handling, and 3D visual scene nodes (`TestVisualNode`).

- [**`ui/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/README.md)
  React presentation layer, including the WebGL canvas mount, HUD overlays, preset configuration modal, global Zustand store, and floating glassmorphic toolbar.

- [**`test/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/test/README.md)
  Vitest test environment setup, testing utilities, and headless mock fixtures for AudioContext, WebGLRenderer, and animation schedulers.
