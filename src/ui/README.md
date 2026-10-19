# User Interface Subsystem (`src/ui/`)

The `ui` directory contains the React 19 component hierarchy and Zustand state store.

## Architecture: Two-Plane Decoupling

The UI components operate on the **Low-Frequency User Plane** (<10 Hz). They do **NOT** re-render on 60 FPS animation frames. Where high-frequency updates are required (such as the DSP telemetry bars and track seek progress slider), components use direct DOM references (`useRef`) within `requestAnimationFrame` loops to mutate styles and attributes directly without triggering React reconciliations.

---

## Subdirectories

- [**`canvas/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/canvas/README.md)
  Full-viewport WebGL canvas container and debounced `ResizeObserver` lifecycle management.

- [**`hud/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/hud/README.md)
  Head-Up Display overlays, including real-time audio telemetry meters (Bass, Mid, Treble, RMS, Beat, BPM) and the cyber FPS badge.

- [**`settings/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/settings/README.md)
  Performance configuration modals for tuning target FPS and internal resolution scale.

- [**`store/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/store/README.md)
  Zustand global store (`useAppStore`) managing low-frequency UI states (play state, volume, active audio source, filenames, modal visibility).

- [**`toolbar/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/toolbar/README.md)
  Top floating glassmorphic toolbar housing transport controls, audio source selectors (Sample -> File -> Mic), audio seek progress bar, volume control, and settings toggles.
