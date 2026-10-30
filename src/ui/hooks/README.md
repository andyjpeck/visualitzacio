# UI Hooks (`src/ui/hooks/`)

This directory contains reusable React hooks for HUD interactions, dialog behavior, and keyboard event management.

## Contents

- `use-draggable-dialog.ts`: Hook for viewport-clamped pointer-capture dialog dragging with touch and mouse support.
- `use-escape-key.ts`: Hook for dismissing modals and dialogs upon pressing the Escape key.
- `use-preset-drop-and-paste.ts`: Global hook enabling preset JSON file drag-and-drop onto the window and clipboard paste (`Ctrl+V` / `Cmd+V`) with text input focus guards.
