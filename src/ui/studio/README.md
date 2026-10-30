# Studio Workspace Module (`src/ui/studio`)

## Overview
The Studio Workspace module powers the visual synthesizer interface of Visualització. It provides the resizable split-view layout container with the Parameter Inspector stacked on top and the Visual Node Graph on the bottom, dual Studio vs. Live Performance modes, and HUD auto-hiding behavior.

## Components & Hooks

| File | Purpose |
| :--- | :--- |
| `studio-split-view.tsx` | Split-view container pairing the Viewport Preview (left) with a vertically stacked right column (Parameter Inspector on top, Workspace Pane on bottom), featuring both vertical and horizontal 60 FPS pointer dividers, min constraints, double-click reset, and `localStorage` persistence. |
| `workspace-pane.tsx` | Dedicated bottom workspace pane displaying the Hierarchical Layer Tree with active count badge, Expand / Collapse All toggle (preserving Master Output), and fast "Copy JSON" diagnostic export. |
| `use-studio-controls.ts` | State machine and event coordinator for Studio vs. Live modes, 3-second mouse inactivity HUD auto-hide, and global `F11` / `Escape` keyboard shortcuts. |

## Layout Architecture & Constraints

```
┌─────────────────────────────────┬───┬───────────────────────────────────────────┐
│        Viewport Preview         │ V │            Parameter Inspector            │
│       (min-width: 320px)        │ E │            (min-height: 180px)            │
│        Default ratio: 50%       │ R │            Default ratio: 45%             │
│                                 │ T │─── H O R I Z O N T A L   D I V I D E R ───│
│                                 │   │       Workspace Pane (Layer Tree)         │
│                                 │ D │            (min-height: 200px)            │
│                                 │ I │            Default ratio: 55%             │
│                                 │ V │                                           │
└─────────────────────────────────┴───┴───────────────────────────────────────────┘
```

- **Vertical Divider:** Controls boundary between Viewport Preview (left) and Right Column (right). Double-clicking resets to `0.50` (50% / 50%).
- **Horizontal Divider:** Controls boundary between Parameter Inspector (top) and Workspace Pane (bottom). Double-clicking resets to `0.45` (45% inspector / 55% workspace pane).
- **Live Mode:** Collapses the entire Right Column (Inspector and Workspace Pane); Viewport Preview expands to 100% full screen.
- **Inactivity Auto-Hide:** In Live mode, 3 seconds of mouse inactivity smoothly fades out floating HUD elements; any interaction instantly restores full visibility.

## Testing
Comprehensive unit and integration test coverage:
- `studio-split-view.test.tsx`: Tests rendering of panes/dividers, min-width clamping, pointer dragging, double-click reset, and mode-based collapsing.
- `studio-mode.test.tsx`: Tests inactivity timer lifecycle, timer reset on user interactions, and keyboard shortcut handling (`F11`, `Escape`).
