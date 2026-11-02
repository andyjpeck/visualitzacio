# Specification: Track 15 — Mask Compositor Node (3-Way Buffer Reveal) (#18)

## 1. Overview
Visualització currently provides pairwise 2-texture blending in `FrameBufferNode` (`replace`, `additive`, `maximum`, `minimum`, `subtractive`, `multiplicative`, `screen`), but lacks the capability to perform 3-way dynamic masking (`mix(Foreground, Background, Mask)`). This makes it impossible for presets (such as audio-reactive rainy ocean presets) to cleanly puncture or expose an underlying background image (e.g. sunset) through an overlying surface (e.g. ocean water) using dynamic particle or feedback textures (e.g. raindrops).

Track 15 introduces a dedicated, strictly lean **`MaskCompositorNode`** (`type: "maskCompositor"`). In alignment with Visualització's single-responsibility architecture, `MaskCompositorNode` focuses purely on 3-way texture blending and delegates all container concerns (layer opacity, feedback, output blending, transformations, and BufferPool export via `saveTo`) to the parent `FrameBufferNode`.

---

## 2. Functional Requirements

### FR-1: Preset Schema Contract Update (`src/contracts/preset-schema.ts`)
- Add `'maskCompositor'` to allowed node types in `src/contracts/node-types.ts`.
- Define `MaskCompositorNodeData` in `src/ui/graph/node-data.ts`:
  - `foregroundFrom: string | null` (tag of the base/foreground texture, e.g. `@WATER`)
  - `backgroundFrom: string | null` (tag of the revealed/background texture, e.g. `@SUNSET`)
  - `maskFrom: string | null` (tag of the mask texture, e.g. `@RAIN`)
  - `maskInvert?: boolean` (invert mask logic, default `false`)
- Ensure `opacity`, `outputBlendMode`, and `saveTo` are **excluded** from `MaskCompositorNode` parameters to prevent duplicate functionality with `FrameBufferNode`.
- Update `validatePreset()` to validate `maskCompositor` node parameters.

### FR-2: GLSL Mask Compositor Shader (`src/engine/nodes/mask-compositor-shader.ts`)
- Create a dedicated fullscreen quad shader:
  - Uniforms:
    - `uForegroundTexture: sampler2D` (fallback to 1x1 black if unbound)
    - `uBackgroundTexture: sampler2D` (fallback to 1x1 black if unbound)
    - `uMaskTexture: sampler2D` (fallback to 1x1 black if unbound)
    - `uHasForeground: int`
    - `uHasBackground: int`
    - `uHasMask: int`
    - `uMaskInvert: int` (0 or 1)
  - Fragment Shader Logic:
    - Sample `vec4 fg = texture2D(uForegroundTexture, vUv);`
    - Sample `vec4 bg = texture2D(uBackgroundTexture, vUv);`
    - Sample `float maskVal = texture2D(uMaskTexture, vUv).r;`
    - If `uMaskInvert == 1`: `maskVal = 1.0 - maskVal;`
    - If `uHasMask == 0`: `maskVal = 0.0;`
    - `gl_FragColor = mix(fg, bg, clamp(maskVal, 0.0, 1.0));`

### FR-3: MaskCompositorNode Implementation (`src/engine/nodes/mask-compositor-node.ts`)
- Implement `VisualNode` contract:
  - `id: string`, `bypassed: boolean`
  - Getters and setters for `foregroundFrom`, `backgroundFrom`, `maskFrom`, `maskInvert`.
  - Orthographic camera and fullscreen plane quad setup.
  - In `init(renderer, bufferPool)`: store references to renderer and buffer pool.
  - In `update(ctx)`:
    - Resolve `foregroundFrom`, `backgroundFrom`, and `maskFrom` textures from `bufferPool`.
    - Bind resolved textures and uniforms to the shader material.
    - Render fullscreen quad into current render target.
  - In `dispose()`: dispose plane geometry and shader material.

### FR-4: ViewportCanvas Synchronization (`src/ui/canvas/viewport-canvas.tsx`)
- In `ViewportCanvas`:
  - Instantiate `new MaskCompositorNode(...)` when `gNode.type === 'maskCompositor'`.
  - Wire parameter mutations (`foregroundFrom`, `backgroundFrom`, `maskFrom`, `maskInvert`).
  - Attach into parent-child hierarchy.

### FR-5: UI Shell & Parameter Inspector Integration
- In `src/ui/tree/layer-tree-view.tsx`:
  - Add "Mask Compositor" to the "Add Child" dropdown menu with an intuitive icon (`Layers` / `Scissors`).
- In `src/ui/inspector/parameter-inspector.tsx`:
  - Add inspector control section for `maskCompositor`:
    - **Foreground Texture**: Dropdown populated from registered `BufferPool` tags in preset.
    - **Background Texture**: Dropdown populated from registered `BufferPool` tags in preset.
    - **Mask Texture**: Dropdown populated from registered `BufferPool` tags in preset.
    - **Invert Mask**: Toggle checkbox (`maskInvert`).

### FR-6: Rainy Ocean Sunset Reveal Preset (`presets/rainy-ocean-sunset.json`)
- Author the requested preset:
  - Base sunset image tagged `@SUNSET`.
  - Ocean water image tagged `@WATER`.
  - Audio-reactive Duperscope raindrop generator tagged `@RAIN` in a ping-pong feedback container with smooth decay (`opacity: 0.92`), scattering dramatically on beats.
  - `maskCompositor` node blending `@WATER` and `@SUNSET` modulated by `@RAIN`.

---

## 3. Non-Functional Requirements
- **Performance**: 1 single GPU draw call for the 3-way mix; $< 0.1\text{ ms}$ GPU execution time at 1080p 60 FPS.
- **Fail-Safe Robustness**: If any referenced buffer tag is unbound or pending, gracefully fall back to 1x1 neutral texture without throwing WebGL runtime exceptions or breaking the render loop.
- **Test Integrity**: Full unit test coverage for node lifecycle, shader uniform binding, parameter updates, and UI parameter parity without tautological assertions.

---

## 4. Acceptance Criteria
- [ ] `maskCompositor` node type recognized in preset schema and validator with only lean parameters (`foregroundFrom`, `backgroundFrom`, `maskFrom`, `maskInvert`).
- [ ] `MaskCompositorNode` cleanly composites foreground, background, and mask textures with optional inversion.
- [ ] UI Layer Tree supports adding, configuring, and reordering `maskCompositor` nodes.
- [ ] Parameter Inspector allows selecting buffer tags for foreground, background, and mask via dropdowns, and toggling invert mask.
- [ ] `presets/rainy-ocean-sunset.json` validates and renders cleanly, demonstrating dynamic raindrop reveal of the sunset.
- [ ] All unit, smoke, and Playwright E2E tests pass.

---

## 5. Out of Scope
- Duplicating container features (`opacity`, `outputBlendMode`, `saveTo`, `scale`, `rotation`, `feedback`) on `MaskCompositorNode`; these are provided by nesting inside a `FrameBufferNode`.
- Multi-mask chaining (>3 inputs per single node).
- GPU-side procedural noise generation inside the compositor (handled by Duperscope / procedural buffers).
