# Hierarchical Layer Tree Outliner (`src/ui/tree/`)

This directory contains the hierarchical outliner tree view representing the execution order and structural nesting of visualizer components.

## Components & Capabilities

1. **LayerTreeView (`layer-tree-view.tsx`):**
   - Outliner displaying the complete component hierarchy nested inside container nodes (such as `MasterFrameBuffer` and child `FrameBuffer` nodes).
   - Drag-and-drop layer reordering and reparenting with boundary clamping and ancestor/descendant drop cycle prevention.
   - Inline layer renaming on double-click (commits on Enter/blur, cancels on Escape).
   - Real-time execution order badges reflecting spatial DAG execution sequence.
   - Interactive semantic buffer tag highlighting (`@NAME` producer and consumer glow).
   - Contextual add-child layer dialog menu with outside-click and Escape key dismissal.
   - Per-layer actions: bypass toggle, reorder up/down, and layer removal.

## Module Exports

| File | Purpose |
| :--- | :--- |
| `layer-tree-view.tsx` | Hierarchical collapsible tree view with drag-and-drop reordering and semantic tag lighting |
| `layer-tree-view.test.tsx` | Vitest unit tests for tree rendering, reordering, reparenting, renaming, and dismiss behavior |
