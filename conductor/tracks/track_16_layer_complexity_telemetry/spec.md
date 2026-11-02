# Specification: Track 16 — Computational Complexity Cost Indicators in Layers Tree (#16)

## 1. Overview
Preset authors currently lack visibility into how much relative computational and GPU cost each layer contributes to a composition. Common non-performant patterns—such as multi-pass ping-pong feedback containers, un-scaled offscreen buffers, or high-point-count `Duperscope` scripts with expensive per-point AST expressions—are invisible until the overall frame rate drops.

This track implements a **Tier 0 Static Computational Complexity & Lint Model** (`src/ui/telemetry/layer-complexity.ts`) and renders a **Percentage of Total Preset Cost Badge** (e.g., `28%`) with color-graded severity and a portaled **Hover Breakdown Tooltip** on each row of `LayerTreeView` when `showLayerComplexity` is enabled in Editor & Performance Settings.

---

## 2. Functional Requirements

### FR-1: Tier 0 Static Computational Complexity & Anti-Pattern Lint Model (`src/ui/telemetry/layer-complexity.ts`)
- Implement `computeSceneLayerComplexity(nodes: Node[], resolutionScale?: number): Map<string, LayerComplexityMetrics>` that analyzes the scene graph (`graphNodes`) with **zero 60 FPS render-loop overhead** (recomputed only when `graphNodes` or `resolutionScale` changes in the UI Control Plane).
- For each node, compute:
  - **`selfScore: number`**: Direct computational cost estimate of the node itself (0 when `bypassed: true`):
    - **Master / Frame Buffer (`masterFrameBuffer`, `frameBuffer`):**
      - Pass-through replicator (`loadFrom` set, no children, no `feedback`, no `saveTo`, `inputBlendMode !== 'none'`): `1` full-screen composite pass, `0 MB` FBO VRAM (`selfScore = 12`).
      - Standard single-FBO buffer (no `feedback`, not pass-through): `1–2` full-screen passes, `~16.6 MB * resolutionScale^2` `HalfFloatType` FBO VRAM (`selfScore = 25`).
      - Multi-pass Ping-Pong Feedback buffer (`feedback: true` + children or `loadFrom`): `3–4` full-screen passes, `3` `HalfFloatType` FBOs (`fboA`, `fboB`, `childTarget`, `~49.8 MB * resolutionScale^2` VRAM) (`selfScore = 55`).
      - Dynamic `f(x)` expression-bound parameters add `+2` per active expression binding.
    - **Duperscope (`duperscopeNode`):**
      - Parse static `n = <number>` assignment from `initCode` / `frameCode` (defaulting to `200`, clamped to `[0, 4096]`).
      - Count statements in `frameCode`, `beatCode`, and `pointCode`, plus heavy transcendental/audio calls (`sin`, `cos`, `tan`, `pow`, `sqrt`, `#FFT`, `#WAVEFORM`) inside `pointCode`.
      - Base draw call + buffer streaming cost (`10`) + `(estimatedPoints * (1 + pointStatements * 0.8 + pointHeavyCalls * 1.2)) / 20`.
    - **Static Image (`staticImage`) / Crystal Synth (`testVisual`):**
      - Fixed lightweight draw pass cost (`selfScore = 8` for `staticImage`, `selfScore = 14` for `testVisual`), plus `+2` per active `f(x)` expression parameter.
  - **`subtreeScore: number`**: Sum of `selfScore` plus all descendant `selfScore`s (for container rollups when collapsed or inspecting a container's total footprint).
  - **`sharePercent: number`**: Integer percentage (`0%`–`100%`, `Math.round((selfScore / totalSceneScore) * 100)`) representing the node's direct share of the total active preset complexity (plus `subtreeSharePercent` for containers with children).
  - **`tier: 'bypassed' | 'low' | 'medium' | 'high' | 'heavy'`**: Color-grading tier derived from `sharePercent` and `selfScore` (`bypassed` when `bypassed: true` or `0%`, `low` `< 15%`, `medium` `15%–29%`, `high` `30%–49%`, `heavy` `>= 50%`).
  - **`fullScreenPasses: number`**, **`estimatedVramMb: number`**, and **`estimatedPointOps: number`**.
  - **`lintWarnings: string[]`**: Actionable optimization tips for preset authors when anti-patterns are detected:
    1. **Downscaled Buffer Sampling Anti-Pattern:** A `FrameBufferNode` renders at full size and publishes `saveTo: @TAG`, while all consumers of `@TAG` sample it at `scale <= 0.5` -> *"Tip: All consumers sample this buffer at ≤0.5x scale; reducing resolution scale saves fill-rate."*
    2. **Dormant / Zero-Opacity Layer Not Bypassed:** A layer has fixed `opacity === 0` (or `linesize = 0` in `frameCode`) without being bypassed -> *"Tip: Layer has 0 opacity/size; bypass the layer when unused to skip evaluation."*
    3. **Heavy Per-Point Trigonometric/DSP Loop:** A `Duperscope` has `n >= 256` and `>= 4` transcendental/DSP calls inside `pointCode` -> *"Tip: Precompute frame-invariant math in 'frame' instead of 'point' or reduce point count 'n'."*
    4. **Multi-Pass Feedback Container Overhead:** A `FrameBufferNode` has `feedback: true` with nested children -> *"Note: Ping-pong feedback with children uses 3 offscreen FBOs and 3–4 full-screen shader passes."*

### FR-2: Percentage Cost Badge & Portaled Hover Breakdown Tooltip in `LayerTreeView` (`src/ui/tree/layer-tree-view.tsx`)
- Read `showLayerComplexity` from `useAppStore`. When `showLayerComplexity` is `false`, hide the complexity badges in `LayerTreeView`.
- When `showLayerComplexity` is `true`, render a compact **Percentage Cost Badge** (`data-testid="tree-cost-badge-<node.id>"`) on each row showing `{sharePercent}%` (and a subtle warning dot/icon when `lintWarnings.length > 0`).
- Color-grade the badge border/text by `tier`:
  - `bypassed`: muted slate (`0%`)
  - `low`: emerald (`< 15%`)
  - `medium`: cyan (`15%–29%`)
  - `high`: amber (`30%–49%`)
  - `heavy`: rose/red (`>= 50%`)
- Hovering or focusing the badge renders a portaled (`createPortal(..., document.body)`, `z-[9999]`) **Complexity Breakdown Tooltip** (`data-testid="tree-cost-tooltip-<node.id>"`) displaying:
  - Direct Share (`{sharePercent}%` of preset cost) and Subtree Share (`{subtreeSharePercent}%` for containers with children)
  - Full-Screen Passes, Estimated VRAM (`MB`), and Point/AST Operations per frame
  - Any detected **Optimization Tips** (`lintWarnings`)

---

## 3. Non-Functional Requirements
- **Zero 60 FPS Render-Loop Impact:** Complexity calculation is memoized (`useMemo`) on `graphNodes` and `resolutionScale` inside the React UI Control Plane and never runs inside `RenderEngine.renderFrame()`.
- **Portal Stacking Compliance:** The hover breakdown tooltip renders via `createPortal` into `document.body` with `z-[9999]` and `pointer-events-none` so it is never clipped by the Layers panel scroll container and never intercepts clicks.

---

## 4. Acceptance Criteria
- [x] Every layer row in `LayerTreeView` displays a color-graded percentage complexity badge (`{sharePercent}%`) when `showLayerComplexity` is enabled.
- [x] Toggling **Layer Complexity Indicators** to `Off` in the toolbar Settings modal immediately hides the badges in `LayerTreeView`.
- [x] Hovering a complexity badge displays a portaled breakdown tooltip showing pass count, estimated VRAM, AST/point operations, and actionable optimization tips.
- [x] Unit tests and Playwright E2E tests verify the complexity calculator, badge rendering, tooltip breakdown, and settings toggle integration.
