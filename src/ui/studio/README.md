# Studio Workspace Module (`src/ui/studio`)

## Overview
The Studio Workspace module powers the visual synthesizer interface of Visualització. It provides the resizable 3-pane split-view layout container, dual Studio vs. Live Performance modes, and HUD auto-hiding behavior.

## Components & Hooks

| File | Purpose |
| :--- | :--- |
| `studio-split-view.tsx` | 3-pane resizable container (`Preview`, `Node Graph`, `Inspector`) with min-width constraints, double-click reset, and `localStorage` persistence. |
| `use-studio-controls.ts` | State machine and event coordinator for Studio vs. Live modes, 3-second mouse inactivity HUD auto-hide, and global `F11` / `Escape` keyboard shortcuts. |

## Layout Architecture & Minimum Width Constraints

```
┌───────────────────────────┬───┬─────────────────────────────────┬───┬───────────────────────────┐
│     Viewport Preview      │ D │        Visual Node Graph        │ D │     Parameter Inspector   │
│     (min-width: 320px)    │ 1 │       (min-width: 400px)        │ 2 │     (min-width: 300px)    │
│     Default ratio: 35%    │   │       Default ratio: 40%        │   │     Default ratio: 25%    │
└───────────────────────────┴───┴─────────────────────────────────┴───┴───────────────────────────┘
```

- **Divider 1:** Controls boundary between Viewport Preview and Node Graph.
- **Divider 2:** Controls boundary between Node Graph and Parameter Inspector.
- **Double-Click Reset:** Double-clicking either divider restores default ratio `[0.35, 0.40, 0.25]`.
- **Live Mode:** Collapses Node Graph and Inspector completely; Viewport Preview expands to 100% width.
- **Inactivity Auto-Hide:** In Live mode, 3 seconds of mouse inactivity smoothly fades out floating HUD elements; any interaction instantly restores full visibility.

## Testing
Comprehensive unit and integration test coverage:
- `studio-split-view.test.tsx`: Tests rendering of panes/dividers, min-width clamping, pointer dragging, double-click reset, and mode-based collapsing.
- `studio-mode.test.tsx`: Tests inactivity timer lifecycle, timer reset on user interactions, and keyboard shortcut handling (`F11`, `Escape`).
