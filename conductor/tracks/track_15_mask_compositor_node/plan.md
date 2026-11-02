# Implementation Plan: Track 15 — Mask Compositor Node (3-Way Buffer Reveal) (#18)

## Overview
Implement a lean, dedicated `MaskCompositorNode` (`type: "maskCompositor"`) that performs 1-pass 3-way texture compositing (`mix(Foreground, Background, Mask)`), integrate it into the Visualització layer tree and parameter inspector, and author the requested rainy ocean sunset preset.

---

## Phase 1: Contract, Shader & Core Node Implementation (TDD)

- [ ] Task 1.1: Schema contracts and validation for `maskCompositor` (#18)
  - [ ] Add `'maskCompositor'` to `NODE_TYPES` in `src/contracts/node-types.ts`
  - [ ] Define `MaskCompositorNodeData` in `src/ui/graph/node-data.ts` (`foregroundFrom`, `backgroundFrom`, `maskFrom`, `maskInvert`)
  - [ ] Update `validatePreset` in `src/contracts/preset-schema.ts` and write failing tests in `src/contracts/preset-schema.test.ts`
  - [ ] Verify unit tests pass
- [ ] Task 1.2: GLSL Mask Compositor Shader & Material (#18)
  - [ ] Write failing unit test in `src/engine/nodes/mask-compositor-shader.test.ts` testing shader construction, uniforms (`uForegroundTexture`, `uBackgroundTexture`, `uMaskTexture`, `uMaskInvert`), and software fallback calculation
  - [ ] Implement `createMaskCompositorMaterial()` and vertex/fragment shaders in `src/engine/nodes/mask-compositor-shader.ts`
  - [ ] Confirm tests pass
- [ ] Task 1.3: `MaskCompositorNode` implementation (#18)
  - [ ] Write failing unit test in `src/engine/nodes/mask-compositor-node.test.ts` testing node construction, parameter mutation, texture binding from `BufferPool`, and fallback behavior when textures are missing
  - [ ] Implement `MaskCompositorNode` in `src/engine/nodes/mask-compositor-node.ts` implementing `VisualNode`
  - [ ] Confirm all unit tests pass

---

## Phase 2: ViewportCanvas Synchronization & UI Shell (TDD)

- [ ] Task 2.1: ViewportCanvas runtime graph reconciliation (#18)
  - [ ] Write failing test in `src/engine/presets/preset-render-smoke.test.ts` or canvas integration tests asserting `maskCompositor` node instantiation
  - [ ] In `src/ui/canvas/viewport-canvas.tsx`, instantiate and reconcile `MaskCompositorNode` and parameter updates
  - [ ] Confirm tests pass
- [ ] Task 2.2: Layer Tree and Parameter Inspector integration (#18)
  - [ ] Add `maskCompositor` to `LayerTreeView` add-child menu in `src/ui/tree/layer-tree-view.tsx`
  - [ ] Add parameter inspector controls (`foregroundFrom`, `backgroundFrom`, `maskFrom`, `maskInvert`) in `src/ui/inspector/parameter-inspector.tsx`
  - [ ] Update `src/ui/inspector/schema-ui-parity.test.tsx` to verify all parameters render corresponding UI controls
  - [ ] Confirm UI parity tests pass

---

## Phase 3: Preset Authoring, Verification & Documentation Sync

- [ ] Task 3.1: Author `presets/rainy-ocean-sunset.json` and smoke tests (#18)
  - [ ] Create `presets/rainy-ocean-sunset.json` with base64 embedded sunset/water images, Duperscope audio-reactive raindrops with feedback decay, and `maskCompositor`
  - [ ] Validate schema and deserialization using `validatePreset()` and `deserializePreset()`
  - [ ] Add preset smoke test in `src/engine/presets/rainy-ocean-sunset.test.ts`
  - [ ] Confirm tests pass
- [ ] Task 3.2: Three-Tier verification gate and documentation sync (#18)
  - [ ] Update `conductor/tech-stack.md`, `src/engine/README.md`, and `src/engine/nodes/README.md`
  - [ ] Run Tier 1 (`npm run lint`, `npm run build`, `npm test`), Tier 2 (`preset-render-smoke.test.ts`), and Tier 3 (`npm run test:e2e`)
  - [ ] Update `conductor/tracks.md` and mark Track 15 complete
