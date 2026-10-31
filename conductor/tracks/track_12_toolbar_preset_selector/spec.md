# Track 12 Specification: Toolbar Preset Selector & Overwrite Confirmation Guard

## Context & Vision
Visualització has started introducing generative presets stored as standalone JSON files in the root `presets/` directory (e.g. `mirrored-t-spectrum.json`, `quadrant-mirrored-spectrum.json`, `quadrant-spectrum-frame.json`). To provide casual listeners and live performers with immediate, one-click access to these presets without manually editing URL query parameters or dragging files into the window, this track adds a dedicated **Preset Selector** in the upper floating toolbar (`Toolbar`).

To prevent accidental data loss when a user has active work on their canvas, the selector features a protective **Overwrite Confirmation Dialog** whenever attempting to load a preset over any non-empty scene (defined as having 1 or more child layers under `Master Output`).

---

## Functional Requirements

### FR-1: Dynamic Preset Discovery & Catalog
- **Zero Hardcoding Policy:**
  - Presets must NOT be hardcoded in a static array.
  - Dynamically discover and catalog presets from `presets/*.json` using Vite's glob import (`import.meta.glob('/presets/*.json', { eager: true })` or relative equivalent).
  - Extract preset id/slug (e.g. `quadrant-mirrored-spectrum`), metadata name, description, author, and schema version directly from the parsed JSON objects.
  - Automatically reflect any new preset added to the `presets/` folder without requiring code updates.

### FR-2: Toolbar Preset Selector UI
- **Placement & Styling:**
  - Integrated into the upper floating glassmorphic `Toolbar` (`src/ui/toolbar/toolbar.tsx`), situated alongside audio controls and settings.
  - Follows existing cyberpunk/glassmorphic visual styling with clean dropdown styling, truncation for long names, and accessible aria attributes.
  - Displays the currently active preset name (or "Select Preset..." placeholder when unselected or modified).
- **Selection Handling:**
  - Selecting a preset initiates the load process for the chosen preset object.
  - If the scene is currently empty (only `master-frame-buffer` exists with zero child layers), the preset is applied immediately via `loadPreset`.
  - If the scene is non-empty (contains 1 or more child layers under `master-frame-buffer`), the load is intercepted and staged as a pending preset load, opening the Overwrite Confirmation Modal.

### FR-3: Non-Empty Scene Detection & Overwrite Confirmation Modal
- **Non-Empty Condition:**
  - Evaluated using a helper `hasChildLayers(graphNodes: Node[]): boolean` which returns `true` if any node in `graphNodes` is not `'master-frame-buffer'` (i.e. child count > 0).
- **Confirmation Dialog (`BaseModalDialog`):**
  - Built with `BaseModalDialog`, maintaining full compliance with the dialog architecture rules (mounted via React portal with `role="dialog"`).
  - Dialog details:
    - Title: "Overwrite Active Scene?" with amber warning icon.
    - Body: Informs the user that the current visual canvas has active layers that will be replaced.
    - Preview card: Displays target preset name, author, and description.
    - Actions:
      - **Keep Current (Cancel):** Dismisses modal, keeps current canvas untouched, resets dropdown to active state.
      - **Overwrite & Apply (Confirm):** Records full snapshot to the 100-step Undo stack (`Ctrl+Z`), calls `loadPreset(preset)`, updates active preset state, and closes modal.

---

## Non-Functional Requirements
- **Strict Plane Isolation & Two-Plane Performance:**
  - Toolbar preset selector interactions occur strictly on the React UI plane (< 10 Hz) and never mutate or allocate within the 60 FPS WebGL render loop.
- **Architectural & Portal Compliance:**
  - All modals must adhere to `dialog-architecture.test.ts` (wrapped in `BaseModalDialog` or mounted via portal to `document.body` with `fixed z-[9999]`).
- **Comprehensive Undo/Redo Integration:**
  - Overwriting an active preset pushes a recoverable undo snapshot so users can immediately hit `Ctrl+Z` to restore their previous scene.

---

## Acceptance Criteria
1. **Dynamic Discovery:** Toolbar preset selector automatically discovers and displays all presets residing in `presets/*.json`.
2. **Clean Slate Immediate Load:** When canvas has only `master-frame-buffer` and zero child layers, choosing a preset applies it instantly with zero prompts.
3. **Protected Overwrite Confirmation:** When canvas has 1 or more child layers, choosing a preset opens the confirmation modal with preset details.
4. **Cancellation Safety:** Clicking "Keep Current" or pressing Escape cancels the operation without modifying canvas state or undo history.
5. **Confirmation Execution:** Clicking "Overwrite & Apply" loads the preset, updates the store, and enables `Ctrl+Z` to revert.
6. **Automated Test Coverage:**
   - Unit tests for dynamic preset registry & `hasChildLayers` utility.
   - Component tests for Toolbar preset selector rendering, empty-scene direct load, modal trigger on non-empty scene, cancel, and confirm flows.
   - Architecture test pass (`npm run test -- --run`) and TypeScript build verification (`npm run build`).

---

## Out of Scope
- Local preset creation/authoring UI in the toolbar (handled in track 9 / inspector export).
- Cloud community preset sharing or user authentication.
