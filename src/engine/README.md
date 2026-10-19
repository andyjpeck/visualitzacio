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
