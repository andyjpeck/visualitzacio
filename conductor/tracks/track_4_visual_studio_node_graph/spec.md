# Track 4 Specification: Visual Studio Shell, Node Graph & Preset Import/Export

## Context & Vision
Track 4 unifies the rendering primitives (Two-Plane RenderEngine, ExpressionEngine, FrameBufferNode, Ping-Pong Feedback, StaticImageNode, BufferPool) into a cohesive, interactive visual synthesis workstation. It delivers the split-view Studio workspace, an interactive visual node graph built on `@xyflow/react`, a universal docked `f(x)` parameter inspector, a 100-step undo/redo engine with input coalescing, and a portable JSON preset import/export pipeline.

---

## Functional Requirements

### FR-1: Split-View Studio Workspace & Mode Switching
- **Dual Operating Modes:**
  1. **Studio / Editor Mode (Default):**
     - Left pane: Live visualizer viewport preview canvas with overlay FPS badge, transport bar, and telemetry meters.
     - Center pane: Interactive visual node graph workspace (`@xyflow/react`).
     - Right pane: Docked component parameter inspector.
     - Resizable splitters with minimum width constraints (preview min 320px, node graph min 400px, inspector min 300px) and double-click to reset layout.
  2. **Live Performance Mode:**
     - Fullscreen borderless canvas (via `F11` or toolbar maximize button).
     - Auto-hiding HUD controls on 3 seconds of mouse inactivity, reappearing instantly on mouse motion.
     - Hides node graph and inspector panes to ensure zero GPU/CPU distraction during live performances.
- **Persistent Preferences:**
  - Workspace pane split ratios and active mode persisted in `localStorage`.

### FR-2: Interactive Visual Node Graph (`@xyflow/react`)
- **Integration:** Powered by `@xyflow/react` (React Flow) customized with Visualització's dark cyberpunk aesthetic.
- **Custom Node Types:**
  1. `MasterFrameBufferNode`:
     - Permanent root container anchoring the render pipeline.
     - Distinctive golden crown icon badge, glowing cyan/purple border, and un-deletable status.
  2. `FrameBufferNode`:
     - Offscreen multi-pass buffer with ping-pong feedback indicators, blend mode badge, and feedback transform chips.
  3. `StaticImageNode`:
     - Image layer node displaying thumbnail preview, aspect fit mode badge (`cover`/`contain`/`stretch`), and `@NAME` publish tag.
  4. `TestVisualNode` (and extensible for future generative synthesis nodes):
     - Procedural audio-reactive wireframe crystal preview node.
- **Port Wiring & Connection Handles:**
  - **Hierarchy Execution Ports (Top/Bottom):** Chaining execution flow and nested child container relationships.
  - **Buffer Routing Ports (Left/Right):** Visual dataflow connections from `saveTo` `@NAME` output ports to `loadFrom` `@NAME` input ports.
  - Cycle detection feedback: Invalid circular connections are prevented in real time with visual warning indicators.
- **Automatic DAG Layout:**
  - Node graph automatically calculates clean, non-overlapping hierarchical layout upon preset loading or when clicking the "Auto-Layout" toolbar button.
  - Presets serialize topological relationships without hardcoded canvas pixel coordinates.

### FR-3: Universal `f(x)` Parameter Inspector
- **Docked Inspector Architecture:**
  - Selecting any node in the graph populates the docked right-hand inspector panel with that component's settings and modulatable parameters.
- **Tactile Fixed Mode vs. Dynamic Expression Mode (`f(x)`):**
  - Every modulatable parameter row features an `f(x)` toggle button.
  - **Fixed Mode (`"mode": "fixed"`):** Standard tactile controls (rotary knobs, range sliders, toggles, dropdowns) tailored to the parameter type.
  - **Expression Mode (`"mode": "expression"`):**
    - Clicking `f(x)` morphs the row into the mathematical formula input.
    - Inline autocomplete dropdown triggering automatically on `$` (variables) and `#` (functions) with full keyboard navigation and inline documentation tooltips.
    - Strict syntax validation on every keystroke (`Syntax Valid` check or explicit error diagnostics).
    - **Zero-Allocation 60 FPS Telemetry:** Real-time numerical readout updating directly via DOM element refs.
    - **Sliding-Window Sparkline Canvas:** 180-frame sliding window (~3 seconds of real-time history) rendered on an offscreen/direct canvas with cyan stroke, gradient fill, and dynamic min/max scaling.

### FR-4: Component Preset Selector & Dirty-State Overwrite Guard
- **Component Preset Selector:**
  - Inspector header features a curated dropdown of built-in templates specific to the selected component (e.g. Frame Buffer templates, Duperscope templates).
- **Dirty-State Confirmation Modal:**
  - If the component parameters or children have been modified, selecting a template triggers a confirmation dialog (`BaseModalDialog`) warning that current settings will be overwritten.
  - Confirming pushes the pre-overwrite state to the Undo stack and cleanly applies the template.

### FR-5: 100-Step Undo / Redo Engine with Input Coalescing
- **Time-Travel History Stack:**
  - 100-snapshot immutable JSON history buffer tracking:
    - Node additions, deletions, selections, and repositioning.
    - Port wiring and connection changes.
    - Parameter mutations (both fixed and expression modes).
- **Continuous Input Coalescing:**
  - Dragging sliders, knobs, or typing in formula inputs updates the 60 FPS live visualizer immediately, but coalesces the history record until pointer release (`onPointerUp`) or a 500ms typing debounce.
- **Shortcuts & Toolbar Controls:**
  - Dedicated Undo and Redo toolbar buttons with state-aware enabled/disabled styling.
  - Keyboard shortcuts: `Ctrl+Z` / `Cmd+Z` (Undo), `Ctrl+Y` / `Ctrl+Shift+Z` (Redo).

### FR-6: Preset Serialization & Import/Export
- **Standard Preset JSON Schema:**
  - Structured JSON format encoding:
    - Metadata (`name`, `author`, `version`, `targetFps`, `resolutionScale`, `audioBands`).
    - Component tree hierarchy and named buffer routes.
    - Per-node parameter configurations (`mode`, fixed values, expressions).
- **Export Capabilities:**
  - Download preset as `.json` file.
  - Copy preset JSON to clipboard with toast notification.
- **Import Capabilities:**
  - Load preset from local file input.
  - Drag-and-drop `.json` file directly onto the studio viewport.
  - Paste preset JSON from clipboard (`Ctrl+V` / `Cmd+V`).
  - Validation against preset schema with graceful error reporting on malformed presets.
  - Auto-layout executed immediately on import to ensure clean graph presentation.

---

## Non-Functional Requirements
- **Performance:** Node graph interactions, canvas zooming, and panning must not degrade 60 FPS WebGL canvas rendering.
- **Memory Safety:** Sparkline canvas buffers and graph listeners must be disposed cleanly on node unmount.
- **Accessibility & Keyboard Navigation:** Full keyboard accessibility across the inspector, graph node selection, and autocomplete menus.
