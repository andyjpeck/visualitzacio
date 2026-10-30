# Undo / Redo History Subsystem (`src/ui/history/`)

## Overview
This directory contains the 100-step immutable JSON history engine and keyboard shortcut bindings for Visualització.

## Modules

| File | Purpose |
| :--- | :--- |
| `undo-redo-manager.ts` | 100-snapshot history stack engine (`UndoRedoManager`) supporting continuous input coalescing (slider drags, formula typing debounces), deep cloning, and FIFO stack limits. |
| `use-undo-redo-shortcuts.ts` | Global keyboard listener (`Ctrl+Z`, `Cmd+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`) with text input focus guards. |

## Testing
- `undo-redo-manager.test.ts`: Verifies discrete snapshot recording, 100-snapshot maximum depth cap, branch invalidation on new actions, input coalescing, and timer debouncing.
