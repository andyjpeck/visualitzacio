# Implementation Plan: Track 15 — Editor & Performance Settings Section in Toolbar Menu (#15)

## Phase 1: Persistent Editor Preferences & Toolbar Settings Modal Section [checkpoint: fc1b270]
This phase adds `localStorage`-backed editor preferences (`showLayerComplexity` and `showDebugData`) to `useAppStore`, renders the new **Editor & Performance Settings** section in `PresetSettingsModal`, verifies preset JSON isolation, and validates Three-Tier quality gates.

- [x] Task 1.1: Write Failing Unit & Integration Tests (Red Phase) aef44de
  - [x] Expand `src/ui/store/app-store.test.ts` to assert `showLayerComplexity` (default `true`) and `showDebugData` (default `true`) initialize from and persist to `localStorage` (`STORAGE_KEY_SHOW_LAYER_COMPLEXITY` and `STORAGE_KEY_SHOW_DEBUG_DATA`), and that preset serialization/deserialization (`exportPresetJson` / `loadPreset`) does not include or overwrite these editor preferences.
  - [x] Expand `src/ui/settings/preset-settings-modal.test.tsx` to assert the **Editor & Performance Settings** section renders in `PresetSettingsModal`, exposes accessible controls (`data-testid="setting-layer-complexity-toggle"` and `data-testid="setting-debug-overlay-toggle"` with `aria-pressed`), and toggles `showLayerComplexity` and `showDebugData` in `useAppStore` and `localStorage`.
  - [x] Run tests and confirm they fail as expected (Red Phase).

- [x] Task 1.2: Implement Persistent Store State & Editor Settings UI (Green Phase) 29e6320
  - [x] Update `src/ui/store/app-store.ts` with `STORAGE_KEY_SHOW_LAYER_COMPLEXITY`, `STORAGE_KEY_SHOW_DEBUG_DATA`, `showLayerComplexity`, `setShowLayerComplexity`, `toggleLayerComplexity`, and `localStorage` persistence in `toggleDebugData` / `setShowDebugData`.
  - [x] Update `src/ui/settings/preset-settings-modal.tsx` to render the **Editor & Performance Settings** section with `On (Cost Estimates)` / `Off` and `Visible` / `Hidden` segmented toggle buttons, accessible `aria-pressed` states, and explanatory helper text indicating these preferences are saved locally in the browser rather than inside the preset file.
  - [x] Verify all unit and integration tests pass (Green Phase).

- [x] Task 1.3: Phase Verification, Documentation Sync & Checkpoint fc1b270
  - [x] Synchronize `src/ui/settings/README.md`, `src/ui/store/README.md`, and `conductor/product.md` / `conductor/tech-stack.md` with the new Editor & Performance Settings architecture.
  - [x] Execute Three-Tier Verification Gate (`npm run lint`, `npm run build`, `npm test`, `preset-render-smoke.test.ts`, and `npm run test:e2e`).
