# UI Dialogs

This directory contains reusable modal dialog components and layout structures for the Visualització user interface.

## Overview

All dialogs in Visualització adhere to the following architecture:
- **Centralized Dialog Stack (`dialogStack`)**: Only one modal dialog is visible at any given time (`useAppStore`). Opening a child dialog pushes it onto the history stack; closing it steps backward and restores the previous dialog.
- **Draggability (`useDraggableDialog`)**: Dialogs can be repositioned across the viewport by dragging their header grip handle. Coordinates are clamped to the visible viewport and automatically adjusted on window resize.
- **Keyboard Dismissal (`useEscapeKey`)**: Pressing the `Escape` key immediately closes the active dialog and walks back through the history stack.
- **Cyberpunk Theme & Accessibility**: Dark glassmorphic backdrop panels (`backdrop-blur-md`), cyber-cyan accents, explicit `role="dialog"`, and `aria-labelledby` semantics.

## Files

| File | Description |
| :--- | :--- |
| `base-modal-dialog.tsx` | Reusable base modal shell component providing header dragging, close buttons, Esc handling, and store integration. |
| `base-modal-dialog.test.tsx` | Vitest suite validating rendering, drag events, Esc key dismissal, and store bindings. |
