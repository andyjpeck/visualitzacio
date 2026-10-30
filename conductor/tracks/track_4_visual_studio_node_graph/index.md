# Track 4: Visual Studio Shell, Node Graph & Preset Import/Export

This track delivers the full **Studio / Editor workspace** for Visualització, transitioning the application from a floating testbed into an integrated, interactive audio-visual synthesizer workstation.

## Documents

- [**Track Specification (`spec.md`)**](./spec.md): Comprehensive functional requirements (FR-1 through FR-6) covering split-view workspace architecture, `@xyflow/react` node graph pipeline, universal `f(x)` inspector with autocomplete and 60 FPS sparkline monitors, component preset selector with dirty-state guards, 100-step undo/redo engine, and JSON preset serialization.
- [**Implementation Plan (`plan.md`)**](./plan.md): Phased test-driven implementation plan with measurable task checklists.
- [**Metadata (`metadata.json`)**](./metadata.json): GitHub issue linkage (#7) and active status tracking.

## Key Deliverables

1. **Split-View Studio Workspace:** Resizable dual-plane layout (left: live preview canvas with auto-scaling toolbar; right: parameter inspector & layer tree workspace) with Studio vs. Live Fullscreen modes.
2. **Dedicated Hierarchical Layer Tree (Outliner) & Node Graph:** Outliner pane with drag-and-drop reordering/reparenting, inline renaming, semantic tag lighting, and fast JSON diagnostic export, backed by `@xyflow/react` spatial graph pipeline and auto-layout.
3. **Universal `f(x)` Component Inspector:** Docked parameter panel with seamless toggle between fixed controls and dynamic expressions, inline syntax validation, variable/function autocomplete, 60 FPS sparkline telemetry, parameter tooltips, and static image file upload with Base64 JSON encoding.
4. **Component Preset Selector & Portal Modals:** Instant template loading with dirty-state overwrite protection and top-tier portal modals (`z-[9999]`) with backdrop blur.
5. **100-Step Undo/Redo Engine:** Immutable JSON history buffer with continuous input coalescing on sliders and debounced typing.
6. **JSON Preset Import/Export:** Schema validation, clipboard copy/paste, file upload/download, and automatic DAG layout on import.
