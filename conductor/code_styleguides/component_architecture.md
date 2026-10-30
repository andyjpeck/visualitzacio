# Component Architecture Style Guide & Evaluation Checklist

This guide defines the architectural standards for creating and refactoring visual nodes, processing passes, and components in Visualització.

---

## 🎯 The Three Core Component Tenets

### 1. Focused Identity (Single Responsibility)
- Each component represents exactly one distinct visual synthesis, transformation, or compositing paradigm.
- A component must never become a "jack-of-all-trades" monolith. If a node starts handling multiple unrelated rendering stages (e.g. geometry generation AND post-processing color grading AND feedback buffering), it must be split into orthogonal nodes.

### 2. Orthogonal Taxonomy (Avoid Overly Narrow Sprawl)
- We maintain a curated, tight library of powerful primitives.
- Do not introduce a new component if the visual outcome is simply a variation that can be achieved by:
  - Adding an expressive parameter to an existing node.
  - Parameterizing an existing shader.
  - Composing existing primitives in the node graph.
- Overly narrow components must be generalized or combined with related existing nodes to preserve an intuitive taxonomy.

### 3. Composability First
- Prioritize graph wiring over monolithic feature accumulation.
- Nodes should cleanly accept input textures (via `@NAME` buffers or parenting) and produce predictable visual output.

### 4. Resource Conservation: Geometry Scripting vs. Texture Passes
- **Geometry-First for Spatial Transformations & Symmetry**:
  - When creating mirrored, rotated, or duplicated vector curves, ribbons, or particle swarms, prefer using **Duperscope mathematical formulas** over allocating offscreen `FrameBuffer` render targets.
  - *Engineering Reason*: Evaluating 1,000–4,000 points in JavaScript takes $< 0.08\text{ ms}$ on modern CPUs ($< 0.5\%$ of a 16.6ms frame budget) and renders within a single GPU pass using $< 1\text{ MB}$ of VRAM. Conversely, an offscreen `FrameBuffer` allocates 8–33 MB of VRAM per buffer (66 MB on high-DPI displays with feedback) and triggers GPU render-target context switching and memory bandwidth overhead.
- **When to Use FrameBuffers**:
  - Reserve `FrameBuffer` nodes for true **texture-space transformations**: recursive dual-FBO ping-pong feedback (trails, smoke, infinite vortexes), full-screen blur, and compositing blend modes across visual passes.

---

## 🚦 Conductor Track Specification Assessment

During track specification (`spec.md`), the developer must evaluate every proposed component against this checklist:

| Question | Requirement |
| :--- | :--- |
| **Focused Identity?** | Does the component have one clear, unambiguous visual responsibility? |
| **Not Overly Narrow?** | Can this be achieved by generalizing an existing component rather than creating a one-off? |
| **Not Monolithic?** | Is it free of feature bloat, unrelated secondary passes, or kitchen-sink options? |
| **Composable?** | Does it connect cleanly into the existing Two-Plane pipeline and buffer routing? |
| **Zero-Allocation?** | Can its 60 FPS `update()` loop run with zero Garbage Collection overhead? |
| **Ambiguity Resolved?** | If component boundaries were ambiguous, has the user explicitly confirmed the chosen direction? |
