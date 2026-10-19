# Track 4: Visual Studio Shell, Node Graph & Preset Import/Export

This track delivers the full **Studio / Editor workspace** for Visualització, transitioning the application from a floating testbed into an integrated, interactive audio-visual synthesizer workstation.

## Documents

- [**Track Specification (`spec.md`)**](./spec.md): Comprehensive functional requirements (FR-1 through FR-6) covering split-view workspace architecture, `@xyflow/react` node graph pipeline, universal `f(x)` inspector with autocomplete and 60 FPS sparkline monitors, component preset selector with dirty-state guards, 100-step undo/redo engine, and JSON preset serialization.
- [**Implementation Plan (`plan.md`)**](./plan.md): Phased test-driven implementation plan with measurable task checklists.
- [**Metadata (`metadata.json`)**](./metadata.json): GitHub issue linkage (#7) and active status tracking.

## Key Deliverables

1. **Split-View Studio Workspace:** Resizable dual-plane layout (left: live preview canvas; right: node graph workspace & parameter inspector) with Studio vs. Live Fullscreen modes.
2. **Interactive Node Graph (`@xyflow/react`):** Custom node cards (`MasterFrameBufferNode`, `FrameBufferNode`, `StaticImageNode`, `TestVisualNode`), input/output port wiring (`saveTo` $\to$ `loadFrom`), and auto-layout.
3. **Universal `f(x)` Component Inspector:** Docked parameter panel with seamless toggle between fixed controls and dynamic expressions, inline syntax validation, variable/function autocomplete, and 60 FPS sparkline telemetry.
4. **Component Preset Selector:** Instant template loading with dirty-state overwrite protection and automated Undo snapshotting.
5. **100-Step Undo/Redo Engine:** Immutable JSON history buffer with continuous input coalescing on sliders and debounced typing.
6. **JSON Preset Import/Export:** Schema validation, clipboard copy/paste, file upload/download, and automatic DAG layout on import.
