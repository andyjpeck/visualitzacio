# Frame Buffer Subsystem (`src/engine/frame-buffer/`)

This directory contains the core visual container, render-to-texture compositing, and dual-FBO ping-pong feedback loop architecture.

## Modules

- `frame-buffer-node.ts`: `FrameBufferNode` extending `VisualNode`. Manages offscreen `THREE.WebGLRenderTarget` textures, resolution scaling, dual-FBO ping-pong texture alternation, hierarchical child execution, layer transform modulation, and feedback compositing.
- `frame-buffer-node.test.ts`: Vitest unit tests verifying render target allocation, resolution scaling, dual-FBO ping-pong swapping, feedback loop uniforms, autoClear management, and memory disposal.
- `compositing-shader.ts`: Custom GLSL full-screen quad shader (`CompositingShader`) supporting the 6 standard blend modes (`replace`, `additive`, `maximum`, `minimum`, `subtractive`, `multiplicative`), feedback UV transform modulation (scale, rotation, offset), and ShaderMaterial factory.
- `compositing-shader.test.ts`: Vitest unit tests verifying blend mode arithmetic, opacity modulation, UV transformation math, and ShaderMaterial initialization.
