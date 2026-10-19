# Implementation Plan: Track 3 — Modular Frame Buffer, Ping-Pong Feedback & Named Buffers

## Phase 1: Frame Buffer Core & Dual-FBO Ping-Pong Pipeline (TDD)

- [x] Task: Frame Buffer Node & Render Target Lifecycle (TDD)
  - [x] Write unit tests for `FrameBufferNode` verifying texture allocation, canvas resize handling, resolution scale multiplication, and child node execution.
  - [x] Implement `FrameBufferNode` extending `VisualNode` with `THREE.WebGLRenderTarget` management and transform uniforms (`scale`, `rotation`, `position_x`, `position_y`, `opacity`).
- [x] Task: Dual-FBO Ping-Pong Swap Mechanism (TDD)
  - [x] Write unit tests verifying ping-pong buffer allocation, read/write pointer swapping, and clean slate clearing.
  - [x] Implement dual-FBO ping-pong texture swapping in `FrameBufferNode` with zero per-frame garbage collection allocations.
- [x] Task: Phase 1 Checkpoint & Unit Test Verification
  - [x] Run test suite (`npm test`) to ensure all render target and ping-pong tests pass.

---

## Phase 2: Ping-Pong Feedback Motion Trails & Multi-Pass Shader Blending (TDD)

- [x] Task: Multi-Pass Blending Shader Pass (TDD)
  - [x] Write unit tests verifying the 6 compositing blend modes (`replace`, `additive`, `maximum`, `minimum`, `subtractive`, `multiplicative`) and opacity modulation math.
  - [x] Implement custom GLSL full-screen quad shader (`CompositingShader`) with uniform bindings.
- [x] Task: Audio-Reactive Feedback Motion Modulation (TDD)
  - [x] Write integration tests verifying dynamic expression bindings on `opacity`, `scale`, and `rotation` driving feedback trails.
  - [x] Connect `ExpressionEngine` dynamic parameters to `FrameBufferNode` feedback uniforms.
- [x] Task: Phase 2 Checkpoint & Visual Verification
  - [x] Run test suite (`npm test`) and visually verify motion trails in browser with procedural beat.

---

## Phase 3: Named Buffers (@NAME), Static Image Component & Built-in Templates (TDD)

- [ ] Task: Global `BufferPool` & Named Texture Routing (TDD)
  - [ ] Write unit tests for `BufferPool`: registering textures via `save_to`, resolving textures via `load_from`, detecting circular dependencies, and safe error fallbacks.
  - [ ] Implement `BufferPool` class and integrate into `RenderEngine` frame lifecycle.
- [ ] Task: Static Image Component (`StaticImageNode`) (TDD)
  - [ ] Write unit tests for `StaticImageNode`: texture loading, aspect-ratio calculations for `cover`, `contain`, `stretch` fit modes, and opacity modulation.
  - [ ] Implement `StaticImageNode` with WebGL texture loader and aspect-preserving quad geometry.
- [ ] Task: Built-in Frame Buffer Templates Catalog (TDD)
  - [ ] Create `src/engine/frame-buffer/frame-buffer-templates.ts` defining all 6 curated templates:
    1. Clean Slate Default
    2. Analog Phosphor Trails
    3. Infinite Feedback Vortex
    4. 4-Corner Multi-Screen Replicator
    5. Picture-in-Picture (PIP) Echo
    6. Beat-Pulsed Shockwave Feedback
  - [ ] Write unit tests validating that all templates conform to the JSON preset schema and instantiate without errors.
- [ ] Task: Phase 3 Checkpoint & Integration Verification
  - [ ] Run full test suite (`npm test`) and verify named buffer routing and template definitions.

---

## Phase 4: UI Integration, Template Selector & Manual Verification (TDD)

- [ ] Task: Frame Buffer Template Selector UI Component (TDD)
  - [ ] Write component tests for `FrameBufferTemplateSelector`: popover rendering, template selection, dirty-state confirmation guard, and Zustand state updates.
  - [ ] Implement `FrameBufferTemplateSelector` popover modal with cyberpunk theme styling.
- [ ] Task: Toolbar & Settings Integration
  - [ ] Add Frame Buffer / Feedback controls to the top toolbar and preset settings modal.
  - [ ] Provide immediate UI sliders and `f(x)` expression buttons for live feedback tuning (`opacity`, `scale`, `rotation`, `blend_mode`).
- [ ] Task: Phase 4 Manual Verification Checkpoint
  - [ ] Verify all 6 templates in browser with audio running: confirm phosphor trails, feedback vortex, 4-corner quads, and shockwave expansions.

---

## Phase 5: Quality Assurance, Documentation & Mandatory Track Completion Protocol

- [ ] Task: Code Documentation & Directory README Audit
  - [ ] Verify JSDoc coverage across 100% of newly created classes and public methods.
  - [ ] Update directory `README.md` files for any new or modified directories (`src/engine/frame-buffer/`, `src/ui/templates/`, etc.).
- [ ] Task: Pre-Upload Verification & GitHub Sync
  - [ ] Execute `oxlint` linter check (`npm run lint`).
  - [ ] Execute production build (`npm run build`).
  - [ ] Execute full unit test suite (`npm test`).
  - [ ] Commit all completed deliverables following Conventional Commits referencing Issue #6.
- [ ] Task: Track Completion Stateless Review, Logical Scope & Decomposition Protocol
  - [ ] Conduct stateless repository audit of code complexity and single-responsibility boundaries.
  - [ ] Use file size as a heuristic to evaluate whether growing files should be logically decomposed into single-responsibility modules or reusable primitives.
  - [ ] Audit for dead code, unused assets, or duplicate routines.
  - [ ] Verify global synchronization across root `README.md`, all directory `README.md` files, `system_variables.md`, `system_functions.md`, `tasks.md`, `tracks.md`, and `tech-stack.md`.
  - [ ] Verify 100% test pass rate with Vitest, 0 warnings/errors with Oxlint, and clean production build.
