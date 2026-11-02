# Specification: Track 14 — Engine Performance: Render Pass, VRAM & Bandwidth Optimizations (#14)

## 1. Overview
Visualització experiences frame drops (<60 FPS) when fullscreened on multi-container and procedural presets such as `quadrant-mirrored-spectrum`. A full pipeline audit identified five primary bottlenecks across GPU fill-rate, VRAM allocation, frame pacing, PCIe buffer uploads, and dormant CPU point loops:
1. Main display canvas initialized with `antialias: true` (4x MSAA) and default `depth: true`, despite only rendering a single 2D composite quad.
2. Offscreen `FrameBufferNode` targets unconditionally allocating 24-bit depth buffers (`depthBuffer: true`), issuing redundant `clearDepth()` calls between 2D siblings, and eagerly allocating full-screen `HalfFloatType` FBOs even on direct pass-through replicator nodes (`loadFrom` with no children, no feedback, and no `saveTo`).
3. `RenderEngine.renderFrame()` updating `this.lastTimestamp = timestamp` prior to the target FPS pacing check, causing high-refresh displays (>80 Hz) to drop frames or stall.
4. `DuperscopeNode` configuring dynamic vertex/instance attributes with static draw usage and uploading all 4,096 segments/points on every frame regardless of active `pointCount`.
5. `DuperscopeRunner` clamping `n` to `[1, 4096]` and executing the per-vertex `point` AST loop and WebGL draw call even when the node's visual output is completely dormant/transparent (e.g., `n <= 0`, node `opacity <= 0`, or frame-end `linesize <= 0` / `a <= 0.001` without per-point override).

## 2. Functional Requirements

### FR-1: Main Canvas WebGLRenderer Initialization (`RenderEngine`)
- Initialize the default `THREE.WebGLRenderer` with `{ canvas, antialias: false, depth: false, stencil: false, alpha: false, powerPreference: 'high-performance' }`.
- Support an optional `rendererFactory?: (params: THREE.WebGLRendererParameters) => RendererLike` in `RenderEngineOptions` so unit tests can inspect renderer construction parameters deterministically.

### FR-2: FrameBufferNode Depth Stripping & Conditional Pass-Through FBO Allocation
- Add `depthBuffer?: boolean` to `FrameBufferNodeOptions` (defaulting to `false`).
- Configure `THREE.WebGLRenderTarget` allocations in `FrameBufferNode` with `depthBuffer: this.depthBuffer`.
- Only invoke `this.renderer.clearDepth()` between sibling child nodes during `update()` when `this.depthBuffer === true`.
- In `allocateRenderTargets()`, if the node is in direct pass-through mode (`!this.feedback && this.children.length === 0 && Boolean(this.loadFrom) && this.inputBlendMode !== 'none' && !this.saveTo`), skip allocating `fboA` (and dispose any existing FBOs).
- If a pass-through `FrameBufferNode` later transitions out of pass-through mode (via `addChild()`, `setFeedback(true)`, `setSaveTo()`, `setLoadFrom(null)`, or `setInputBlendMode('none')`), allocate its render target(s) on-demand using its current dimensions.

### FR-3: Accumulator-Based High-Refresh Frame Pacing (`RenderEngine`)
- In `RenderEngine.renderFrame(timestamp)`, compute `rawElapsedMs = timestamp - this.lastTimestamp` and `targetIntervalMs = 1000.0 / this.presetSettings.target_fps`.
- If `this.frameContext.$FRAME > 0 && rawElapsedMs > 0 && rawElapsedMs < targetIntervalMs - 1.0`, return early **without** mutating `this.lastTimestamp`.
- When a frame executes, advance `this.lastTimestamp` with remainder carry-over (`timestamp - (rawElapsedMs % targetIntervalMs)` when `rawElapsedMs >= targetIntervalMs && rawElapsedMs < targetIntervalMs * 2`, or `timestamp` otherwise) so 60 FPS paces evenly on both 60 Hz, 120 Hz, 144 Hz, and 240 Hz monitors without stalling or burst-jumping after tab backgrounding.

### FR-4: Duperscope Dynamic Draw Usage & Partial Buffer Upload Ranges
- Set `.setUsage(THREE.DynamicDrawUsage)` on all 6 instanced ribbon attributes (`instanceStart`, `instanceEnd`, `instanceStartColor`, `instanceEndColor`, `instanceStartSize`, `instanceEndSize`) in `createRibbonQuadGeometry()` and all 3 point attributes (`position`, `color`, `aSize`) in `DuperscopeNode`.
- In `DuperscopeNode.update()`, call `attr.clearUpdateRanges()` and `attr.addUpdateRange(0, activeCount * attr.itemSize)` before `attr.needsUpdate = true`.
- When `activeCount === 0` (0 segments in ribbon modes or 0 points in points mode), do not mark attributes `needsUpdate = true` and skip `this.renderer.render(this.scene, this.camera)`.

### FR-5: Duperscope Dormant / Zero-Output Point Loop Bypass
- Clamp `n` in `DuperscopeRunner.runFrame()` to `[0, 4096]` instead of `[1, 4096]`.
- After evaluating the `beat` and `frame` lifecycle phases in `DuperscopeRunner.runFrame()` (ensuring all stateful frame variables like `avgRms`, `prevSurge`, and `strike` update every frame), short-circuit the `point` loop and return `{ pointCount: 0 }` if:
  - `pointCount === 0` (`n <= 0`),
  - `options.skipPoints === true` (e.g., when `DuperscopeNode` evaluated `currentOpacity <= 0.001`),
  - `this.scope.a <= 0.001` and no statement in `compiledPoint` assigns to `a` (`target === 'a'`), OR
  - `this.scope.linesize <= 0.0` and no statement in `compiledPoint` assigns to `linesize` (`target === 'linesize'`).

## 3. Non-Functional Requirements
- **Zero-Allocation Hot Path:** No per-frame heap allocations (`new Array`, `Set`, or object literals in the point loop) introduced in `RenderEngine`, `FrameBufferNode`, `DuperscopeRunner`, or `DuperscopeNode`.
- **Backwards Compatibility:** Existing presets and built-in templates must render with identical visual output and zero WebGL errors.

## 4. Acceptance Criteria
- [x] `RenderEngine` initializes `THREE.WebGLRenderer` with `antialias: false, depth: false, stencil: false`.
- [x] `FrameBufferNode` defaults to `depthBuffer: false`, skips `clearDepth()` unless `depthBuffer: true`, and avoids allocating FBOs for direct pass-through nodes.
- [x] `RenderEngine` paces 60 FPS accurately across simulated 60 Hz, 120 Hz, and 144 Hz `requestAnimationFrame` streams without stalling.
- [x] `DuperscopeNode` uses `THREE.DynamicDrawUsage` and `addUpdateRange(0, activeCount * itemSize)` for all dynamic attributes, and skips `renderer.render()` when active count is 0.
- [x] `DuperscopeRunner` supports `n = 0` and automatically bypasses the `point` loop when dormant (including `myline-lightning` and `myline-lightning-secondary` in `quadrant-mirrored-spectrum` when `strike <= 0.001`), while preserving `beat` and `frame` state progression.
- [x] All unit, smoke, and E2E tests pass (Three-Tier Verification Gate).

## 5. Out of Scope
- Toolbar Editor & Performance Settings UI menu (tracked separately in Issue #15).
- Layers panel computational complexity cost indicators (tracked separately in Issue #16).
