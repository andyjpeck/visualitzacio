# 3dMesh Component Proposal

> **Component Type:** `3d_mesh`  
> **Status:** Draft / Initial Concept (Detailed specification to be defined)

---

## 1. Overview & Vision

The **3dMesh** component renders 3D polygonal geometry directly into the Visualització render graph. It allows users to place parametric primitives (cubes, spheres, tori, grids, ribbons) or load custom 3D models (GLTF/GLB/OBJ), modulating their transform matrices, vertex positions, and materials in real time with music telemetry.

---

## 2. Preliminary Concept

- **Geometry Sources:**
  - Built-in parametric primitives (Icosahedron, Torus, Plane Grid, Cylinder, Ring).
  - External file imports (`.glb`, `.gltf`, `.obj`).
- **Material Styles:**
  - Solid faceted with flat/smooth shading and specular shininess.
  - Cyberpunk wireframe lattice with controllable line thickness and glow.
  - Transparent glass/crystal refraction.
- **Audio Reactivity:**
  - Scale and rotation matrices driven by `$BASS`, `$BEAT`, and `$TIME`.
  - Vertex displacement shaders (undulating wireframe waves or audio spectrum terrain meshes).
- **Integration with Other Components:**
  - Can be contained inside a `frame_buffer` for feedback trails and post-processing.
  - Can be illuminated by upstream or scene `light_source` components.

---

## 3. Pending Specification Details

> [!NOTE]
> This proposal is an early conceptual placeholder. Full technical specification, asset loader pipelines, and parameter schemas will be drafted in a dedicated planning task.

Details to be specified in the future:
1. Exact parameter schema (`primitive_type`, `model_url`, `scale`, `rotation`, `wireframe`, `material_type`).
2. Asset loading and memory caching strategy for user-imported 3D files.
3. Vertex displacement shader interface and expression binding integration.
4. Camera projection integration within the 2D/3D composite pipeline.
