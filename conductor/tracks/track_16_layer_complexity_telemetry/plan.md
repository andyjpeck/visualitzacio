# Implementation Plan: Track 16 — Computational Complexity Cost Indicators in Layers Tree (#16)

## Phase 1: Static Computational Complexity Model, Layer Badges & Hover Breakdown Tooltip
This phase implements the Tier 0 static complexity & anti-pattern lint calculator (`src/ui/telemetry/layer-complexity.ts`), integrates percentage cost badges (`{sharePercent}%`) and portaled hover breakdown tooltips into `LayerTreeView` (controlled by `showLayerComplexity`), and verifies all Three-Tier quality gates.

- [x] Task 1.1: Write Failing Unit & UI Integration Tests (Red Phase) 56bb662
  - [x] Create `src/ui/telemetry/layer-complexity.test.ts` to test `computeSceneLayerComplexity` across `masterFrameBuffer`, pass-through `frameBuffer`, multi-pass `feedback` `frameBuffer`, `duperscopeNode` (with varying `n` and per-point trigonometric/DSP expressions), `staticImage`, `testVisual`, `bypassed` layers, percentage share normalization (`sharePercent`, `subtreeSharePercent`), and anti-pattern lint warnings (downscaled `@TAG` consumer sampling, 0-opacity active layers, heavy per-point loops).
  - [x] Expand `src/ui/tree/layer-tree-view.test.tsx` to assert that percentage complexity badges (`data-testid="tree-cost-badge-<id>"`) render when `showLayerComplexity` is `true`, hide when `showLayerComplexity` is `false`, and display the portaled breakdown tooltip (`data-testid="tree-cost-tooltip-<id>"`) on mouse hover.
  - [x] Run tests and confirm they fail as expected (Red Phase).

- [~] Task 1.2: Implement Complexity Model & LayerTreeView Cost Indicators (Green Phase)
  - [ ] Create `src/ui/telemetry/layer-complexity.ts` implementing `computeSceneLayerComplexity(nodes, resolutionScale)` and `LayerComplexityMetrics`.
  - [ ] Update `src/ui/tree/layer-tree-view.tsx` to memoize `computeSceneLayerComplexity(graphNodes, resolutionScale)` when `showLayerComplexity` is `true`, render the color-graded `{sharePercent}%` badge on each layer row, and render the portaled breakdown tooltip (`createPortal(..., document.body)`, `z-[9999]`, `pointer-events-none`) on badge hover/focus.
  - [ ] Verify all unit and UI integration tests pass (Green Phase).

- [ ] Task 1.3: Phase Verification, Documentation Sync & Checkpoint
  - [ ] Create `src/ui/telemetry/README.md` and synchronize `src/ui/README.md`, `src/ui/tree/README.md`, and `conductor/tech-stack.md`.
  - [ ] Expand `tests/e2e/actionability-smoke.spec.ts` to verify layer complexity badges and the settings toggle in Chromium.
  - [ ] Execute Three-Tier Verification Gate (`npm run lint`, `npm run build`, `npm test`, `preset-render-smoke.test.ts`, and `npm run test:e2e`).
