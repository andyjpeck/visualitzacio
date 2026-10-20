# Studio Workspace Module (`src/ui/studio`)

## Overview
The Studio Workspace module powers the visual synthesizer interface of Visualització. It provides the resizable 2-pane split-view layout container with a collapsible slide-out parameter inspector drawer, dual Studio vs. Live Performance modes, and HUD auto-hiding behavior.

## Components & Hooks

| File | Purpose |
| :--- | :--- |
| `studio-split-view.tsx` | 2-pane resizable container (`Preview` and `Node Graph`) with a collapsible slide-out `Parameter Inspector` drawer, min-width constraints, double-click reset, and `localStorage` persistence. |
| `use-studio-controls.ts` | State machine and event coordinator for Studio vs. Live modes, 3-second mouse inactivity HUD auto-hide, and global `F11` / `Escape` keyboard shortcuts. |

## Layout Architecture & Minimum Width Constraints

```
┌─────────────────────────────────┬───┬───────────────────────────────────────────┐
│        Viewport Preview         │ D │             Visual Node Graph             │
│       (min-width: 320px)        │ I │            (min-width: 400px)             │
│        Default ratio: 50%       │ V │             Default ratio: 50%            │
│                                 │   │              ┌──────────────────────────┐ │
│                                 │   │              │   Parameter Inspector    │ │
│                                 │   │              │     Slide-Out Drawer     │ │
│                                 │   │              │      (width: 340px)      │ │
│                                 │   │              └──────────────────────────┘ │
└─────────────────────────────────┴───┴───────────────────────────────────────────┘
```

- **Divider:** Controls boundary between Viewport Preview (left) and Visual Node Graph (right).
- **Double-Click Reset:** Double-clicking the divider restores default ratio `0.50` (50% / 50%).
- **Slide-Out Inspector Drawer:** Anchored on the right edge of the Node Graph. Slides in smoothly when open (`translate-x-0`) or collapses away (`translate-x-full`) with a floating toggle button to maximize graph canvas space.
- **Live Mode:** Collapses Node Graph and Inspector completely; Viewport Preview expands to 100% width.
- **Inactivity Auto-Hide:** In Live mode, 3 seconds of mouse inactivity smoothly fades out floating HUD elements; any interaction instantly restores full visibility.

## Testing
Comprehensive unit and integration test coverage:
- `studio-split-view.test.tsx`: Tests rendering of panes/dividers, min-width clamping, pointer dragging, double-click reset, and mode-based collapsing.
- `studio-mode.test.tsx`: Tests inactivity timer lifecycle, timer reset on user interactions, and keyboard shortcut handling (`F11`, `Escape`).
