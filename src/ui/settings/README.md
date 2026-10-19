# Performance Settings (`src/ui/settings/`)

This directory contains configuration dialogs for performance presets.

## Components

- [**`preset-settings-modal.tsx`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/settings/preset-settings-modal.tsx):
  - Accessible modal dialog for configuring target frame rates (30, 60, 120, 144 FPS) and internal WebGL resolution scales (1.0x Native, 0.75x High, 0.5x Balanced, 0.25x Eco).
  - Synchronizes changes immediately with `useAppStore` and `RenderEngine`.
  - Supports keyboard escape dismissal, backdrop click closing, and ARIA modal attributes.
