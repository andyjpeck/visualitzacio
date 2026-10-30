# Track 5 Implementation Plan: Generative Visual Synthesis & Duperscope

## Overview
This plan implements **Duperscope** (`DuperscopeNode`) and its 4-phase multi-statement procedural script engine in 5 test-driven phases, completing Visualització's foundational component suite (`FrameBufferNode`, `StaticImageNode`, `DuperscopeNode`).

---

## Phase 1: Multi-Statement Script Compiler & 4-Phase Execution Engine [checkpoint: 0bb1833]

### Goals
- Build `DuperscopeCompiler` to parse, validate, and pre-compile multi-statement scripts (`init`, `beat`, `frame`, `point`) with comment stripping and read-only variable guards.
- Implement the 4-phase execution runner (`init` $\to$ `beat` $\to$ `frame` $\to$ `point`) with persistent user state, logarithmic spectrum sampling for `v`, and zero-allocation point-loop evaluation.

### Tasks
- [x] **Task 1.1: Comment Stripping, Statement Splitting & Read-Only Variable Guards (`DuperscopeCompiler`)** [28fe397]
  - Create `src/engine/nodes/duperscope-compiler.ts` implementing comment stripping (`//` and `/* ... */`) and statement splitting by `;` and newlines.
  - Enforce read-only variable rules: forbid assignment to `$VARIABLE`, constants (`PI`, `E`), `i`, and `v` in all phases, and forbid assignment to `n` inside the `point` phase.
  - Validate the right-hand expression of each statement using the sandboxed `expr-eval` parser and return detailed per-phase diagnostic errors.
  - *Verification:* Write unit tests in `src/engine/nodes/duperscope-compiler.test.ts` covering multi-statement blocks, comment stripping, read-only violations, syntax errors, and security sandboxing.
- [x] **Task 1.2: 4-Phase Execution Runner & Audio Sampling (`v` Shorthand)** [0bb1833]
  - Implement zero-allocation execution of compiled phase blocks (`init`, `beat`, `frame`, `point`) against a pre-allocated numeric `scope` dictionary.
  - Enforce `beat`-before-`frame` execution order when `context.$BEAT === 1.0`.
  - Implement per-point reset semantics (`i`, `v`, `x = (i * 2.0) - 1.0`, `y = 0.0`, `skip = 0.0`) and persistence of `r, g, b, a, linesize` and user variables.
  - Implement `sampleDuperscopeAudio(i, audioMode, channel, context)` with time-domain waveform sampling (`[-1, 1]`) and logarithmic frequency spectrum mapping (`20 Hz` to `20,000 Hz`, `[0, 1]`).
  - *Verification:* Add unit tests in `src/engine/nodes/duperscope-compiler.test.ts` verifying `init` $\to$ `beat` $\to$ `frame` $\to$ `point` execution order, variable persistence, `n` clamping (`[1, 4096]`), and waveform/logarithmic spectrum `v` sampling.

---

## Phase 2: WebGL Duperscope Node (`DuperscopeNode`) & Custom Shaders [checkpoint: da6c4f8]

### Goals
- Implement `DuperscopeNode` conforming to the `VisualNode` contract with always-on 1:1 square aspect projection.
- Implement pre-allocated **Instanced Screen-Space Quad Ribbon** rendering for `'lines'` and `'lineLoop'` draw modes (supporting `linesize` from `1px` to `128px` and per-vertex RGBA gradients) and custom circular particle shader rendering for `'points'` mode.

### Tasks
- [x] **Task 2.1: Custom GLSL Shaders for Instanced Quad Ribbons & Circular Points** [257ad54]
  - Create `src/engine/nodes/duperscope-shaders.ts` defining:
    1. Screen-space quad ribbon vertex/fragment shader for `'lines'` and `'lineLoop'`, expanding each segment $[P_k, P_{k+1}]$ along its 2D perpendicular normal by `linesize * 0.5` pixels with 1:1 aspect projection (`x / $ASPECT`) and `skip` discard.
    2. Anti-aliased circular particle vertex/fragment shader for `'points'` mode with per-point `gl_PointSize = aSize * uPixelRatio` and 1:1 aspect projection.
  - *Verification:* Write unit tests in `src/engine/nodes/duperscope-shaders.test.ts` verifying shader material construction, uniform defaults, and attribute bindings.
- [x] **Task 2.2: `DuperscopeNode` Lifecycle, Buffer Pre-Allocation & Blank-on-Error State** [da6c4f8]
  - Create `src/engine/nodes/duperscope-node.ts` implementing `VisualNode` (`init`, `resize`, `update`, `dispose`).
  - Pre-allocate `Float32Array` buffers for up to `4096` points/segments with zero per-frame memory allocations.
  - Support dynamic switching between `'lines'`, `'lineLoop'`, and `'points'`, modulatable node `opacity` (`DynamicParam`), and `bypassed` state.
  - Ensure any syntax or compilation error in `initCode`, `beatCode`, `frameCode`, or `pointCode` puts the node in an error state that outputs a blank frame (0 rendered vertices/instances) until resolved.
  - *Verification:* Write unit tests in `src/engine/nodes/duperscope-node.test.ts` testing all 3 draw modes, 1:1 aspect ratio scaling, `beat`-before-`frame` state updates, blank output on script error, and GPU resource disposal.

---

## Phase 3: Built-in Templates, Preset Schema v2 & Store Synchronization

### Goals
- Create the built-in Duperscope template library (*Oscilloscope Tunnel*, *Frequency Spectrum Ribbon*, *Reactive Lissajous Figure*, *Single Audio-Reactive Beat Particle*).
- Integrate `duperscopeNode` into `node-data.ts`, `useAppStore`, `UndoRedoManager`, Preset Schema v2 serializer/deserializer, and `ViewportCanvas`.

### Tasks
- [x] **Task 3.1: Built-in Duperscope Template Catalog**
  - Create `src/engine/nodes/duperscope-templates.ts` with the 4 classic generative templates and default Duperscope node parameters.
  - Update `src/ui/inspector/component-preset-utils.ts` (`isNodeDirty`) to detect modified parameters or script blocks on `duperscopeNode`.
  - *Verification:* Write unit tests in `src/engine/nodes/duperscope-templates.test.ts` verifying that all built-in templates compile cleanly and evaluate without error.
- [x] **Task 3.2: Store, Preset Schema v2 & ViewportCanvas Reconciliation**
  - Add `DuperscopeNodeData` to `src/ui/graph/node-data.ts`.
  - Update `useAppStore` (`addLayerNode` / `applyDuperscopeTemplate`), `preset-serializer.ts`, `preset-deserializer.ts`, and `ViewportCanvas.tsx` to instantiate, update, serialize, and dispose `DuperscopeNode` instances.
  - *Verification:* Write unit and roundtrip tests in `src/engine/presets/preset-roundtrip.test.ts` and `src/ui/store/app-store.test.ts` verifying `duperscopeNode` creation, template application, undo/redo deltas, and JSON v2 roundtrip fidelity.

---

## Phase 4: Studio Inspector 4-Phase Code Editor, Autocomplete & Outliner UI

### Goals
- Add `+ Duperscope` layer creation to the Layers Outliner (`LayerTreeView`).
- Build the Duperscope section in `ParameterInspector` with the Component Preset Selector, audio/draw mode dropdowns, `opacity` `f(x)` row, and 4-phase script editors (`init`, `beat`, `frame`, `point`) featuring local variable autocomplete and inline error diagnostics.

### Tasks
- [x] **Task 4.1: Outliner Layer Creation & Duperscope Icon Badge**
  - Update `LayerTreeView.tsx` to include **"+ Duperscope"** in the Add Layer menu and render a dedicated scope icon badge for `duperscopeNode` items.
  - *Verification:* Update `src/ui/tree/layer-tree-view.test.tsx` to verify adding, renaming, reordering, and deleting a Duperscope layer.
- [ ] **Task 4.2: Duperscope Inspector Controls, 4-Phase Script Editor & Autocomplete**
  - Extend `expression-catalog.ts` / `ExpressionAutocomplete` to offer Duperscope local scope completions (`n`, `i`, `v`, `x`, `y`, `r`, `g`, `b`, `a`, `linesize`, `skip`) when editing Duperscope phase scripts.
  - Update `ParameterInspector.tsx` to render the Duperscope template selector (with `BaseModalDialog` dirty-state overwrite guard), `audioMode`, `channel`, `drawMode`, `opacity`, and the 4 script editors (`init`, `beat`, `frame`, `point`) with per-block validation badges and 500ms debounced undo coalescing.
  - *Verification:* Write tests in `src/ui/inspector/duperscope-inspector.test.tsx` verifying script editing, inline syntax error banners, autocomplete suggestions, and template overwrite confirmation.

---

## Phase 5: End-to-End Integration, Documentation Sync & Track Completion Protocol

### Goals
- Verify end-to-end generative visual synthesis across all Duperscope templates and Frame Buffer feedback pipelines.
- Synchronize all repository documentation and execute the mandatory stateless code review protocol.

### Tasks
- [ ] **Task 5.1: End-to-End Verification & Quality Gates**
  - Run full test suite (`npm test`), linter (`npx oxlint`), and production build (`npm run build`).
- [ ] **Task 5.2: Documentation & README Synchronization**
  - Update root `README.md`, `conductor/tracks.md`, `conductor/tasks.md`, `src/engine/nodes/README.md`, and `src/ui/inspector/README.md`.
- [ ] **Task 5.3: Stateless Code Review & Track Completion Protocol**
  - Execute stateless code review subagent, address any findings, run `pre-upload-checks`, and prepare branch for merge to `main`.
