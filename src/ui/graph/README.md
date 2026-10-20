# Node Graph Subsystem (`src/ui/graph`)

## Overview
The Node Graph Subsystem powers the interactive visual synthesizer pipeline of Visualització using `@xyflow/react`. It visually represents execution order, nested container relationships, and texture buffer routing (`saveTo` $\to$ `loadFrom`).

## Subdirectories & Modules

| Path | Purpose |
| :--- | :--- |
| `nodes/node-data.ts` | Data contracts and typing for all custom node types in the pipeline. |
| `nodes/master-frame-buffer-node.tsx` | Permanent root anchor node with golden crown badge, locked status, and final screen output handles. |
| `nodes/frame-buffer-node.tsx` | Offscreen ping-pong feedback pass with feedback decay, transform chips, and blend mode indicators. |
| `nodes/static-image-node.tsx` | Image layer node displaying thumbnail preview, aspect fit mode badge, and `@NAME` publish tag. |
| `nodes/test-visual-node.tsx` | Procedural audio-reactive wireframe mesh node with real-time spectrum modulation status. |
| `nodes/node-types.ts` | Node types registry mapping `@xyflow/react` type keys to custom components. |

## Port & Connection Wiring Standard

Each custom node exposes two orthogonal dimensions of dataflow:

1. **Hierarchy Execution Flow (Top / Bottom):**
   - **`exec-in` (Top Handle):** Input execution trigger from parent container or previous execution pass.
   - **`exec-out` (Bottom Handle):** Output execution trigger to nested child passes or next sequential pass.
2. **Buffer Data Routing (Left / Right):**
   - **`buffer-in` (Left Handle):** Input texture sampler (`loadFrom`). Samples from an allocated texture in `BufferPool`.
   - **`buffer-out` (Right Handle):** Output texture publisher (`saveTo`). Publishes the rendered FBO texture into `BufferPool` with an `@NAME` tag.

## Testing
- `nodes/custom-nodes.test.tsx`: Validates rendering, handles, badges, labels, and selection states across all custom node types.
