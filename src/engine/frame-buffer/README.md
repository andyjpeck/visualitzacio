# Frame Buffer Subsystem (`src/engine/frame-buffer/`)

This directory contains the core visual container, render-to-texture compositing, and dual-FBO ping-pong feedback loop architecture.

## Modules

- `frame-buffer-node.ts`: `FrameBufferNode` extending `VisualNode`. Manages offscreen `THREE.WebGLRenderTarget` textures, resolution scaling, dual-FBO ping-pong texture alternation, hierarchical child execution, and layer transform modulation.
- `frame-buffer-node.test.ts`: Vitest unit tests verifying render target allocation, resolution scaling, dual-FBO ping-pong swapping, child execution, and memory disposal.
