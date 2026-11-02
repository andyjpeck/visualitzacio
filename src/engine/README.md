# Rendering Engine (`src/engine/`)

The `engine` directory contains the high-frequency WebGL rendering orchestrator and 3D visual scene implementations.

## Key Modules

- [**`render-engine.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/render-engine.ts):
  - Manages the 60 FPS `requestAnimationFrame` render loop with `antialias: false, depth: false, stencil: false` on the root display canvas.
  - Implements delta-time calculation, `$DT` clamping (`<= 0.1s`), and accumulator-based target FPS pacing with remainder carry-over for high-refresh displays (120Hz/144Hz/240Hz).
  - Mutates `FrameContext` in-place each frame to avoid Garbage Collection (GC) pressure.
  - Measures true rendering FPS and triggers throttled UI callbacks.
  - Handles WebGL context loss and context restoration gracefully.
  - Coordinates the lifecycle (`init`, `resize`, `update`, `dispose`) of all attached `VisualNode` instances.

- [**`engine-performance-p0.test.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/engine-performance-p0.test.ts):
  - Performance and regression test suite verifying canvas WebGLRenderer flags, high-refresh accumulator frame pacing, `FrameBufferNode` depth stripping and pass-through FBO elimination, and `DuperscopeNode` / `DuperscopeRunner` partial buffer upload ranges and dormant point loop bypass.

- [**`visual-node.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/visual-node.ts):
  - Contains `TestVisualNode`, the primary audio-reactive 3D scene.
  - Features a prominent multifaceted icosahedron crystal with neon emissive glow, an outer wireframe lattice, and dynamic multi-point neon lighting (cyan, magenta, amber).
  - Modulates rotation with `$TIME`, scale with `$BASS` and `$BEAT`, wireframe colors with `$TREBLE`, and emissive brilliance with `$RMS`.

## Subdirectories

- [**`expressions/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/expressions/README.md):
  - Mathematical expression compiler and evaluator based on `expr-eval`.
  - Zero-allocation per-frame scope bindings for all system variables (`$TIME`, `$BASS`, etc.).
  - System functions library (`#BEAT`, `#BEAT_FRAMES`, `#FFT`, `#WAVEFORM`, `#TRI`, `#SAW`, `#SQR`).
  - `DynamicParam<T>` parameter binding abstraction.

- [**`frame-buffer/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/frame-buffer/README.md):
  - Modular container and render-to-texture buffer architecture (`FrameBufferNode`).
  - Dual-FBO ping-pong feedback texture swapping with zero per-frame GC allocations, default `depthBuffer: false`, and zero-FBO direct pass-through optimization.
  - Custom GLSL full-screen quad shader (`CompositingShader`) supporting the 6 standard blend modes (`replace`, `additive`, `maximum`, `minimum`, `subtractive`, `multiplicative`).
  - Global `BufferPool` texture registry for named buffer routing (`@NAME`) and circular dependency detection.
  - Curated catalog of built-in frame buffer templates (`FRAME_BUFFER_TEMPLATES`).

- [**`nodes/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/nodes/README.md):
  - Reusable 2D/3D visual scene components implementing `VisualNode` (`StaticImageNode`, `DuperscopeNode`, `MaskCompositorNode`).

- [**`presets/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/presets/README.md):
  - Schema-validated preset serialization and deserialization engine.
  - Converts active scene configurations into portable JSON documents with metadata, topological hierarchies, execution indices, and dynamic parameters.
