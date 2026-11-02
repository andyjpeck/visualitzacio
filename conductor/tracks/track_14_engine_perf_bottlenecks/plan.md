# Implementation Plan: Track 14 — Engine Performance: Render Pass, VRAM & Bandwidth Optimizations (#14)

## Phase 1: Core Engine, Frame Buffer & High-Refresh Pacing Optimizations

- [x] Task 1.1: Write Failing Unit Tests for Canvas Initialization, FBO Depth/Pass-Through Optimization & High-Refresh Pacing (Red Phase) `b89626c`
  - [x] Create `src/engine/engine-performance-p0.test.ts` testing `RenderEngine` WebGLRenderer parameters (`antialias: false`, `depth: false`, `stencil: false`), `FrameBufferNode` default `depthBuffer: false` and conditional `clearDepth()`, direct pass-through FBO skipping with on-demand allocation on mutation, and 120Hz/144Hz accumulator frame pacing
  - [x] Update `src/engine/frame-buffer/frame-buffer-node.test.ts` to test both default `depthBuffer: false` (no `clearDepth`) and explicit `depthBuffer: true` (`clearDepth` invoked between siblings)
- [x] Task 1.2: Implement WebGLRenderer Flags & Accumulator-Based Frame Pacing in RenderEngine (Green Phase) `afc2ad0`
  - [x] Add `rendererFactory` option to `RenderEngineOptions` and configure default `THREE.WebGLRenderer` with `antialias: false, depth: false, stencil: false, alpha: false, powerPreference: 'high-performance'`
  - [x] Implement accumulator-based remainder carry-over frame pacing in `RenderEngine.renderFrame()` so high-refresh displays pace smoothly without stalling
  - [x] Update JSDoc comments in `src/engine/render-engine.ts`
- [~] Task 1.3: Implement FrameBufferNode Depth Buffer Stripping & Conditional Pass-Through Allocation (Green Phase)
  - [~] Add `depthBuffer?: boolean` (default `false`) to `FrameBufferNodeOptions`, pass to `THREE.WebGLRenderTarget`, and guard `clearDepth()` in `update()`
  - [~] Skip allocating FBOs in `allocateRenderTargets()` when the node is in direct pass-through mode (`loadFrom` set, no children, no `feedback`, no `saveTo`, `inputBlendMode !== 'none'`), and allocate on-demand if mutated out of pass-through mode
  - [~] Update JSDoc comments in `src/engine/frame-buffer/frame-buffer-node.ts`
- [ ] Task 1.4: Phase 1 Verification & Checkpoint (Refer to workflow.md)
  - [ ] Run unit tests for `RenderEngine` and `FrameBufferNode` and confirm green status

---

## Phase 2: Duperscope Buffer Upload Ranges, Dynamic Draw Usage & Dormant Loop Bypass

- [ ] Task 2.1: Write Failing Unit Tests for Duperscope DynamicDrawUsage, Update Ranges & Dormant Loop Bypass (Red Phase)
  - [ ] Extend `src/engine/engine-performance-p0.test.ts` and `src/engine/nodes/duperscope-runner.test.ts` with tests for `THREE.DynamicDrawUsage`, `BufferAttribute.updateRanges`, `n` clamping in `[0, 4096]`, dormant point loop auto-bypass (when `linesize <= 0` or `a <= 0.001` without `point` phase override, or `opacity <= 0.001`), and `quadrant-mirrored-spectrum` dormant lightning node short-circuiting
- [ ] Task 2.2: Implement DuperscopeRunner Dormant Point Loop Bypass & DuperscopeNode Partial Buffer Uploads (Green Phase)
  - [ ] Clamp `n` to `[0, 4096]` and implement zero-allocation dormant point loop bypass in `DuperscopeRunner.runFrame()` while preserving `beat` and `frame` phase state updates
  - [ ] Configure `THREE.DynamicDrawUsage` on all dynamic ribbon and point attributes, apply `clearUpdateRanges()` and `addUpdateRange(0, activeCount * itemSize)`, and skip upload/render when `activeCount === 0` or `currentOpacity <= 0.001` in `DuperscopeNode`
  - [ ] Synchronize JSDoc and architecture documentation in `conductor/tech-stack.md`
- [ ] Task 2.3: Three-Tier Verification Gate & Stateless Track Review (Refer to workflow.md)
  - [ ] Execute Tier 1 (`npm run lint`, `npm run build`, `npm test`), Tier 2 (`preset-render-smoke.test.ts`), and Tier 3 (`npm run test:e2e`)
  - [ ] Perform stateless code and documentation review
