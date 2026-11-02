# Track 12 Implementation Plan: Toolbar Preset Selector & Overwrite Confirmation Guard

This plan outlines the Test-Driven Development (TDD) tasks for adding a dynamic preset selector to the upper toolbar with a protective overwrite confirmation dialog on non-empty scenes.

---

## Phase 1: Dynamic Preset Discovery & Emptiness Detection Utilities (TDD)

- [x] **Task 1.1: Write failing tests for preset catalog & scene emptiness detection**
  - Create `src/ui/toolbar/preset-catalog.test.ts` testing dynamic preset discovery, parsing metadata names/descriptions, and handling empty/malformed cases.
  - Create/extend unit tests for `hasChildLayers(nodes)` verifying that a canvas with only `master-frame-buffer` is empty, while any additional child nodes mark it non-empty.
  - *Verification:* Run Vitest and confirm tests fail as expected (Red Phase).

- [x] **Task 1.2: Implement `preset-catalog.ts` and scene emptiness detection**
  - Implement `getAvailablePresets()` in `src/ui/toolbar/preset-catalog.ts` leveraging `import.meta.glob('/presets/*.json', { eager: true })` to dynamically extract all root presets without hardcoding.
  - Implement `hasChildLayers(graphNodes: Node[]): boolean` in `src/ui/toolbar/preset-selector-utils.ts` (or `component-preset-utils.ts`).
  - *Verification:* Run Vitest and confirm all Phase 1 tests pass (Green Phase).

---

## Phase 2: Preset Selector Component & Confirmation Dialog (TDD)

- [x] **Task 2.1: Write failing tests for Preset Selector & Confirmation Modal**
  - Create `src/ui/toolbar/preset-selector.test.tsx` verifying:
    - Rendering select dropdown with all dynamically discovered presets.
    - Selecting a preset on an empty canvas applies immediately without opening the dialog.
    - Selecting a preset on a non-empty canvas triggers the `BaseModalDialog` confirmation warning.
    - Dismissing/canceling leaves the canvas unchanged.
    - Confirming "Overwrite & Apply" invokes `loadPreset`, pushes an undo delta, and closes the modal.
  - *Verification:* Run Vitest and confirm tests fail (Red Phase).

- [x] **Task 2.2: Implement `PresetSelector` with `BaseModalDialog`**
  - Build `src/ui/toolbar/preset-selector.tsx` with glassmorphic styling, select dropdown, and confirmation dialog using `BaseModalDialog` with `role="dialog"` mounted via portal.
  - Display preset preview information (name, author, description) inside the confirmation modal.
  - *Verification:* Run component tests and confirm green.

- [x] **Task 2.3: Integrate `PresetSelector` into Toolbar**
  - Embed `<PresetSelector />` into `Toolbar` (`src/ui/toolbar/toolbar.tsx`).
  - Ensure dynamic scale calculations in `Toolbar` adapt cleanly to the new component.
  - *Verification:* Run `src/ui/toolbar/toolbar.test.tsx` and verify clean rendering.

- [x] **Task 2.4: Manual Verification Gate (Pause for User Testing)**
  - Pause implementation and invite the user to launch the dev server and test preset loading and confirmation dialogs interactively in the browser.

---

## Phase 3: Integration, Regression Verification & Documentation

- [x] **Task 3.1: Full Test Suite & TypeScript Verification**
  - Run full test suite: `npm run test -- --run`
  - Run static analysis: `npx oxlint src`
  - Run production build: `npm run build`
  - Ensure zero regressions across existing 389 tests and build output.

- [x] **Task 3.2: Documentation & Conductor Sync**
  - Update `src/ui/toolbar/README.md` detailing the dynamic preset catalog, selector UI, and overwrite confirmation guard.
  - Synchronize `conductor/tracks.md` and `conductor/tasks.md`.
