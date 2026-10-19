# LightSource Component Proposal

> **Component Type:** `light_source`  
> **Status:** Draft / Initial Concept (Detailed specification to be defined)

---

## 1. Overview & Vision

The **LightSource** component projects dynamic lighting onto the current visual image or frame buffer surface. It simulates 2D and 2.5D lighting effects (point lights, spotlights, specular sheen, and directional washes), adding depth, tactile illumination, and responsive stage-lighting dynamics to flat imagery and generative visuals.

---

## 2. Preliminary Concept

- **Light Types:** Point Light (radial glow), Directional Light (parallel rays), and Spotlight (cone with beam angle and penumbra).
- **Surface Interaction:**
  - Standard additive/screen illumination over existing pixels.
  - Optional height/normal estimation from image luminance (bump-mapping effect) producing specular highlights on bright edges.
- **Visual Gizmo:** Interactive on-screen light handle in the visualizer viewport allowing users to position the light source and drag radius/direction cones directly.
- **Audio Modulation:** Intensity pulsing to `$BEAT` or `$RMS`, position orbiting via `$TIME`, and color shifting with frequency bands.

---

## 3. Pending Specification Details

> [!NOTE]
> This proposal is an early conceptual placeholder. Full technical specification, GLSL shader kernels, and parameter schemas will be drafted in a dedicated planning task.

Details to be specified in the future:
1. Exact parameter schema (`position_x`, `position_y`, `height_z`, `color`, `intensity`, `falloff`, `specular_power`).
2. Height-map derivation methods (Sobel filter for normal estimation vs. simple luminance weighting).
3. Multiple light source support (single component with array of lights vs. chaining multiple light nodes).
4. Viewport gizmo interaction conventions in the Studio/Editor workspace.
