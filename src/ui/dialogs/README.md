# UI Dialogs

This directory contains reusable modal dialog components and layout structures for the Visualització user interface.

## Overview

All dialogs in Visualització adhere to the following architecture:
- **Universal React Portal Mounting**: Rendered directly into `document.body` via `createPortal`, breaking out of nested pane stacking contexts (`backdrop-filter`, `overflow: hidden`, `transform`) created by studio split-view containers.
- **Top-Tier Elevation & Backdrop Overlay**: Modal dialog cards are elevated to `z-[9999]` over a full-viewport semi-transparent blurred backdrop overlay (`bg-black/60 backdrop-blur-sm z-[9998]`). Clicking the backdrop dismisses the dialog.
- **Centralized Dialog Stack (`dialogStack`)**: Only one modal dialog is visible at any given time (`useAppStore`). Opening a child dialog pushes it onto the history stack; closing it steps backward and restores the previous dialog.
- **Draggability (`useDraggableDialog`)**: Dialogs can be repositioned across the viewport by dragging their header grip handle. Coordinates are clamped to the visible viewport and automatically adjusted on window resize.
- **Keyboard Dismissal (`useEscapeKey`)**: Pressing the `Escape` key immediately closes the active dialog and walks back through the history stack.
- **Cyberpunk Theme & Accessibility**: Dark glassmorphic backdrop panels (`backdrop-blur-md`), cyber-cyan accents, explicit `role="dialog"`, and `aria-labelledby` semantics.

## Files

| File | Description |
| :--- | :--- |
| `base-modal-dialog.tsx` | Reusable base modal shell component providing React Portal mounting, backdrop overlay, header dragging, close buttons, Esc handling, and store integration. |
| `base-modal-dialog.test.tsx` | Vitest suite validating rendering, drag events, Esc key dismissal, backdrop clicks, and store bindings. |
