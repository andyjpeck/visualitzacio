# Visual Nodes Subsystem (`src/engine/nodes/`)

This directory contains reusable scene and media nodes that implement the `VisualNode` lifecycle interface.

## Modules

- `static-image-node.ts`: `StaticImageNode` implementing `VisualNode`. Displays static image textures with aspect-ratio preservation (`cover`, `contain`, `stretch`), dynamic expression opacity modulation, named buffer registration with `BufferPool`, and Base64 data URL encoding for local file uploads and JSON preset serialization.
- `static-image-node.test.ts`: Vitest unit tests verifying aspect-ratio scaling across portrait/landscape/square ratios, dynamic opacity evaluation, BufferPool registration, Base64 texture loading, and resource disposal.
- `duperscope-compiler.ts`: `DuperscopeCompiler` implementing multi-statement script compilation, comment stripping (`//` and `/* ... */`), statement splitting by semicolons/newlines, read-only variable guards (`i`, `v`, and `n` in `point`), and sandboxed `expr-eval` AST validation across all 4 lifecycle phases (`init`, `beat`, `frame`, `point`).
- `duperscope-compiler.test.ts`: Unit test suite verifying comment stripping, statement splitting, AST compilation, read-only guards, error reporting, and sandboxing.
- `duperscope-runner.ts`: `DuperscopeRunner` implementing zero-allocation 60 FPS evaluation of the 4-phase lifecycle (`init`, `beat`, `frame`, `point`) with `beat`-before-`frame` order on beat frames, persistent user state dictionaries, `sampleDuperscopeAudio` (time-domain waveform and logarithmic FFT spectrum), and direct buffer population into pre-allocated `Float32Array` vertex/color/size attributes.
- `duperscope-runner.test.ts`: Unit test suite verifying variable persistence across frames, `beat`-before-`frame` transient execution, `linesize` and `skip` semantics, `n` clamping, and audio sampling fidelity.
- `duperscope-shaders.ts`: Custom GLSL shader materials and pre-allocated `THREE.InstancedBufferGeometry` generators for Duperscope. Includes Instanced Screen-Space Quad Ribbons overcoming the 1px WebGL line width hardware limit (`linesize` 1px–128px and per-vertex RGBA gradients) and anti-aliased circular particle shaders with 1:1 square aspect ratio projection.
- `duperscope-shaders.test.ts`: Unit test suite verifying shader material construction, uniform defaults, attribute bindings, and instanced geometry allocation.
