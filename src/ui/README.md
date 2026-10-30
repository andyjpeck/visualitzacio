# User Interface Subsystem (`src/ui/`)

The `ui` directory contains the React 19 component hierarchy and Zustand state store.

## Architecture: Two-Plane Decoupling

The UI components operate on the **Low-Frequency User Plane** (<10 Hz). They do **NOT** re-render on 60 FPS animation frames. Where high-frequency updates are required (such as the DSP telemetry bars, track seek progress slider, and formula sparklines), components use direct DOM references (`useRef`) within `requestAnimationFrame` loops to mutate styles, text content, and canvas contexts directly without triggering React reconciliations.

---

## Subdirectories

- [**`canvas/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/canvas/README.md)
  Full-viewport WebGL canvas container and debounced `ResizeObserver` lifecycle management.

- [**`dialogs/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/dialogs/README.md)
  Reusable modal dialog framework (`BaseModalDialog`) providing pointer-capture dragging, Escape key dismissal, and centralized dialog stack history navigation.

- [**`expressions/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/expressions/README.md)
  Modular dynamic expression UI subcomponents: formula input with validation badge, 60 FPS canvas sparkline with dynamic scaling, quick-reference tooltips, and preset catalog.

- [**`graph/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/graph/README.md)
  Graph pipeline contracts, named buffer flow edge synchronization, execution order resolution, and container bounds layout math.

- [**`history/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/history/README.md)
  100-step immutable JSON history engine (`UndoRedoManager`) with continuous input coalescing and global keyboard shortcut bindings.

- [**`hooks/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/hooks/README.md)
  Reusable UI hooks for pointer-capture viewport dialog dragging (`useDraggableDialog`) and Escape key listeners (`useEscapeKey`).

- [**`hud/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/hud/README.md)
  Head-Up Display overlays, including real-time audio telemetry meters (Bass, Mid, Treble, RMS, Beat, BPM, Time, Frame), the cyber FPS badge, and the interactive formula testbed.

- [**`inspector/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/inspector/README.md)
  Unified Parameter Inspector displaying modulatable parameter rows, universal `f(x)` expression morphing, inline variable/function autocomplete, and component preset selector with dirty-state confirmation guards.

- [**`settings/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/settings/README.md)
  Performance configuration modals for tuning target FPS, internal resolution scale, and DSP frequency band boundaries.

- [**`store/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/store/README.md)
  Zustand global store (`useAppStore`) managing low-frequency UI states (play state, volume, active audio source, filenames, modal visibility, graph node definitions).

- [**`studio/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/studio/README.md)
  Studio workspace layout engine (`StudioSplitView`) providing resizable 3-pane partitioning (preview, workspace outliner pane, parameter inspector), Studio vs. Live performance modes, and floating toolbar scaling.

- [**`toolbar/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/toolbar/README.md)
  Top floating glassmorphic toolbar housing transport controls, audio source selectors (Sample -> File -> Mic), audio seek progress bar, volume control, and settings toggles.

- [**`tree/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/tree/README.md)
  Collapsible Hierarchical Layer Tree View (Outliner) providing drag-and-drop layer reordering, container nesting, inline renaming, semantic tag lighting, and container deletion guards.
