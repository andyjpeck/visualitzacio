# Track Implementation Plan: Responsive Toolbar Overflow & Wrapping

## Phase 1: Test Suite & Reproduction of Toolbar Overflow (TDD Red Phase)
- [x] Task: Reproduce horizontal constraint overflow in unit & component tests
  - [x] Add Vitest tests for multi-row flex-wrapping and cluster containment down to 320px
  - [x] Add tests asserting right-side buttons (Undo, Redo, Debug Data, Settings, Studio Mode) remain within bounding container and have non-negative offset coordinates
  - [x] Verify test failures on existing toolbar implementation (Red phase)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Semantic Clustering & Responsive Flexbox Wrapping (Green Phase)
- [~] Task: Refactor Toolbar DOM into semantic clusters
  - [ ] Create cluster wrapper for Playback + Audio Sources
  - [ ] Create cluster wrapper for Track Scrubber + Preset Selector
  - [ ] Create cluster wrapper for Action Tools (Undo, Redo, Debug Data, Settings, Studio Mode)
  - [ ] Update toolbar container styling to support `flex-wrap`, right-aligned justification (`justify-end`), and dynamic row spacing
- [ ] Task: Refactor dynamic scale and width calculation
  - [ ] Measure unconstrained cluster widths / intrinsic scroll width rather than clamped offsetWidth
  - [ ] Enable smooth responsive wrapping with graceful scaling fallback at extreme narrow widths (< 360px)
  - [ ] Ensure all unit tests in Phase 1 pass (Green phase)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: E2E Actionability, Documentation & Quality Gates
- [ ] Task: High-Fidelity Verification with Playwright
  - [ ] Add E2E tests validating that all buttons are clickable and interactable in narrow split-view viewports (e.g. 360px and 400px preview width)
  - [ ] Run full test suite to guarantee zero regressions
- [ ] Task: Documentation & Directory README updates
  - [ ] Update `src/ui/toolbar/README.md` documenting responsive cluster layout and wrapping behavior
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
