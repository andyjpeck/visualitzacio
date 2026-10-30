# Undo / Redo History Subsystem (`src/ui/history/`)

## Overview
This directory contains the 100-step Semantic Action Delta history engine and keyboard shortcut bindings for Visualització.

## Semantic Action Deltas vs. Full Snapshot History
Instead of cloning and storing the entire preset scene graph (all nodes, edges, textures, and parameters) for every single undo step, the engine records fine-grained **Semantic Action Deltas**:
- **Delta Types:**
  - `update-node`: Stores only modified parameter keys in `beforeData` / `afterData` or position transforms. Untouched nodes (including heavy Base64 image payloads) are never duplicated.
  - `add-node`: Stores only added nodes and edges. Undoing removes them; redoing re-inserts them.
  - `delete-node`: Stores deleted nodes, edges, and original array indices for lossless positional restoration.
  - `reorder-nodes`: Stores only the before/after node ID ordering.
  - `reparent-node`: Stores container ID and local offset shifts.
  - `update-settings`: Stores only mutated global settings (`targetFps`, `resolutionScale`, `audioBands`).
  - `update-feedback`: Stores only modified ping-pong feedback parameters.
  - `preset-load`: Full snapshot fallback reserved exclusively for complete preset replacements.
- **Continuous In-Place Coalescing:** Rapid continuous actions (such as 60 FPS slider dragging or debounced typing) update the `afterData` of the existing top delta in-place while keeping the initial `beforeData` baseline pristine. Exactly 1 delta is stored on the past stack.
- **Memory Conservation:** Reduces memory footprint during typical editing sessions by orders of magnitude (from ~100MB+ down to tens of kilobytes).

## Modules

| File | Purpose |
| :--- | :--- |
| `undo-redo-manager.ts` | 100-step Semantic Action Delta history stack engine (`UndoRedoManager`) supporting fine-grained diffing, in-place continuous coalescing, FIFO stack limits, and bidirectional delta application. |
| `use-undo-redo-shortcuts.ts` | Global keyboard listener (`Ctrl+Z`, `Cmd+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`) with text input focus guards. |

## Testing
- `undo-redo-manager.test.ts`: Verifies discrete delta recording, 100-step FIFO stack depth, memory conservation against heavy payloads, structural node addition/deletion with index recovery, layer reordering/reparenting, and in-place coalescing.
