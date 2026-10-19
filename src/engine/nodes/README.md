# Visual Nodes Subsystem (`src/engine/nodes/`)

This directory contains reusable scene and media nodes that implement the `VisualNode` lifecycle interface.

## Modules

- `static-image-node.ts`: `StaticImageNode` implementing `VisualNode`. Displays static image textures with aspect-ratio preservation (`cover`, `contain`, `stretch`), dynamic expression opacity modulation, and named buffer registration with `BufferPool`.
- `static-image-node.test.ts`: Vitest unit tests verifying aspect-ratio scaling across portrait/landscape/square ratios, dynamic opacity evaluation, BufferPool registration, and resource disposal.
