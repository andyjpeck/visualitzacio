# User Interface Subsystem (`src/ui/`)

The `ui` directory contains the React 19 component hierarchy and Zustand state store.

## Architecture: Two-Plane Decoupling

The UI components operate on the **Low-Frequency User Plane** (<10 Hz). They do **NOT** re-render on 60 FPS animation frames. Where high-frequency updates are required (such as the DSP telemetry bars, track seek progress slider, and formula testbed sparkline), components use direct DOM references (`useRef`) within `requestAnimationFrame` loops to mutate styles, text content, and canvas contexts directly without triggering React reconciliations.

---

## Subdirectories

- [**`canvas/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/canvas/README.md)
  Full-viewport WebGL canvas container and debounced `ResizeObserver` lifecycle management.

- [**`dialogs/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/dialogs/README.md)
  Reusable modal dialog framework (`BaseModalDialog`) providing pointer-capture dragging, Escape key dismissal, and centralized dialog stack history navigation.

- [**`expressions/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/expressions/README.md)
  Modular dynamic expression UI subcomponents: formula input with validation badge, 60 FPS canvas sparkline with dynamic scaling, quick-reference tooltips, and preset catalog.

- [**`hooks/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/hooks/README.md)
  Reusable UI hooks for pointer-capture viewport dialog dragging (`useDraggableDialog`) and Escape key listeners (`useEscapeKey`).

- [**`hud/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/hud/README.md)
  Head-Up Display overlays, including real-time audio telemetry meters (Bass, Mid, Treble, RMS, Beat, BPM, Time, Frame), the cyber FPS badge, and the interactive formula testbed.

- [**`settings/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/settings/README.md)
  Performance configuration modals for tuning target FPS, internal resolution scale, and DSP frequency band boundaries.

- [**`store/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/store/README.md)
  Zustand global store (`useAppStore`) managing low-frequency UI states (play state, volume, active audio source, filenames, modal visibility).

- [**`studio/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/studio/README.md)
  Studio workspace layout engine (`StudioSplitView`) providing resizable 3-pane partitioning (preview, node graph, parameter inspector), Studio vs. Live performance modes, and 3-second mouse inactivity HUD auto-hide.

- [**`toolbar/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/toolbar/README.md)
  Top floating glassmorphic toolbar housing transport controls, audio source selectors (Sample -> File -> Mic), audio seek progress bar, volume control, and settings toggles.
