# Graph Layout Subsystem (`src/ui/graph/layout`)

## Overview
This directory contains pure geometric layout algorithms for hierarchical containers and node stacks.

## Modules

| File | Purpose |
| :--- | :--- |
| `container-bounds.ts` | Calculates bounding dimensions (`width`, `height`) for container frame buffers based on nested child node counts and padding. Provides `getNextChildPosition` and `reflowGraphStacks` for vertical sibling positioning. |
| `auto-layout.ts` | Dagre-based hierarchical graph auto-layout engine for structuring nodes and parent-child container hierarchies upon preset import. |

## Testing
- `container-bounds.test.ts`: Unit tests for container bounding box calculations, child position indexing, and recursive parent bounds recalculation.
- `auto-layout.test.ts`: Unit tests for deterministic hierarchical auto-layout placement.
