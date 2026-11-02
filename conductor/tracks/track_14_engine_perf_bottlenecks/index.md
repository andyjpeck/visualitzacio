# Track 14: Engine Performance — Render Pass, VRAM & Bandwidth Optimizations (#14)

This track eliminates full-screen render pass, VRAM allocation, high-refresh frame pacing, and CPU/PCIe buffer upload bottlenecks identified in [Issue #14](https://github.com/andyjpeck/visualitzacio/issues/14).

## Documents

- [**Track Specification (`spec.md`)**](./spec.md): Functional, non-functional, and architectural requirements.
- [**Implementation Plan (`plan.md`)**](./plan.md): Phased TDD implementation plan.
- [**Metadata (`metadata.json`)**](./metadata.json): Track status, type, and branch tracking.

## Key Deliverables

1. **Main Canvas WebGLRenderer Optimization:** Disable unnecessary 4x MSAA (`antialias: false`) and depth/stencil buffers (`depth: false, stencil: false`) on the root display canvas.
2. **FrameBufferNode Depth Stripping & Conditional Pass-Through Allocation:** Default `depthBuffer: false` on offscreen render targets, guard `clearDepth()` calls, and skip FBO allocations on direct pass-through replicator nodes until needed.
3. **High-Refresh Display Frame Pacing:** Fix `RenderEngine.renderFrame()` with accumulator-based remainder carry-over so 60 FPS paces evenly on 60 Hz, 120 Hz, 144 Hz, and 240 Hz displays without stalling.
4. **Duperscope Upload Ranges & Dormant Point Loop Bypass:** Configure `THREE.DynamicDrawUsage`, apply `BufferAttribute.addUpdateRange(0, activeCount * itemSize)`, and short-circuit dormant point loops while preserving `beat` and `frame` phase state updates.
