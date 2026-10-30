# Track 4 Implementation Plan: Visual Studio Shell, Node Graph & Preset Import/Export

## Overview
This plan implements the complete Studio workspace for Visualització in 5 test-driven phases, transitioning the application into an integrated visual synthesizer workstation.

---

## Phase 1: Dependencies, Layout & Studio Shell Framework

### Goals
- Install and configure `@xyflow/react` and `dagre` layout dependencies.
- Build the resizable split-view workspace container (viewport preview, node graph, and inspector).
- Implement Studio Mode vs. Live Performance Mode with auto-hiding controls.

### Tasks
- [x] **Task 1.1: Install `@xyflow/react` and `@types/dagre` / `dagre`**
  - Add `@xyflow/react` and `dagre` to `package.json`.
  - Import React Flow base stylesheets into `src/index.css` and style for cyberpunk theme.
  - *Verification:* `npm test` and `npm run build` verify clean compilation.
- [x] **Task 1.2: Build Resizable Split-View Container (`StudioSplitView`)**
  - Create `src/ui/studio/studio-split-view.tsx` with resizable dividers, min-width constraints, and double-click reset.
  - Persist split pane ratios in `localStorage`.
  - *Verification:* Write `src/ui/studio/studio-split-view.test.tsx` verifying divider drag and ratio persistence.
- [x] **Task 1.3: Implement Studio vs. Live Performance Mode**
  - Add `studioMode: 'editor' | 'live'` to `useAppStore`.
  - Implement fullscreen toggle (`F11` / maximize button) and 3-second mouse inactivity HUD auto-hide.
  - *Verification:* Write tests in `src/ui/studio/studio-mode.test.tsx` validating mode switching and timer dismissal.

---

## Phase 2: Visual Node Graph Pipeline (`@xyflow/react`)

### Goals
- Implement custom node components for all synthesizer passes with dark cyberpunk styling.
- Wire execution hierarchy and named buffer routes (`saveTo` $\to$ `loadFrom`) with cycle prevention.
- Implement automatic DAG hierarchical layout.

### Tasks
- [x] **Task 2.1: Custom Node Card Components**
  - Create `MasterFrameBufferNodeComponent`: permanent root anchor with crown badge and glowing boundary.
  - Create `FrameBufferNodeComponent`: feedback decay trails and blend mode indicators.
  - Create `StaticImageNodeComponent`: thumbnail preview, fit mode badge, and `@NAME` publish tag.
  - Create `TestVisualNodeComponent`: audio-reactive wireframe crystal preview node.
  - *Verification:* Write unit tests in `src/ui/graph/nodes/custom-nodes.test.tsx` verifying node rendering and badges.
- [x] **Task 2.2: Port Wiring & Connection Handles**
  - Add top/bottom execution handles (hierarchy flow) and left/right buffer routing handles (`saveTo` $\to$ `loadFrom`).
  - Implement real-time cycle detection and visual warning indicators when an edge would create a loop in `BufferPool`.
  - *Verification:* Write integration tests in `src/ui/graph/graph-edges.test.tsx` testing valid wiring and cycle prevention.
- [x] **Task 2.3: Automatic DAG Hierarchical Layout**
  - Implement `autoLayoutGraph()` utility using Dagre to organize nodes cleanly from top to bottom.
  - Add "Auto-Layout" button to the graph workspace toolbar.
  - *Verification:* Write unit tests in `src/ui/graph/layout/auto-layout.test.ts` verifying node positions and deterministic layout.
- [x] **Task 2.4: Graph State Synchronization with `RenderEngine`**
  - Synchronize React Flow nodes/edges with the `RenderEngine` node tree and `BufferPool` in real time.
  - *Verification:* Write integration tests in `src/ui/graph/graph-engine-sync.test.tsx` verifying engine node additions and removals.
- [x] **Task 2.5: Dedicated Layer Tree View (Outliner) & Fast Diagnostic Export**
  - Implement collapsible Outliner Tree view component as the dedicated bottom workspace pane (`WorkspacePane` + `LayerTreeView`).
  - Render execution sequence badges, container hierarchies, and layer controls (bypass, re-order, delete).
  - Support drag-and-drop layer reordering and reparenting with boundary clamping and descendant cycle prevention.
  - Implement inline label renaming on double-click (commit on Enter/blur, cancel on Escape).
  - Add quick expand/collapse all toggle that preserves Master Output visibility.
  - Add add-child layer dialog menu with outside-click and <kbd>Esc</kbd> dismissal.
  - Implement interactive semantic tag highlighting: hovering on any `@NAME` buffer tag illuminates all producers and consumers in matching neon glow.
  - Add fast "Copy JSON" diagnostic button to header and expose `window.__getGraphLayout` helper.
  - *Verification:* Unit tests in `src/ui/tree/layer-tree-view.test.tsx`.

---

## Phase 3: Universal `f(x)` Parameter Inspector, Modals & Viewport Toolbar Integration

### Goals
- Build the docked right-hand Inspector reflecting the selected graph node.
- Implement tactile fixed controls with seamless morphing to dynamic expression inputs (`f(x)`).
- Implement inline autocomplete on `$` and `#`, direct DOM 60 FPS readouts, and sparkline canvas.
- Add component preset selector with dirty-state confirmation guards.
- Implement portal-based modal dialog system escaping pane stacking contexts.
- Support static image file uploads with Base64 JSON encoding.
- Integrate floating playback toolbar within the viewport canvas with responsive auto-scaling.

### Tasks
- [x] **Task 3.1: Docked Parameter Inspector Shell**
  - Create `src/ui/inspector/parameter-inspector.tsx` displaying node header, component preset selector, single-column parameter rows, and parameter/option tooltips.
  - Remove redundant "Frame Buffer & Feedback" section from global preset settings.
  - *Verification:* Write tests in `src/ui/inspector/parameter-inspector.test.tsx` verifying node selection binding.
- [x] **Task 3.2: Universal Parameter Row (`ParameterRow`) with `f(x)` Mode Toggle**
  - Create `ParameterRow` supporting fixed controls (rotary knobs, range sliders, toggles, dropdowns) and `f(x)` formula toggle.
  - Preserve formula strings across f(x) window toggles and section collapses.
  - *Verification:* Write tests in `src/ui/inspector/parameter-row.test.tsx` verifying mode toggle and value persistence.
- [x] **Task 3.3: Inline Autocomplete & 60 FPS Sparkline Integration**
  - Integrate `ExpressionInput` with inline autocomplete dropdown triggering on `$` and `#`.
  - Mount `ExpressionSparkline` for live 180-frame telemetry and direct DOM numeric readouts.
  - *Verification:* Write tests in `src/ui/inspector/expression-autocomplete.test.tsx` verifying autocomplete keyboard navigation.
- [x] **Task 3.4: Component Preset Selector & Dirty-State Confirmation Modal**
  - Add component preset dropdown to inspector header with built-in templates.
  - Integrate dirty-state confirmation modal protecting modified components from accidental overwrite.
  - *Verification:* Write tests in `src/ui/inspector/component-preset-selector.test.tsx` verifying dirty-state detection and modal confirmation.
- [x] **Task 3.5: Portal Modal Dialog System (`BaseModalDialog`)**
  - Render all modal dialogs into `document.body` via React Portals (`createPortal`) to escape nested pane stacking contexts (`backdrop-filter`, `overflow: hidden`).
  - Elevate dialog window to `z-[9999]` and add full-viewport blurred backdrop overlay at `z-[9998]` with outside-click dismissal.
  - *Verification:* Write tests in `src/ui/dialogs/base-modal-dialog.test.tsx`.
- [x] **Task 3.6: Static Image File Upload & Base64 JSON Encoding**
  - Add file input picker and drag-and-drop image dropzone to `ParameterInspector` for `StaticImageNode`.
  - Encode uploaded images directly as Base64 data URLs into node data and serialized preset JSON with live thumbnails.
  - *Verification:* Write tests in `src/ui/inspector/parameter-inspector.test.tsx`.
- [x] **Task 3.7: Viewport Canvas Toolbar Integration & Responsive Auto-Scaling**
  - Relocate floating `Toolbar`, `FpsBadge`, and `AudioTelemetryOverlay` into the 3D playback viewport canvas.
  - Implement `ResizeObserver` responsive scale-to-fit (`transform: scale(...)`) on `Toolbar` to fit available horizontal space.
  - Add adaptive row shifting (`top-14`) when viewport is narrow (< 480px) and FPS badge is active.
  - *Verification:* Write tests in `src/ui/toolbar/toolbar.test.tsx`.

---

## Phase 4: 100-Step Undo / Redo Engine & Preset Serialization

### Goals
- Build a 100-step immutable JSON history engine with input coalescing.
- Implement standard preset JSON schema validation, file import/export, clipboard copy/paste, and drag-and-drop.

### Tasks
- [x] **Task 4.1: 100-Step Undo/Redo Engine with Input Coalescing**
  - Create `src/ui/history/undo-redo-manager.ts` maintaining a 100-snapshot history stack.
  - Implement input coalescing on pointer release (`onPointerUp`) and 500ms typing debounces.
  - Bind global keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y` / `Ctrl+Shift+Z`) and toolbar buttons.
  - *Verification:* Write unit tests in `src/ui/history/undo-redo-manager.test.ts` verifying coalescing and 100-step boundaries.
- [x] **Task 4.2: Preset JSON Schema & Serializer**
  - Define `PresetSchema` in `src/contracts/preset-schema.ts`.
  - Implement `serializePreset()` extracting preset metadata, node graph topology, and parameter states.
  - *Verification:* Write unit tests in `src/engine/presets/preset-serializer.test.ts` verifying JSON output schema.
- [x] **Task 4.3: Preset Deserializer & Import Handlers**
  - Implement `deserializePreset()` validating schema and reconstructing the node graph and engine pipeline.
  - Implement export via `.json` download and clipboard copy, and import via file input, clipboard paste, and drag-and-drop onto viewport.
  - Trigger automatic DAG layout upon preset load.
  - **Cleanup:** Remove temporary Phase 2/3 "Copy JSON" graph action bar button and `window.__getGraphLayout` helper once formal preset serializer/importer is active.
  - *Verification:* Write roundtrip tests in `src/engine/presets/preset-roundtrip.test.ts` (serialize $\to$ deserialize $\to$ render).

---

## Phase 5: End-to-End Integration, Documentation Sync & Track Protocol

### Goals
- Integrate all studio features into the main application shell.
- Perform comprehensive end-to-end testing, documentation updates, and pre-upload code review.

### Tasks
- [x] **Task 5.1: App-Level Integration & Smoke Testing**
  - Update `src/App.tsx` and `src/ui/toolbar/toolbar.tsx` with Studio Mode, Undo/Redo, and Preset Export/Import controls.
  - *Verification:* Run full test suite (`npm test`), `oxlint`, and `npm run build`.
- [x] **Task 5.2: Documentation & README Synchronization**
  - Update root `README.md`, `conductor/tracks.md`, `conductor/tasks.md`, and all newly created directory READMEs.
- [ ] **Task 5.3: Stateless Code Review & Track Completion Protocol**
  - Execute stateless code review subagent, address any findings, and prepare branch for merge to main.
