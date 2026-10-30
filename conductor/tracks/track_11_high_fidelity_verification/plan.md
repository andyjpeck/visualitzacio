# Track 11 Implementation Plan: High-Fidelity Verification Overhaul

## Phase 1: Modal Stacking, Portal Guarantees & Z-Index Guardrails
- [x] **Task 1.1: Audit & Refactor Floating UI Elements to Portals**
  - Verify `BaseModalDialog` and Outliner Add-Child dropdown menu (`layer-tree-view.tsx`) render via `createPortal` with top-tier z-index (`z-[9999]`) and pointer-event isolation so canvases and sidebars never occlude them.
  - Add test asserting all modals/dialogs render into `document.body` or dedicated portal root.
- [x] **Task 1.2: Modal Actionability Unit Test Suite**
  - Add unit test in `src/ui/dialogs/base-modal-dialog.test.tsx` verifying that `BaseModalDialog` mounts at the root level (`document.body`) and has `z-[9999]` and `z-[9998]`.

## Phase 2: WebGL Pipeline & Preset Integration Smoke Tests
- [x] **Task 2.1: Preset Deserialization & Scene Wiring Smoke Tests**
  - Implement `src/engine/presets/preset-render-smoke.test.ts` verifying that every node type (`duperscopeNode`, `frameBuffer`, `testVisual`) correctly deserializes from preset JSON, creates its render pass, and runs `update(context)` without GPU/shader compilation errors.
- [x] **Task 2.2: Non-Empty Geometry & Shader Validation Assertions**
  - Verify that `DuperscopeNode` with all built-in templates produces non-zero vertex counts, binds valid shaders, and executes with 0 GL errors and frustum culling disabled.

## Phase 3: Playwright Real-Browser E2E Suite
- [x] **Task 3.1: Install & Configure Playwright**
  - Add `@playwright/test` to `devDependencies`, add `playwright.config.ts` (using isolated port 42009 for worktrees), and define `test:e2e` npm script.
- [x] **Task 3.2: E2E Smoke Tests for UI Actionability & Canvas Rendering**
  - Create `tests/e2e/actionability-smoke.spec.ts`:
    - Launch Vite in Chromium on isolated port.
    - Check for 0 console errors or WebGL shader warnings.
    - Open Add Layer menu, click Duperscope, open template selector dialog, and confirm modal is clickable (not obscured by canvas).

## Phase 4: Conductor 3-Tier Verification Gates & Protocol Sync
- [x] **Task 4.1: Update Conductor Guidelines & Workflow**
  - Update `conductor/workflow.md`, `conductor/product-guidelines.md`, and `conductor/tracks.md`.
  - Document the 3-tier verification gate and mandatory Chrome DevTools MCP visual inspection checklist.
- [x] **Task 4.2: Final Quality Gates & Verification**
  - Run `npm test`, `npm run test:e2e`, `npx oxlint`, and `npm run build`.
