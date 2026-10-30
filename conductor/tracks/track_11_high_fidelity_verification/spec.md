# Track 11 Specification: High-Fidelity Verification Overhaul

## 1. Overview & Objectives

Track 11 establishes a hardened, multi-tier verification infrastructure to eliminate the "Green Test Mirage"—a failure mode where isolated unit tests pass in JSDOM while real WebGL graphics and UI stacking fail silently in production.

## 2. Requirements & Standards

### FR-1: Universal Top-Layer Dialog Portaling
- All floating UI elements (`BaseModalDialog`, menus, dropdowns, and confirmation modals) must mount directly to `document.body` or `#modal-root` via React `createPortal`.
- Floating dialogs must have explicit top-tier z-index tokens (`z-[9999]` for dialogs, `z-[9998]` for backdrops) and calculate fixed boundary positions if triggered from nested containers.
- Monitored continuously via the AST architectural scanner test (`src/ui/dialogs/dialog-architecture.test.ts`).

### FR-2: WebGL Pipeline & Preset Integration Smoke Testing
- The pipeline smoke test (`src/engine/presets/preset-render-smoke.test.ts`) dynamically iterates over `LAYER_NODE_TYPES` in `src/contracts/node-types.ts`.
- Every registered node must have a valid preset fixture and prove that `node.update(context)` executes without GPU or shader compilation errors and invokes `renderer.render()`.
- Screen-space ribbons and 2D particle geometry must disable frustum culling (`frustumCulled = false`) so camera math never discards them.

### FR-3: Real Chromium E2E Actionability (Playwright)
- Automated Playwright suite (`tests/e2e/actionability-smoke.spec.ts`) running on dedicated Conductor worktree port `42009`.
- Verifies true pointer actionability (preventing canvas or sibling panels from intercepting clicks).
- Asserts zero unhandled browser console errors or WebGL shader warnings.

### FR-4: Three-Tier Conductor Quality Gates
- Updated `conductor/workflow.md` and `conductor/product-guidelines.md` mandating that all future tracks pass:
  1. Tier 1: Unit & Static (`npm run lint`, `npm test`, `npm run build`)
  2. Tier 2: WebGL Pipeline Smoke (`src/engine/presets/preset-render-smoke.test.ts`)
  3. Tier 3: Real Browser & Actionability (`npm run test:e2e` via Playwright)
