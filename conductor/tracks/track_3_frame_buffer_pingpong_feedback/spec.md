# Specification: Track 3 — Modular Frame Buffer, Ping-Pong Feedback & Named Buffers

## 1. Overview & Vision

Track 3 introduces the foundational rendering and compositing primitives of Visualització: the **Frame Buffer**, the **Dual-FBO Ping-Pong Feedback Loop**, **Multi-Pass Blending**, the **Named Buffer Pool (`@NAME`)**, and the **Static Image** component.

Inspired by Winamp AVS and modern GPU post-processing pipelines, this architecture enables:
1. **Master Frame Buffer Root:** A non-deletable root container (`is_master: true`) anchoring every visual preset pipeline and controlling whether the canvas clears each frame (Clean Slate) or accumulates analog motion trails (Feedback Loop).
2. **Dual-FBO Ping-Pong Feedback:** Real-time texture swapping between two offscreen render targets allowing the previous frame's visual output to be scaled, rotated, faded, and composited into the current frame with zero GPU memory stalls.
3. **Multi-Pass Compositing Shader:** A full-screen quad shader executing 6 standard compositing blend modes (`replace`, `additive`, `maximum`, `minimum`, `subtractive`, `multiplicative`) with per-frame opacity and transform modulation.
4. **Named Buffer Routing (`BufferPool`):** Decoupled offscreen texture routing enabling buffers to publish (`save_to: "@NAME"`) and sample (`load_from: "@NAME"`) arbitrary upstream passes with cycle detection and topological sorting.
5. **Static Image Component:** An image texture quad node supporting user-selected images, fit modes (`cover`, `contain`, `stretch`), and modulation.
6. **Curated Frame Buffer Templates:** A catalog of instant presets (Clean Slate, Analog Phosphor Trails, Feedback Vortex, 4-Corner Replicator, Picture-in-Picture Echo, and Beat Shockwave) selectable from the UI.

---

## 2. Functional Requirements

### FR-1: Frame Buffer Node & Render Target Lifecycle
- **Render Target Management:**
  - `FrameBufferNode` manages offscreen `THREE.WebGLRenderTarget` textures matching canvas dimensions.
  - Automatically scales dimensions by `resolution_scale` (0.25x to 1.0x) and clamped device pixel ratio (`Math.min(devicePixelRatio, 2)`).
  - Handles window resize events with debouncing to prevent GPU memory fragmentation.
- **Hierarchical Child Execution:**
  - A Frame Buffer acts as a container for child visual nodes (`VisualNode[]`), recursively executing their render passes into its private FBO before compositing into its parent target.
- **Transform & Layer Modulation:**
  - Exposes 5 modulatable parameters (supporting static values or dynamic expressions):
    - `position_x`: Horizontal translation in $[-1.0, 1.0]$ (`0.0` = center).
    - `position_y`: Vertical translation in $[-1.0, 1.0]$ (`0.0` = center).
    - `scale`: Uniform zoom factor (default: `1.0`).
    - `rotation`: Rotation angle in radians (default: `0.0`).
    - `opacity`: Layer opacity in $[0.0, 1.0]$ (default: `1.0`).

### FR-2: Master Frame Buffer & Dual-FBO Ping-Pong Feedback
- **Master Root Lifecycle:**
  - Every visualizer preset is anchored by a permanent root `FrameBufferNode` (`is_master: true`).
- **Ping-Pong Feedback Architecture:**
  - When feedback is active (any mode with `opacity < 1.0`, non-zero `rotation`, `scale != 1.0`, or feedback blend modes), the node allocates dual ping-pong render targets (`FBO_A` and `FBO_B`).
  - On frame $T$:
    1. Read buffer = previous frame output ($T-1$).
    2. Write buffer = current frame target ($T$).
    3. The read buffer is blended onto the write buffer transformed by `scale`, `rotation`, `position_x`, `position_y`, and `opacity`.
    4. Child components render on top of the feedback layer.
    5. At the end of the frame, read and write buffers are swapped.
- **Clean Slate Mode:**
  - If `blend_mode: "replace"` and `opacity: 1.0` with no feedback transforms, the node renders single-pass with immediate clearing on each frame.

### FR-3: Multi-Pass Blending Shader
- **Compositing Shader:**
  - Custom full-screen quad GLSL shader with uniforms: `uSourceTexture`, `uDestTexture`, `uOpacity`, `uBlendMode`, `uTransformMatrix`.
- **6 Supported Blend Modes:**
  1. `replace`: Direct source overwrite ($C_{out} = C_{src}$).
  2. `additive`: $C_{out} = \min(1.0, C_{dst} + C_{src} \times \text{opacity})$.
  3. `maximum`: $C_{out} = \max(C_{dst}, C_{src} \times \text{opacity})$.
  4. `minimum`: $C_{out} = \min(C_{dst}, C_{src} \times \text{opacity})$.
  5. `subtractive`: $C_{out} = \max(0.0, C_{dst} - C_{src} \times \text{opacity})$.
  6. `multiplicative`: $C_{out} = C_{dst} \times (\mathbf{1} - \text{opacity} + C_{src} \times \text{opacity})$.

### FR-4: Named Buffer Routing (`BufferPool`)
- **Global `BufferPool` Singleton:**
  - Maintains a key-value registry of named textures: `Map<string, THREE.Texture>`.
  - Keys start with `@` (e.g. `@BUFFER_A`, `@SCENE_FEEDBACK`).
- **Production & Consumption:**
  - If a frame buffer defines `save_to: "@NAME"`, its completed render target texture is registered into `BufferPool`.
  - If a frame buffer defines `load_from: "@NAME"`, it samples the referenced texture from `BufferPool` and draws it as its background quad before executing children.
- **Cycle Prevention & Error Diagnostics:**
  - Evaluates topological dependencies among named buffers.
  - If a circular dependency (e.g. `@A` loads `@B` while `@B` loads `@A`) or missing buffer key is detected, the dependent buffer is safely bypassed without terminating the WebGL context, and an error state is flagged.

### FR-5: Static Image Component (`StaticImageNode`)
- **Texture Loading & Caching:**
  - Asynchronously loads image files from URL or local File input into a `THREE.Texture` with mipmapping and linear filtering.
- **Fit Modes:**
  - `cover`: Preserves aspect ratio, scaling image to completely fill the canvas, cropping overflow.
  - `contain`: Preserves aspect ratio, scaling image to fit entirely within the canvas with letterboxing.
  - `stretch`: Non-uniform stretch to exactly match buffer dimensions.
- **Modulatable Parameters:**
  - `opacity`: Alpha multiplier in $[0.0, 1.0]$.
  - `position_x`, `position_y`, `scale`, `rotation`.

### FR-6: Curated Frame Buffer Templates
The system includes 6 built-in, production-ready frame buffer templates selectable from the UI:

1. **Clean Slate Default:**
   - Single-pass crisp rendering with no persistence.
   - `blend_mode: "replace"`, `opacity: 1.0`, `scale: 1.0`, `rotation: 0.0`.
2. **Analog Phosphor Trails:**
   - Warm CRT/oscilloscope persistence motion trails.
   - `blend_mode: "additive"`, `opacity: 0.92`, `scale: 1.0`, `rotation: 0.0`.
3. **Infinite Feedback Vortex:**
   - Audio-reactive hypnotic tunnel zooming into the center.
   - `blend_mode: "additive"`, `opacity: "0.92 - ($BASS * 0.05)"`, `scale: "1.02 + ($BASS * 0.02)"`, `rotation: "0.01"`.
4. **4-Corner Multi-Screen Replicator:**
   - Generator buffer writes to `@BUFFER_A`; four child buffers display `@BUFFER_A` scaled to 0.5 positioned at each corner `(±0.5, ±0.5)`.
5. **Picture-in-Picture (PIP) Echo:**
   - Fullscreen main scene plus a miniature inset feedback monitor in the bottom-right corner (`scale: 0.35`, `position_x: 0.6`, `position_y: -0.6`).
6. **Beat-Pulsed Shockwave Feedback:**
   - Dilation ring that flashes and expands on every kick drum transient.
   - `blend_mode: "screen"`, `opacity: "0.88 + #BEAT(0.2) * 0.08"`, `scale: "1.0 + #BEAT(0.15) * 0.06"`, `rotation: 0.0`.

### FR-7: UI Integration & Template Selector
- **HUD Preset Selector Popover:**
  - Accessible from the top toolbar or preset settings modal.
  - Provides instant one-click template switching.
  - **Dirty-State Confirmation:** If the active frame buffer parameters or child nodes have been customized, switching templates displays a confirmation dialog to prevent accidental overwrites.
- **Live Parameter Controls:**
  - Sliders and `f(x)` expression inputs for `opacity`, `scale`, `rotation`, and `blend_mode` dropdown.

---

## 3. Non-Functional Requirements & Performance
- **Zero-Allocation Render Loop:** All FBO swap pointers, uniform objects, matrices, and quad geometries are pre-allocated during setup. Zero garbage collection objects created per frame.
- **GPU Memory Management:** Dual render targets reuse identical textures across frames. Resizing cleanly disposes of old textures before re-allocation.
- **Context Loss Handling:** Listens for `webglcontextlost` and seamlessly re-creates render targets upon `webglcontextrestored`.

---

## 4. Acceptance Criteria
1. Frame Buffer correctly renders child elements into an offscreen texture and composites to canvas.
2. Dual-FBO ping-pong feedback produces smooth motion trails without flicker or memory leaks.
3. All 6 blend modes operate correctly according to their GLSL mathematical specifications.
4. Named buffers (`save_to` and `load_from`) route textures accurately across multiple passes.
5. Static Image node loads textures and displays them correctly in `cover`, `contain`, and `stretch` modes.
6. All 6 built-in templates load with one click and operate visually as described.
7. Test suite passes with 100% test pass rate and Oxlint reports 0 warnings/0 errors.
8. Final stateless review, logical scope decomposition, and documentation sync protocol executed before track completion.
