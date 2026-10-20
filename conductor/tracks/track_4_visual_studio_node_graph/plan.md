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
- [ ] **Task 2.1: Custom Node Card Components**
  - Create `MasterFrameBufferNodeComponent`: permanent root anchor with crown badge and glowing boundary.
  - Create `FrameBufferNodeComponent`: feedback decay trails and blend mode indicators.
  - Create `StaticImageNodeComponent`: thumbnail preview, fit mode badge, and `@NAME` publish tag.
  - Create `TestVisualNodeComponent`: audio-reactive wireframe crystal preview node.
  - *Verification:* Write unit tests in `src/ui/graph/nodes/custom-nodes.test.tsx` verifying node rendering and badges.
- [ ] **Task 2.2: Port Wiring & Connection Handles**
  - Add top/bottom execution handles (hierarchy flow) and left/right buffer routing handles (`saveTo` $\to$ `loadFrom`).
  - Implement real-time cycle detection and visual warning indicators when an edge would create a loop in `BufferPool`.
  - *Verification:* Write integration tests in `src/ui/graph/graph-edges.test.tsx` testing valid wiring and cycle prevention.
- [ ] **Task 2.3: Automatic DAG Hierarchical Layout**
  - Implement `autoLayoutGraph()` utility using Dagre to organize nodes cleanly from top to bottom.
  - Add "Auto-Layout" button to the graph workspace toolbar.
  - *Verification:* Write unit tests in `src/ui/graph/layout/auto-layout.test.ts` verifying node positions and deterministic layout.
- [ ] **Task 2.4: Graph State Synchronization with `RenderEngine`**
  - Synchronize React Flow nodes/edges with the `RenderEngine` node tree and `BufferPool` in real time.
  - *Verification:* Write integration tests in `src/ui/graph/graph-engine-sync.test.tsx` verifying engine node additions and removals.

---

## Phase 3: Universal `f(x)` Parameter Inspector & Autocomplete

### Goals
- Build the docked right-hand Inspector reflecting the selected graph node.
- Implement tactile fixed controls with seamless morphing to dynamic expression inputs (`f(x)`).
- Implement inline autocomplete on `$` and `#`, direct DOM 60 FPS readouts, and sparkline canvas.
- Add component preset selector with dirty-state confirmation guards.

### Tasks
- [ ] **Task 3.1: Docked Parameter Inspector Shell**
  - Create `src/ui/inspector/parameter-inspector.tsx` displaying node header, component preset selector, and parameter rows.
  - *Verification:* Write tests in `src/ui/inspector/parameter-inspector.test.tsx` verifying node selection binding.
- [ ] **Task 3.2: Universal Parameter Row (`ParameterRow`) with `f(x)` Mode Toggle**
  - Create `ParameterRow` supporting fixed controls (rotary knobs, range sliders, toggles, dropdowns) and `f(x)` formula toggle.
  - *Verification:* Write tests in `src/ui/inspector/parameter-row.test.tsx` verifying mode toggle and value persistence.
- [ ] **Task 3.3: Inline Autocomplete & 60 FPS Sparkline Integration**
  - Integrate `ExpressionInput` with inline autocomplete dropdown triggering on `$` and `#`.
  - Mount `ExpressionSparkline` for live 180-frame telemetry and direct DOM numeric readouts.
  - *Verification:* Write tests in `src/ui/inspector/expression-autocomplete.test.tsx` verifying autocomplete keyboard navigation.
- [ ] **Task 3.4: Component Preset Selector & Dirty-State Confirmation Modal**
  - Add component preset dropdown to inspector header with built-in templates.
  - Integrate dirty-state confirmation modal (`BaseModalDialog`) protecting modified components from accidental overwrite.
  - *Verification:* Write tests in `src/ui/inspector/component-preset-selector.test.tsx` verifying dirty-state detection and modal confirmation.

---

## Phase 4: 100-Step Undo / Redo Engine & Preset Serialization

### Goals
- Build a 100-step immutable JSON history engine with input coalescing.
- Implement standard preset JSON schema validation, file import/export, clipboard copy/paste, and drag-and-drop.

### Tasks
- [ ] **Task 4.1: 100-Step Undo/Redo Engine with Input Coalescing**
  - Create `src/ui/history/undo-redo-manager.ts` maintaining a 100-snapshot history stack.
  - Implement input coalescing on pointer release (`onPointerUp`) and 500ms typing debounces.
  - Bind global keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y` / `Ctrl+Shift+Z`) and toolbar buttons.
  - *Verification:* Write unit tests in `src/ui/history/undo-redo-manager.test.ts` verifying coalescing and 100-step boundaries.
- [ ] **Task 4.2: Preset JSON Schema & Serializer**
  - Define `PresetSchema` in `src/contracts/preset-schema.ts`.
  - Implement `serializePreset()` extracting preset metadata, node graph topology, and parameter states.
  - *Verification:* Write unit tests in `src/engine/presets/preset-serializer.test.ts` verifying JSON output schema.
- [ ] **Task 4.3: Preset Deserializer & Import Handlers**
  - Implement `deserializePreset()` validating schema and reconstructing the node graph and engine pipeline.
  - Implement export via `.json` download and clipboard copy, and import via file input, clipboard paste, and drag-and-drop onto viewport.
  - Trigger automatic DAG layout upon preset load.
  - *Verification:* Write roundtrip tests in `src/engine/presets/preset-roundtrip.test.ts` (serialize $\to$ deserialize $\to$ render).

---

## Phase 5: End-to-End Integration, Documentation Sync & Track Protocol

### Goals
- Integrate all studio features into the main application shell.
- Perform comprehensive end-to-end testing, documentation updates, and pre-upload code review.

### Tasks
- [ ] **Task 5.1: App-Level Integration & Smoke Testing**
  - Update `src/App.tsx` and `src/ui/toolbar/toolbar.tsx` with Studio Mode, Undo/Redo, and Preset Export/Import controls.
  - *Verification:* Run full test suite (`npm test`), `oxlint`, and `npm run build`.
- [ ] **Task 5.2: Documentation & README Synchronization**
  - Update root `README.md`, `conductor/tracks.md`, `conductor/tasks.md`, and all newly created directory READMEs.
- [ ] **Task 5.3: Stateless Code Review & Track Completion Protocol**
  - Execute stateless code review subagent, address any findings, and prepare branch for merge to main.
