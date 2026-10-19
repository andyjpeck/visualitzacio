# Rendering Engine (`src/engine/`)

The `engine` directory contains the high-frequency WebGL rendering orchestrator and 3D visual scene implementations.

## Key Modules

- [**`render-engine.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/render-engine.ts):
  - Manages the 60 FPS requestAnimationFrame render loop.
  - Implements delta-time calculation, frame clamping, and target FPS pacing.
  - Mutates `FrameContext` in-place each frame to avoid Garbage Collection (GC) pressure.
  - Measures true rendering FPS and triggers throttled UI callbacks.
  - Handles WebGL context loss and context restoration gracefully.
  - Coordinates the lifecycle (`init`, `resize`, `update`, `dispose`) of all attached `VisualNode` instances.

- [**`visual-node.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/visual-node.ts):
  - Contains `TestVisualNode`, the primary audio-reactive 3D scene.
  - Features a prominent multifaceted icosahedron crystal with neon emissive glow, an outer wireframe lattice, an orbiting cyberpunk halo ring, and dynamic multi-point neon lighting (cyan, magenta, amber).
  - Modulates rotation with `$TIME`, scale with `$BASS` and `$BEAT`, wireframe colors with `$TREBLE`, and emissive brilliance with `$RMS`.

## Subdirectories

- [**`expressions/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/expressions/README.md):
  - Mathematical expression compiler and evaluator based on `expr-eval`.
  - Zero-allocation per-frame scope bindings for all system variables (`$TIME`, `$BASS`, etc.).
  - System functions library (`#BEAT`, `#BEAT_FRAMES`, `#FFT`, `#WAVEFORM`, `#TRI`, `#SAW`, `#SQR`).
  - `DynamicParam<T>` parameter binding abstraction.

- [**`frame-buffer/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/frame-buffer/README.md):
  - Modular container and render-to-texture buffer architecture (`FrameBufferNode`).
  - Dual-FBO ping-pong feedback texture swapping with zero per-frame GC allocations.
  - Custom GLSL full-screen quad shader (`CompositingShader`) supporting the 6 standard blend modes (`replace`, `additive`, `maximum`, `minimum`, `subtractive`, `multiplicative`).
  - Global `BufferPool` texture registry for named buffer routing (`@NAME`) and circular dependency detection.
  - Curated catalog of built-in frame buffer templates (`FRAME_BUFFER_TEMPLATES`).

- [**`nodes/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/nodes/README.md):
  - Reusable 2D/3D visual scene components implementing `VisualNode`.
  - `StaticImageNode`: Static image display with aspect-ratio preservation (`cover`, `contain`, `stretch`) and BufferPool export.
