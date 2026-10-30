# Graph Pipeline & Layout Subsystem (`src/ui/graph`)

## Overview
The Graph Pipeline Subsystem maintains data contracts, execution order resolution, container bounds calculations, and texture buffer dependency edges (`saveTo` $\to$ `loadFrom`) for Visualització's visual pipeline.

Following the Track 4 architecture consolidation, user-facing layer hierarchy and workspace interaction are managed through the Outliner Layer Tree (`src/ui/tree/`), while this module provides shared data structures and layout algorithms.

## Modules & Files

| Path | Purpose |
| :--- | :--- |
| `node-data.ts` | Data contracts and typing for all pipeline node types (`BaseNodeData`, `FrameBufferNodeData`, `StaticImageNodeData`, `TestVisualNodeData`, `MasterFrameBufferNodeData`). |
| `buffer-edges.ts` | Synchronizes directed texture buffer flow edges (`saveTo` $\to$ `loadFrom`) between producer buffers and consumers. |
| `execution-order.ts` | Calculates deterministic sequential and topological render execution order across hierarchical nodes. |
| `layout/` | Container bounds math, sibling Y-stack reflowing, and Dagre hierarchical auto-layout algorithms. |

## Testing
- `graph-edges.test.tsx`: Validates automatic buffer flow edge synchronization between publishers and consumers.
- `execution-order.test.ts`: Verifies topological execution sorting and cycle detection.
- `layout/container-bounds.test.ts`: Tests container dimension expansion, padding, and child position offsets.
- `layout/auto-layout.test.ts`: Validates hierarchical Dagre layout coordinates.
